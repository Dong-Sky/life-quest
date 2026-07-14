import { describe, expect, it } from "vitest";
import { createRecurrenceSettings, getCycleKey, targetCountFor } from "./recurrence";

describe("recurring quest cycle rules", () => {
  it("uses the local calendar date for daily cycles", () => {
    expect(getCycleKey(new Date(2026, 6, 14, 9), "daily")).toBe("2026-07-14");
  });

  it("uses Monday as the beginning of a weekly cycle", () => {
    expect(getCycleKey(new Date(2026, 6, 13, 9), "weekly")).toBe("2026-07-13");
    expect(getCycleKey(new Date(2026, 6, 19, 9), "weekly")).toBe("2026-07-13");
    expect(getCycleKey(new Date(2026, 6, 20, 9), "weekly")).toBe("2026-07-20");
  });

  it("requires one completion for a daily recurring quest", () => {
    expect(targetCountFor("daily", 5)).toBe(1);
  });

  it("keeps weekly targets within one to seven completions", () => {
    expect(targetCountFor("weekly", 0)).toBe(1);
    expect(targetCountFor("weekly", 3)).toBe(3);
    expect(targetCountFor("weekly", 10)).toBe(7);
  });

  it("creates a fresh weekly progress record", () => {
    expect(createRecurrenceSettings("weekly", 3, new Date(2026, 6, 14))).toEqual({
      cadence: "weekly",
      targetCount: 3,
      cycleKey: "2026-07-13",
      completedCount: 0,
    });
  });
});
