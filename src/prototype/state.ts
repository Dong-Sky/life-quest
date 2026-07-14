import { calculateQuestReward } from "@/src/domain/rewards/calculate-quest-reward";
import type { Difficulty, Importance, QuestReward, QuestType, Resistance } from "@/src/domain/rewards/types";

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
  status: QuestStatus;
  reward?: QuestReward;
  completedAt?: string;
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

export function readPrototypeState(): PrototypeState {
  try {
    const stored = window.localStorage.getItem(PROTOTYPE_KEY);
    if (!stored) return initialPrototypeState();

    const initial = initialPrototypeState();
    const parsed = JSON.parse(stored) as Partial<PrototypeState>;
    return {
      ...initial,
      ...parsed,
      mainlines: parsed.mainlines ?? [],
      quests: parsed.quests ?? initial.quests,
      transactions: parsed.transactions ?? [],
    };
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

export function createPrototypeQuest(state: PrototypeState, draft: Omit<PrototypeQuest, "id" | "status" | "reward" | "completedAt">): PrototypeState {
  const title = draft.title.trim();
  if (!title) return state;

  return {
    ...state,
    quests: [{ ...draft, title, id: crypto.randomUUID(), status: "open" }, ...state.quests],
  };
}

export function settlePrototypeQuest(state: PrototypeState, id: string): PrototypeState {
  const quest = state.quests.find((item) => item.id === id);
  if (!quest || quest.status === "completed") return state;

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

  return {
    ...state,
    totalXp: state.totalXp + reward.xp,
    coinBalance: state.coinBalance + reward.coins,
    transactions: [transaction, ...state.transactions],
    quests: state.quests.map((item) => item.id === id ? { ...item, status: "completed", completedAt: createdAt, reward } : item),
  };
}
