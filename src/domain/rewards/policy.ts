import type { Difficulty, Importance, QuestType, Resistance } from "./types";

export const REWARD_POLICY_VERSION = "v1" as const;

export const baseXpByQuestType: Record<QuestType, number> = {
  micro: 5,
  standard: 10,
  focus: 20,
  milestone: 50,
  boss: 100,
};

export const difficultyMultipliers: Record<Difficulty, number> = {
  easy: 0.8,
  standard: 1,
  hard: 1.3,
  epic: 1.6,
};

export const importanceMultipliers: Record<Importance, number> = {
  maintenance: 0.8,
  helpful: 1,
  goal: 1.3,
  critical: 1.6,
};

export const resistanceMultipliers: Record<Resistance, number> = {
  none: 1,
  reluctant: 1.1,
  procrastinated: 1.3,
  avoided: 1.5,
};

export const COIN_XP_DIVISOR = 10;
export const MINIMUM_XP_FOR_COINS = 10;
