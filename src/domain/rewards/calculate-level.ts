import type { LevelProgress } from "./types";

/**
 * A level starts at 100 × (level - 1)² cumulative XP.
 * This makes early progression visible without allowing levels to rise linearly.
 */
export function calculateLevelProgress(totalXp: number): LevelProgress {
  if (!Number.isInteger(totalXp) || totalXp < 0) {
    throw new RangeError("totalXp must be a non-negative integer");
  }

  const level = Math.floor(Math.sqrt(totalXp / 100)) + 1;
  const currentLevelStartXp = 100 * (level - 1) ** 2;
  const nextLevelXp = 100 * level ** 2;
  const progress = (totalXp - currentLevelStartXp) / (nextLevelXp - currentLevelStartXp);

  return {
    level,
    currentLevelStartXp,
    nextLevelXp,
    progress,
  };
}
