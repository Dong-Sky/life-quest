import { describe, expect, it } from "vitest";
import { getCycleKey } from "./recurrence";
import { createPrototypeMilestone, createPrototypeProject, createPrototypeReward, createPrototypeWeeklyPlan, getPrototypeMilestoneProgress, getPrototypeWeeklyReviewSummary, redeemPrototypeReward, settlePrototypeQuest, togglePrototypeRewardWishlist, updatePrototypeMilestone, updatePrototypeProject, updatePrototypeQuest, type PrototypeState } from "./state";

function stateWithRecurringQuest(targetCount: number): PrototypeState {
  const cadence = targetCount === 1 ? "daily" : "weekly";
  return {
    mainlines: [],
    projects: [],
    milestones: [],
    rewards: [],
    redemptions: [],
    reviews: [],
    weeklyPlans: [],
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
    const wishlisted = togglePrototypeRewardWishlist(expensive, expensive.rewards[0].id);
    const insufficient = redeemPrototypeReward(wishlisted, wishlisted.rewards[0].id);

    expect(redeemed.coinBalance).toBe(created.coinBalance - 1);
    expect(redeemed.redemptions[0]).toMatchObject({ rewardName: "看一部电影", coinCost: 1 });
    expect(repeated).toBe(redeemed);
    expect(wishlisted.rewards[0]).toMatchObject({ isWishlisted: true });
    expect(insufficient).toBe(wishlisted);
  });
});


describe("weekly settlement", () => {
  it("rolls to the current week while keeping a prior week's real settlement available", () => {
    const lastWeek = new Date("2026-07-08T09:00:00.000Z");
    const thisWeek = new Date("2026-07-15T09:00:00.000Z");
    const settled = settlePrototypeQuest(stateWithRecurringQuest(1), "recurring-quest", lastWeek);
    const priorSummary = getPrototypeWeeklyReviewSummary(settled, lastWeek);
    const currentSummary = getPrototypeWeeklyReviewSummary(settled, thisWeek);
    const planned = createPrototypeWeeklyPlan(settled, thisWeek, [
      { title: "准备下周汇报", questType: "focus", difficulty: "hard", importance: "goal", resistance: "procrastinated", mainlineId: "career", projectId: "report-project" },
      { title: "", questType: "standard", difficulty: "standard", importance: "helpful", resistance: "none" },
      { title: "安排三次训练", questType: "standard", difficulty: "standard", importance: "helpful", resistance: "none", mainlineId: "health", projectId: "fitness-project" },
    ]);
    const repeated = createPrototypeWeeklyPlan(planned, thisWeek, [
      { title: "准备下周汇报", questType: "focus", difficulty: "hard", importance: "goal", resistance: "procrastinated" },
    ]);

    expect(priorSummary).toMatchObject({ completedQuests: 1, xpEarned: settled.totalXp, coinsEarned: settled.coinBalance });
    expect(currentSummary).toMatchObject({ completedQuests: 0, xpEarned: 0, coinsEarned: 0 });
    expect(planned.weeklyPlans).toHaveLength(1);
    expect(planned.weeklyPlans[0].questIds).toHaveLength(2);
    expect(planned.quests.slice(0, 2).map((quest) => quest.title)).toEqual(["准备下周汇报", "安排三次训练"]);
    expect(planned.quests[0]).toMatchObject({ status: "open", questType: "focus", difficulty: "hard", importance: "goal", resistance: "procrastinated", mainlineId: "career", projectId: "report-project" });
    expect(planned.quests[1]).toMatchObject({ status: "open", mainlineId: "health", projectId: "fitness-project" });
    expect(repeated).toBe(planned);
  });
});
