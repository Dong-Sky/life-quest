import { calculateQuestReward } from "../domain/rewards/calculate-quest-reward";
import { createRecurrenceSettings, isCurrentCycle, resetForCurrentCycle, type RecurrenceCadence, type RecurrenceSettings } from "./recurrence";
import type { Difficulty, Importance, QuestReward, QuestType, Resistance } from "../domain/rewards/types";

export type QuestStatus = "open" | "completed";
export type MainlineStatus = "active";
export type ProjectStatus = "active";

export interface PrototypeMainline {
  id: string;
  name: string;
  vision: string;
  status: MainlineStatus;
  createdAt: string;
}

export interface PrototypeProject {
  id: string;
  name: string;
  victoryCondition: string;
  mainlineId?: string;
  dueDate?: string;
  status: ProjectStatus;
  createdAt: string;
}

export interface PrototypeMilestone {
  id: string;
  projectId: string;
  title: string;
  questIds: string[];
  createdAt: string;
}

export interface PrototypeMilestoneProgress {
  total: number;
  completed: number;
  isCompleted: boolean;
}

export interface PrototypeReward {
  id: string;
  name: string;
  coinCost: number;
  isRepeatable: boolean;
  isWishlisted: boolean;
  wishlistedAt?: string;
  createdAt: string;
}

export interface PrototypeRewardDraft {
  name: string;
  coinCost: number;
  isRepeatable: boolean;
  isWishlisted?: boolean;
}

export interface PrototypeRewardRedemption {
  id: string;
  rewardId: string;
  rewardName: string;
  coinCost: number;
  redeemedAt: string;
}

export interface PrototypeWeeklyReview {
  id: string;
  weekKey: string;
  wins: string;
  blockers: string;
  nextPriorities: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PrototypeWeeklyReviewSummary {
  weekKey: string;
  completedQuests: number;
  openQuests: number;
  xpEarned: number;
  coinsEarned: number;
}

export interface PrototypeWeeklyPlan {
  id: string;
  sourceWeekKey: string;
  questIds: string[];
  createdAt: string;
}

export interface PrototypeWeeklyPlanQuestDraft {
  title: string;
  questType: QuestType;
  difficulty: Difficulty;
  importance: Importance;
  resistance: Resistance;
  mainlineId?: string;
  projectId?: string;
}

export interface PrototypeQuest {
  id: string;
  title: string;
  questType: QuestType;
  difficulty: Difficulty;
  importance: Importance;
  resistance: Resistance;
  mainlineId?: string;
  projectId?: string;
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
  projectId?: string;
  recurrence?: {
    cadence: RecurrenceCadence;
    targetCount?: number;
  };
}

export interface PrototypeQuestEdit {
  title: string;
  mainlineId?: string;
  projectId?: string;
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
  projects: PrototypeProject[];
  milestones: PrototypeMilestone[];
  rewards: PrototypeReward[];
  redemptions: PrototypeRewardRedemption[];
  reviews: PrototypeWeeklyReview[];
  weeklyPlans: PrototypeWeeklyPlan[];
  quests: PrototypeQuest[];
  totalXp: number;
  coinBalance: number;
  transactions: PrototypeTransaction[];
}

export const PROTOTYPE_KEY = "life-quest-prototype-v1";
export const PROTOTYPE_STATE_EVENT = "life-quest:state-updated";

export function initialPrototypeState(): PrototypeState {
  return {
    mainlines: [],
    projects: [],
    milestones: [],
    rewards: [],
    redemptions: [],
    reviews: [],
    weeklyPlans: [],
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
      projects: parsed.projects ?? [],
      milestones: (parsed.milestones ?? []).map((milestone) => ({ ...milestone, questIds: milestone.questIds ?? [] })),
      rewards: (parsed.rewards ?? []).map((reward) => ({
        ...reward,
        isWishlisted: reward.isWishlisted ?? false,
      })),
      redemptions: parsed.redemptions ?? [],
      reviews: parsed.reviews ?? [],
      weeklyPlans: parsed.weeklyPlans ?? [],
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
  window.dispatchEvent(new Event(PROTOTYPE_STATE_EVENT));
}

export function getPrototypeWeekKey(date = new Date()): string {
  const local = new Date(date);
  const mondayOffset = (local.getDay() + 6) % 7;
  local.setDate(local.getDate() - mondayOffset);
  local.setHours(0, 0, 0, 0);
  return [local.getFullYear(), String(local.getMonth() + 1).padStart(2, "0"), String(local.getDate()).padStart(2, "0")].join("-");
}

export function getPrototypeWeeklyReviewSummary(state: PrototypeState, now = new Date()): PrototypeWeeklyReviewSummary {
  const weekKey = getPrototypeWeekKey(now);
  const isCurrentWeek = (timestamp: string | undefined) => {
    if (!timestamp) return false;
    return getPrototypeWeekKey(new Date(timestamp)) === weekKey;
  };
  const transactions = state.transactions.filter((transaction) => isCurrentWeek(transaction.createdAt));
  return {
    weekKey,
    completedQuests: state.quests.filter((quest) => isCurrentWeek(quest.completedAt)).length,
    openQuests: state.quests.filter((quest) => quest.status === "open").length,
    xpEarned: transactions.reduce((total, transaction) => total + transaction.xpDelta, 0),
    coinsEarned: transactions.reduce((total, transaction) => total + transaction.coinDelta, 0),
  };
}

export function createPrototypeWeeklyPlan(state: PrototypeState, now: Date, drafts: PrototypeWeeklyPlanQuestDraft[]): PrototypeState {
  const sourceWeekKey = getPrototypeWeekKey(now);
  if (state.weeklyPlans.some((plan) => plan.sourceWeekKey === sourceWeekKey)) return state;

  const uniqueDrafts = drafts
    .map((draft) => ({ ...draft, title: draft.title.trim() }))
    .filter((draft, index, items) => Boolean(draft.title) && items.findIndex((item) => item.title === draft.title) === index)
    .slice(0, 3);
  if (!uniqueDrafts.length) return state;

  const createdAt = now.toISOString();
  const quests = uniqueDrafts.map((draft) => ({
    id: crypto.randomUUID(),
    ...draft,
    mainlineId: draft.mainlineId || undefined,
    projectId: draft.projectId || undefined,
    status: "open" as const,
  }));
  const plan: PrototypeWeeklyPlan = {
    id: crypto.randomUUID(),
    sourceWeekKey,
    questIds: quests.map((quest) => quest.id),
    createdAt,
  };

  return {
    ...state,
    quests: [...quests, ...state.quests],
    weeklyPlans: [plan, ...state.weeklyPlans],
  };
}

export interface PrototypeWeeklyRhythm {
  summary: PrototypeWeeklyReviewSummary;
  nextQuest?: PrototypeQuest;
  topWish?: PrototypeReward;
  missingCoins?: number;
}

export function getPrototypeWeeklyRhythm(state: PrototypeState, now = new Date()): PrototypeWeeklyRhythm {
  const urgency: Record<QuestType, number> = { micro: 1, standard: 2, focus: 3, milestone: 4, boss: 5 };
  const importance: Record<Importance, number> = { maintenance: 1, helpful: 2, goal: 3, critical: 4 };
  const nextQuest = [...state.quests]
    .filter((quest) => quest.status === "open")
    .sort((left, right) => urgency[right.questType] * 10 + importance[right.importance] - (urgency[left.questType] * 10 + importance[left.importance]))[0];
  const topWish = [...state.rewards]
    .filter((reward) => reward.isWishlisted)
    .sort((left, right) => (right.wishlistedAt ?? "").localeCompare(left.wishlistedAt ?? ""))[0];

  return {
    summary: getPrototypeWeeklyReviewSummary(state, now),
    nextQuest,
    topWish,
    missingCoins: topWish ? Math.max(topWish.coinCost - state.coinBalance, 0) : undefined,
  };
}

export function upsertPrototypeWeeklyReview(state: PrototypeState, now: Date, draft: Pick<PrototypeWeeklyReview, "wins" | "blockers" | "nextPriorities">): PrototypeState {
  const weekKey = getPrototypeWeekKey(now);
  const timestamp = now.toISOString();
  const review = {
    weekKey,
    wins: draft.wins.trim(),
    blockers: draft.blockers.trim(),
    nextPriorities: draft.nextPriorities.map((item) => item.trim()).filter(Boolean).slice(0, 3),
    updatedAt: timestamp,
  };
  const existing = state.reviews.find((item) => item.weekKey === weekKey);
  if (existing) {
    return { ...state, reviews: state.reviews.map((item) => item.id === existing.id ? { ...item, ...review } : item) };
  }
  return { ...state, reviews: [{ id: crypto.randomUUID(), ...review, createdAt: timestamp }, ...state.reviews] };
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

export function updatePrototypeMainline(state: PrototypeState, id: string, draft: Pick<PrototypeMainline, "name" | "vision">): PrototypeState {
  const name = draft.name.trim();
  if (!name || !state.mainlines.some((mainline) => mainline.id === id)) return state;

  return {
    ...state,
    mainlines: state.mainlines.map((mainline) => mainline.id === id ? {
      ...mainline,
      name,
      vision: draft.vision.trim(),
    } : mainline),
  };
}

export function createPrototypeProject(state: PrototypeState, draft: Pick<PrototypeProject, "name" | "victoryCondition" | "mainlineId" | "dueDate">): PrototypeState {
  const name = draft.name.trim();
  if (!name) return state;

  return {
    ...state,
    projects: [{
      id: crypto.randomUUID(),
      name,
      victoryCondition: draft.victoryCondition.trim(),
      mainlineId: draft.mainlineId || undefined,
      dueDate: draft.dueDate || undefined,
      status: "active",
      createdAt: new Date().toISOString(),
    }, ...state.projects],
  };
}

export function updatePrototypeProject(state: PrototypeState, id: string, draft: Pick<PrototypeProject, "name" | "victoryCondition" | "mainlineId" | "dueDate">): PrototypeState {
  const name = draft.name.trim();
  if (!name || !state.projects.some((project) => project.id === id)) return state;

  return {
    ...state,
    projects: state.projects.map((project) => project.id === id ? {
      ...project,
      name,
      victoryCondition: draft.victoryCondition.trim(),
      mainlineId: draft.mainlineId || undefined,
      dueDate: draft.dueDate || undefined,
    } : project),
  };
}

function validMilestoneQuestIds(state: PrototypeState, projectId: string, questIds: string[]): string[] {
  const availableIds = new Set(state.quests.filter((quest) => quest.projectId === projectId).map((quest) => quest.id));
  return [...new Set(questIds)].filter((questId) => availableIds.has(questId));
}

export function createPrototypeMilestone(state: PrototypeState, projectId: string, title: string, questIds: string[] = []): PrototypeState {
  const trimmedTitle = title.trim();
  if (!trimmedTitle || !state.projects.some((project) => project.id === projectId)) return state;

  return {
    ...state,
    milestones: [{
      id: crypto.randomUUID(),
      projectId,
      title: trimmedTitle,
      questIds: validMilestoneQuestIds(state, projectId, questIds),
      createdAt: new Date().toISOString(),
    }, ...state.milestones],
  };
}

export function updatePrototypeMilestone(state: PrototypeState, id: string, title: string, questIds: string[]): PrototypeState {
  const milestone = state.milestones.find((item) => item.id === id);
  const trimmedTitle = title.trim();
  if (!milestone || !trimmedTitle) return state;

  return {
    ...state,
    milestones: state.milestones.map((item) => item.id === id ? {
      ...item,
      title: trimmedTitle,
      questIds: validMilestoneQuestIds(state, item.projectId, questIds),
    } : item),
  };
}

export function getPrototypeMilestoneProgress(state: PrototypeState, milestone: PrototypeMilestone): PrototypeMilestoneProgress {
  const total = milestone.questIds.length;
  const completed = milestone.questIds.filter((questId) => state.quests.some((quest) => quest.id === questId && quest.status === "completed")).length;
  return { total, completed, isCompleted: total > 0 && completed === total };
}

export function createPrototypeReward(state: PrototypeState, draft: PrototypeRewardDraft): PrototypeState {
  const name = draft.name.trim();
  const coinCost = Math.floor(draft.coinCost);
  if (!name || !Number.isFinite(coinCost) || coinCost < 1) return state;

  return {
    ...state,
    rewards: [{
      id: crypto.randomUUID(),
      name,
      coinCost,
      isRepeatable: draft.isRepeatable,
      isWishlisted: draft.isWishlisted ?? false,
      wishlistedAt: draft.isWishlisted ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    }, ...state.rewards],
  };
}

export function togglePrototypeRewardWishlist(state: PrototypeState, rewardId: string): PrototypeState {
  const reward = state.rewards.find((item) => item.id === rewardId);
  if (!reward) return state;

  const isWishlisted = !reward.isWishlisted;
  return {
    ...state,
    rewards: state.rewards.map((item) => item.id === rewardId ? {
      ...item,
      isWishlisted,
      wishlistedAt: isWishlisted ? new Date().toISOString() : undefined,
    } : item),
  };
}

export function redeemPrototypeReward(state: PrototypeState, rewardId: string): PrototypeState {
  const reward = state.rewards.find((item) => item.id === rewardId);
  if (!reward || state.coinBalance < reward.coinCost) return state;
  if (!reward.isRepeatable && state.redemptions.some((redemption) => redemption.rewardId === rewardId)) return state;

  return {
    ...state,
    coinBalance: state.coinBalance - reward.coinCost,
    redemptions: [{
      id: crypto.randomUUID(),
      rewardId: reward.id,
      rewardName: reward.name,
      coinCost: reward.coinCost,
      redeemedAt: new Date().toISOString(),
    }, ...state.redemptions],
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

export function updatePrototypeQuest(state: PrototypeState, id: string, draft: PrototypeQuestEdit): PrototypeState {
  const title = draft.title.trim();
  const quest = state.quests.find((item) => item.id === id);
  if (!quest || !title) return state;

  return {
    ...state,
    quests: state.quests.map((item) => item.id === id ? {
      ...item,
      title,
      mainlineId: draft.mainlineId || undefined,
      projectId: item.recurrence ? undefined : draft.projectId || undefined,
    } : item),
  };
}

export function settlePrototypeQuest(state: PrototypeState, id: string, now = new Date()): PrototypeState {
  const refreshed = refreshPrototypeStateForCurrentCycle(state, now);
  const quest = refreshed.quests.find((item) => item.id === id);
  if (!quest || quest.status === "completed") return refreshed;

  const reward = calculateQuestReward(quest);
  const createdAt = now.toISOString();
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
