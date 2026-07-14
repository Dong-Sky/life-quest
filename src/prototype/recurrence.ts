export type RecurrenceCadence = "daily" | "weekly";

export interface RecurrenceSettings {
  cadence: RecurrenceCadence;
  targetCount: number;
  cycleKey: string;
  completedCount: number;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCycleKey(date: Date, cadence: RecurrenceCadence): string {
  if (cadence === "daily") return dateKey(date);

  const monday = new Date(date);
  const daysSinceMonday = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - daysSinceMonday);
  return dateKey(monday);
}

export function targetCountFor(cadence: RecurrenceCadence, requestedCount?: number): number {
  if (cadence === "daily") return 1;
  return Math.min(7, Math.max(1, Math.round(requestedCount ?? 1)));
}

export function createRecurrenceSettings(cadence: RecurrenceCadence, requestedCount: number | undefined, now: Date): RecurrenceSettings {
  return {
    cadence,
    targetCount: targetCountFor(cadence, requestedCount),
    cycleKey: getCycleKey(now, cadence),
    completedCount: 0,
  };
}

export function isCurrentCycle(recurrence: RecurrenceSettings, now: Date): boolean {
  return recurrence.cycleKey === getCycleKey(now, recurrence.cadence);
}

export function resetForCurrentCycle(recurrence: RecurrenceSettings, now: Date): RecurrenceSettings {
  return {
    ...recurrence,
    cycleKey: getCycleKey(now, recurrence.cadence),
    completedCount: 0,
  };
}
