import { describe, expect, it } from "vitest";
import { getCycleKey } from "./recurrence";
import { settlePrototypeQuest, type PrototypeState } from "./state";

function stateWithRecurringQuest(targetCount: number): PrototypeState {
  const cadence = targetCount === 1 ? "daily" : "weekly";
  return {
    mainlines: [],
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
