import { calculateQuestReward } from "@/src/domain/rewards/calculate-quest-reward";
import type { Difficulty, Importance, QuestReward, QuestType, Resistance } from "@/src/domain/rewards/types";

export type QuestStatus = "open" | "completed";
export interface PrototypeQuest {
  id: string; title: string; questType: QuestType; difficulty: Difficulty;
  importance: Importance; resistance: Resistance; status: QuestStatus;
  reward?: QuestReward; completedAt?: string;
}
export interface PrototypeState { quests: PrototypeQuest[]; totalXp: number; coinBalance: number; }
export const PROTOTYPE_KEY = "life-quest-prototype-v1";

export function initialPrototypeState(): PrototypeState {
  return {
    totalXp: 0, coinBalance: 0,
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
    return stored ? JSON.parse(stored) as PrototypeState : initialPrototypeState();
  } catch { return initialPrototypeState(); }
}
export function writePrototypeState(state: PrototypeState) { window.localStorage.setItem(PROTOTYPE_KEY, JSON.stringify(state)); }
export function createPrototypeQuest(state: PrototypeState, draft: Omit<PrototypeQuest, "id" | "status" | "reward" | "completedAt">): PrototypeState {
  const title = draft.title.trim();
  if (!title) return state;
  return { ...state, quests: [{ ...draft, title, id: crypto.randomUUID(), status: "open" }, ...state.quests] };
}
export function settlePrototypeQuest(state: PrototypeState, id: string): PrototypeState {
  const quest = state.quests.find((item) => item.id === id);
  if (!quest || quest.status === "completed") return state;
  const reward = calculateQuestReward(quest);
  return {
    totalXp: state.totalXp + reward.xp, coinBalance: state.coinBalance + reward.coins,
    quests: state.quests.map((item) => item.id === id ? { ...item, status: "completed", completedAt: new Date().toISOString(), reward } : item),
  };
}
