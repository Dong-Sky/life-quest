import { describe, expect, it } from "vitest";
import { calculateLevelProgress } from "./calculate-level";
import { calculateQuestReward } from "./calculate-quest-reward";

describe("calculateQuestReward", () => {
  it("calculates a standard task with neutral multipliers", () => {
    expect(
      calculateQuestReward({
        questType: "standard",
        difficulty: "standard",
        importance: "helpful",
        resistance: "none",
      }),
    ).toEqual({
      xp: 10,
      coins: 1,
      calculationVersion: "v1",
      breakdown: {
        baseXp: 10,
        difficultyMultiplier: 1,
        importanceMultiplier: 1,
        resistanceMultiplier: 1,
      },
    });
  });

  it("rounds a high-impact boss reward and records its rule version", () => {
    const reward = calculateQuestReward({
      questType: "boss",
      difficulty: "hard",
      importance: "critical",
      resistance: "avoided",
    });

    expect(reward.xp).toBe(312);
    expect(reward.coins).toBe(31);
    expect(reward.calculationVersion).toBe("v1");
  });

  it("does not award coins for a tiny reward below ten XP", () => {
    expect(
      calculateQuestReward({
        questType: "micro",
        difficulty: "easy",
        importance: "maintenance",
        resistance: "none",
      }),
    ).toMatchObject({ xp: 3, coins: 0 });
  });
});

describe("calculateLevelProgress", () => {
  it.each([
    [0, 1, 0, 100],
    [100, 2, 100, 400],
    [400, 3, 400, 900],
  ])("maps %i XP to level %i", (xp, level, start, next) => {
    expect(calculateLevelProgress(xp)).toMatchObject({
      level,
      currentLevelStartXp: start,
      nextLevelXp: next,
    });
  });

  it("rejects invalid XP balances", () => {
    expect(() => calculateLevelProgress(-1)).toThrow(RangeError);
    expect(() => calculateLevelProgress(4.5)).toThrow(RangeError);
  });
});
