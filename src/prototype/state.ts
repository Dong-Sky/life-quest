import { calculateQuestReward } from "../domain/rewards/calculate-quest-reward";
import { createRecurrenceSettings, isCurrentCycle, resetForCurrentCycle, type RecurrenceCadence, type RecurrenceSettings } from "./recurrence";
import type { Difficulty, Importance, QuestReward, QuestType, Resistance } from "../domain/rewards/types";

export type QuestStatus = "open" | "completed";
export type MainlineStatus = "active";

export interface PrototypeMainline {
  id: string;
  name: string;
  vision: string;
  status: MainlineStatus;
  createdAt: string;
}

export interface PrototypeQuest {
  id: string;
  title: string;
  questType: QuestType;
  difficulty: Difficulty;
  importance: Importance;
  resistance: Resistance;
  mainlineId?: string;
  recurrence?: RecurrenceSettings;
  status: QuestStatus;
  reward?: QuestReward;
  completedAt?: string;
}

export interface PrototypeQuestDraft {
  title: string;
  questType: QuestType;
  difficulty: Difficulty;
  importance: Importance;
  resistance: Resistance;
  mainlineId?: string;
  recurrence?: {
    cadence: RecurrenceCadence;
    targetCount?: number;
  };
}

export interface PrototypeTransaction {
  id: string;
  questId: string;
  xpDelta: number;
  coinDelta: number;
  calculationVersion: string;
  createdAt: string;
}

export interface PrototypeState {
  mainlines: PrototypeMainline[];
  quests: PrototypeQuest[];
  totalXp: number;
  coinBalance: number;
  transactions: PrototypeTransaction[];
}

export const PROTOTYPE_KEY = "life-quest-prototype-v1";

export function initialPrototypeState(): PrototypeState {
  return {
    mainlines: [],
    totalXp: 0,
    coinBalance: 0,
    transactions: [],
    quests: [
      { id: "starter-1", title: "明确本周最重要的成果", questType: "focus", difficulty: "standard", importance: "goal", resistance: "none", status: "open" },
      { id: "starter-2", title: "完成一次任务结算体验记录", questType: "standard", difficulty: "standard", importance: "helpful", resistance: "none", status: "open" },
      { id: "starter-3", title: "整理一个待推进的副本", questType: "focus", difficulty: "hard", importance: "goal", resistance: "procrastinated", status: "open" },
    ],
  };
}

export function refreshPrototypeStateForCurrentCycle(state: PrototypeState, now = new Date()): PrototypeState {
  let changed = false;
  const quests = state.quests.map((quest) => {
    if (!quest.recurrence || isCurrentCycle(quest.recurrence, now)) return quest;

    changed = true;
    return {
      ...quest,
      status: "open" as const,
      reward: undefined,
      completedAt: undefined,
      recurrence: resetForCurrentCycle(quest.recurrence, now),
    };
  });

  return changed ? { ...state, quests } : state;
}

export function readPrototypeState(): PrototypeState {
  try {
    const stored = window.localStorage.getItem(PROTOTYPE_KEY);
    if (!stored) return initialPrototypeState();

    const initial = initialPrototypeState();
    const parsed = JSON.parse(stored) as Partial<PrototypeState>;
    const hydrated = {
      ...initial,
      ...parsed,
      mainlines: parsed.mainlines ?? [],
      quests: parsed.quests ?? initial.quests,
      transactions: parsed.transactions ?? [],
    };
    const refreshed = refreshPrototypeStateForCurrentCycle(hydrated);
    if (refreshed !== hydrated) writePrototypeState(refreshed);
    return refreshed;
  } catch {
    return initialPrototypeState();
  }
}

export function writePrototypeState(state: PrototypeState) {
  window.localStorage.setItem(PROTOTYPE_KEY, JSON.stringify(state));
}

export function createPrototypeMainline(state: PrototypeState, draft: Pick<PrototypeMainline, "name" | "vision">): PrototypeState {
  const name = draft.name.trim();
  if (!name) return state;

  return {
    ...state,
    mainlines: [{
      id: crypto.randomUUID(),
      name,
      vision: draft.vision.trim(),
      status: "active",
      createdAt: new Date().toISOString(),
    }, ...state.mainlines],
  };
}

export function createPrototypeQuest(state: PrototypeState, draft: PrototypeQuestDraft): PrototypeState {
  const title = draft.title.trim();
  if (!title) return state;

  const now = new Date();
  const recurrence = draft.recurrence
    ? createRecurrenceSettings(draft.recurrence.cadence, draft.recurrence.targetCount, now)
    : undefined;

  return {
    ...state,
    quests: [{
      ...draft,
      title,
      recurrence,
      id: crypto.randomUUID(),
      status: "open",
    }, ...state.quests],
  };
}

export function settlePrototypeQuest(state: PrototypeState, id: string): PrototypeState {
  const refreshed = refreshPrototypeStateForCurrentCycle(state);
  const quest = refreshed.quests.find((item) => item.id === id);
  if (!quest || quest.status === "completed") return refreshed;

  const reward = calculateQuestReward(quest);
  const createdAt = new Date().toISOString();
  const transaction: PrototypeTransaction = {
    id: crypto.randomUUID(),
    questId: quest.id,
    xpDelta: reward.xp,
    coinDelta: reward.coins,
    calculationVersion: reward.calculationVersion,
    createdAt,
  };

  const nextCompletedCount = quest.recurrence
    ? quest.recurrence.completedCount + 1
    : 1;
  const isComplete = !quest.recurrence || nextCompletedCount >= quest.recurrence.targetCount;

  return {
    ...refreshed,
    totalXp: refreshed.totalXp + reward.xp,
    coinBalance: refreshed.coinBalance + reward.coins,
    transactions: [transaction, ...refreshed.transactions],
    quests: refreshed.quests.map((item) => item.id === id ? {
      ...item,
      status: isComplete ? "completed" : "open",
      reward,
      completedAt: isComplete ? createdAt : undefined,
      recurrence: item.recurrence ? { ...item.recurrence, completedCount: nextCompletedCount } : undefined,
    } : item),
  };
}