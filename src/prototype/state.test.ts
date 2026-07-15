import { describe, expect, it } from "vitest";
import { getCycleKey } from "./recurrence";
import { createPrototypeMilestone, createPrototypeProject, createPrototypeReward, getPrototypeMilestoneProgress, getPrototypeWeeklyReviewSummary, redeemPrototypeReward, settlePrototypeQuest, updatePrototypeMilestone, updatePrototypeProject, updatePrototypeQuest, upsertPrototypeWeeklyReview, type PrototypeState } from "./state";

function stateWithRecurringQuest(targetCount: number): PrototypeState {
  const cadence = targetCount === 1 ? "daily" : "weekly";
  return {
    mainlines: [],
    projects: [],
    milestones: [],
    rewards: [],
    redemptions: [],
    reviews: [],
    totalXp: 0,
    coinBalance: 0,
    transactions: [],
    quests: [{
      id: "recurring-quest",
      title: "锻炼 30 分钟",
      questType: "standard",
      difficulty: "standard",
      importance: "helpful",
      resistance: "none",
      status: "open",
      recurrence: {
        cadence,
        targetCount,
        completedCount: 0,
        cycleKey: getCycleKey(new Date(), cadence),
      },
    }],
  };
}

describe("recurring quest settlement", () => {
  it("settles a daily quest only once in its current day", () => {
    const once = settlePrototypeQuest(stateWithRecurringQuest(1), "recurring-quest");
    const twice = settlePrototypeQuest(once, "recurring-quest");

    expect(once.transactions).toHaveLength(1);
    expect(once.quests[0].status).toBe("completed");
    expect(twice).toBe(once);
  });

  it("settles a weekly quest until its target is reached", () => {
    const first = settlePrototypeQuest(stateWithRecurringQuest(3), "recurring-quest");
    const second = settlePrototypeQuest(first, "recurring-quest");
    const third = settlePrototypeQuest(second, "recurring-quest");
    const fourth = settlePrototypeQuest(third, "recurring-quest");

    expect(first.quests[0].recurrence?.completedCount).toBe(1);
    expect(first.quests[0].status).toBe("open");
    expect(second.quests[0].recurrence?.completedCount).toBe(2);
    expect(third.quests[0].recurrence?.completedCount).toBe(3);
    expect(third.quests[0].status).toBe("completed");
    expect(third.transactions).toHaveLength(3);
    expect(fourth).toBe(third);
  });
});

describe("project creation and editing", () => {
  it("stores a project with its success condition and target date", () => {
    const next = createPrototypeProject(stateWithRecurringQuest(1), {
      name: "12 周减脂计划",
      victoryCondition: "完成全部训练与复盘",
      mainlineId: "health",
      dueDate: "2026-10-01",
    });

    expect(next.projects[0]).toMatchObject({
      name: "12 周减脂计划",
      victoryCondition: "完成全部训练与复盘",
      mainlineId: "health",
      dueDate: "2026-10-01",
      status: "active",
    });
  });

  it("can attach or clear a mainline after a project was created", () => {
    const created = createPrototypeProject(stateWithRecurringQuest(1), { name: "旅行计划", victoryCondition: "" });
    const attached = updatePrototypeProject(created, created.projects[0].id, { name: "旅行计划", victoryCondition: "完成行程和复盘", mainlineId: "relationship", dueDate: "2026-12-01" });
    const cleared = updatePrototypeProject(attached, attached.projects[0].id, { name: "旅行计划", victoryCondition: "完成行程和复盘", mainlineId: undefined, dueDate: undefined });

    expect(attached.projects[0].mainlineId).toBe("relationship");
    expect(cleared.projects[0]).toMatchObject({ mainlineId: undefined, dueDate: undefined });
  });
});

describe("quest editing", () => {
  it("reassigns a settled quest without changing its existing reward ledger", () => {
    const initial = stateWithRecurringQuest(1);
    initial.quests[0] = { ...initial.quests[0], recurrence: undefined };
    const settled = settlePrototypeQuest(initial, "recurring-quest");
    const updated = updatePrototypeQuest(settled, "recurring-quest", { title: "完成锻炼记录", mainlineId: "health", projectId: "fitness-project" });

    expect(updated.quests[0]).toMatchObject({ title: "完成锻炼记录", mainlineId: "health", projectId: "fitness-project", reward: settled.quests[0].reward });
    expect(updated.totalXp).toBe(settled.totalXp);
    expect(updated.coinBalance).toBe(settled.coinBalance);
    expect(updated.transactions).toEqual(settled.transactions);
  });
});

describe("automatic project milestones", () => {
  it("completes only after every linked project quest is settled, without extra rewards", () => {
    const projectState = createPrototypeProject(stateWithRecurringQuest(1), { name: "12 周减脂计划", victoryCondition: "" });
    const projectId = projectState.projects[0].id;
    const linkedQuestState: PrototypeState = {
      ...projectState,
      quests: [{ ...projectState.quests[0], recurrence: undefined, projectId }],
    };
    const created = createPrototypeMilestone(linkedQuestState, projectId, "完成第一周训练安排", ["recurring-quest"]);
    const beforeSettlement = getPrototypeMilestoneProgress(created, created.milestones[0]);
    const settled = settlePrototypeQuest(created, "recurring-quest");
    const afterSettlement = getPrototypeMilestoneProgress(settled, settled.milestones[0]);
    const edited = updatePrototypeMilestone(settled, settled.milestones[0].id, "完成第一周训练与复盘", ["recurring-quest"]);

    expect(beforeSettlement).toMatchObject({ total: 1, completed: 0, isCompleted: false });
    expect(afterSettlement).toMatchObject({ total: 1, completed: 1, isCompleted: true });
    expect(edited.milestones[0]).toMatchObject({ title: "完成第一周训练与复盘", questIds: ["recurring-quest"] });
    expect(settled.transactions).toHaveLength(1);
  });
});


describe("reward store", () => {
  it("redeems a custom reward once without allowing a negative balance or duplicate one-time redemption", () => {
    const settled = settlePrototypeQuest(stateWithRecurringQuest(1), "recurring-quest");
    const created = createPrototypeReward(settled, { name: "看一部电影", coinCost: 1, isRepeatable: false });
    const redeemed = redeemPrototypeReward(created, created.rewards[0].id);
    const repeated = redeemPrototypeReward(redeemed, created.rewards[0].id);
    const expensive = createPrototypeReward(redeemed, { name: "升级一次旅行体验", coinCost: 100, isRepeatable: true });
    const insufficient = redeemPrototypeReward(expensive, expensive.rewards[0].id);

    expect(redeemed.coinBalance).toBe(created.coinBalance - 1);
    expect(redeemed.redemptions[0]).toMatchObject({ rewardName: "看一部电影", coinCost: 1 });
    expect(repeated).toBe(redeemed);
    expect(insufficient).toBe(expensive);
  });
});


describe("weekly review", () => {
  it("summarizes current-week settlements and saves one review per week", () => {
    const now = new Date("2026-07-15T09:00:00.000Z");
    const settled = settlePrototypeQuest(stateWithRecurringQuest(1), "recurring-quest");
    const summary = getPrototypeWeeklyReviewSummary(settled, now);
    const first = upsertPrototypeWeeklyReview(settled, now, { wins: "完成运动", blockers: "下班较晚", nextPriorities: ["安排训练", "准备餐食", ""] });
    const second = upsertPrototypeWeeklyReview(first, now, { wins: "保持行动", blockers: "", nextPriorities: ["复盘计划"] });

    expect(summary).toMatchObject({ completedQuests: 1, xpEarned: settled.totalXp, coinsEarned: settled.coinBalance });
    expect(first.reviews[0]).toMatchObject({ wins: "完成运动", nextPriorities: ["安排训练", "准备餐食"] });
    expect(second.reviews).toHaveLength(1);
    expect(second.reviews[0]).toMatchObject({ wins: "保持行动", nextPriorities: ["复盘计划"] });
  });
});
