import {
  baseXpByQuestType,
  COIN_XP_DIVISOR,
  difficultyMultipliers,
  importanceMultipliers,
  MINIMUM_XP_FOR_COINS,
  REWARD_POLICY_VERSION,
  resistanceMultipliers,
} from "./policy";
import type { QuestReward, QuestRewardInput } from "./types";

/**
 * Calculates the reward to record at settlement time.
 * Store the returned value with the completed quest; never recalculate history
 * after the policy changes.
 */
export function calculateQuestReward(input: QuestRewardInput): QuestReward {
  const baseXp = baseXpByQuestType[input.questType];
  const difficultyMultiplier = difficultyMultipliers[input.difficulty];
  const importanceMultiplier = importanceMultipliers[input.importance];
  const resistanceMultiplier = resistanceMultipliers[input.resistance];

  const xp = Math.round(
    baseXp * difficultyMultiplier * importanceMultiplier * resistanceMultiplier,
  );

  return {
    xp,
    coins: xp < MINIMUM_XP_FOR_COINS ? 0 : Math.floor(xp / COIN_XP_DIVISOR),
    calculationVersion: REWARD_POLICY_VERSION,
    breakdown: {
      baseXp,
      difficultyMultiplier,
      importanceMultiplier,
      resistanceMultiplier,
    },
  };
}
