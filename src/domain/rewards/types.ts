export const questTypes = ["micro", "standard", "focus", "milestone", "boss"] as const;
export const difficulties = ["easy", "standard", "hard", "epic"] as const;
export const importances = ["maintenance", "helpful", "goal", "critical"] as const;
export const resistances = ["none", "reluctant", "procrastinated", "avoided"] as const;

export type QuestType = (typeof questTypes)[number];
export type Difficulty = (typeof difficulties)[number];
export type Importance = (typeof importances)[number];
export type Resistance = (typeof resistances)[number];

export interface QuestRewardInput {
  questType: QuestType;
  difficulty: Difficulty;
  importance: Importance;
  resistance: Resistance;
}

export interface QuestRewardBreakdown {
  baseXp: number;
  difficultyMultiplier: number;
  importanceMultiplier: number;
  resistanceMultiplier: number;
}

export interface QuestReward {
  xp: number;
  coins: number;
  calculationVersion: "v1";
  breakdown: QuestRewardBreakdown;
}

export interface LevelProgress {
  level: number;
  currentLevelStartXp: number;
  nextLevelXp: number;
  progress: number;
}
