"use client";

import Link from "next/link";
import { useState } from "react";
import type { Difficulty, Importance, QuestType, Resistance } from "@/src/domain/rewards/types";
import { createPrototypeWeeklyPlan, getPrototypeWeeklyReviewSummary, getPrototypeWeekKey, initialPrototypeState, readPrototypeState, type PrototypeState, type PrototypeWeeklyPlanQuestDraft, writePrototypeState } from "@/src/prototype/state";

const fieldOptions = {
  questType: [["micro", "微型任务"], ["standard", "普通任务"], ["focus", "重点任务"], ["milestone", "项目里程碑"], ["boss", "Boss 任务"]],
  difficulty: [["easy", "简单"], ["standard", "普通"], ["hard", "困难"], ["epic", "极难"]],
  importance: [["maintenance", "日常维护"], ["helpful", "有帮助"], ["goal", "推动目标"], ["critical", "关键结果"]],
  resistance: [["none", "无明显阻力"], ["reluctant", "有些不想做"], ["procrastinated", "明显拖延"], ["avoided", "长期回避"]],
} as const;

function blankPriority(): PrototypeWeeklyPlanQuestDraft {
  return { title: "", questType: "standard", difficulty: "standard", importance: "helpful", resistance: "none" };
}

export default function ReviewsPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [priorities, setPriorities] = useState<PrototypeWeeklyPlanQuestDraft[]>([blankPriority(), blankPriority(), blankPriority()]);
  const [weekOffset, setWeekOffset] = useState(0);
  const currentDate = new Date();
  const selectedDate = new Date(currentDate);
  selectedDate.setDate(selectedDate.getDate() + weekOffset * 7);
  const selectedWeekKey = getPrototypeWeekKey(selectedDate);
  const isCurrentWeek = weekOffset === 0;
  const summary = getPrototypeWeeklyReviewSummary(state, selectedDate);
  const plan = isCurrentWeek ? state.weeklyPlans.find((item) => item.sourceWeekKey === selectedWeekKey) : undefined;
  const settledQuests = state.quests.filter((quest) => quest.completedAt && getPrototypeWeekKey(new Date(quest.completedAt)) === selectedWeekKey);
  const redeemedThisWeek = state.redemptions.filter((redemption) => getPrototypeWeekKey(new Date(redemption.redeemedAt)) === selectedWeekKey);
  const plannedQuests = plan ? plan.questIds.map((questId) => state.quests.find((quest) => quest.id === questId)).filter(Boolean) : [];
  const wishlist = [...state.rewards].filter((reward) => reward.isWishlisted).sort((a, b) => (b.wishlistedAt ?? "").localeCompare(a.wishlistedAt ?? ""));
  const topWish = wishlist[0];
  const missingCoins = topWish ? Math.max(topWish.coinCost - state.coinBalance, 0) : 0;

  const createPlan = () => {
    const next = createPrototypeWeeklyPlan(state, currentDate, priorities);
    if (next === state) return;
    writePrototypeState(next);
    setState(next);
  };
  const updatePriority = (index: number, update: Partial<PrototypeWeeklyPlanQuestDraft>) => setPriorities((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, ...update } : item));

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6">
      <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-[var(--muted)]">{isCurrentWeek ? "本周结算" : "历史周结算"}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">{isCurrentWeek ? "这一周，已经推进了什么？" : "回看这一周，真正完成了什么？"}</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">像完成副本后的结算一样，先看真实结果；当前周还能把下周行动放入任务清单。</p></div><div className="flex items-center gap-2"><button className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm hover:bg-gray-50" onClick={() => setWeekOffset((value) => value - 1)} type="button">← 上一周</button>{!isCurrentWeek ? <button className="rounded-lg bg-[var(--ink)] px-3 py-2 text-sm text-white" onClick={() => setWeekOffset(0)} type="button">回到本周</button> : null}</div></div>
      <p className="mt-4 text-sm font-medium">{formatWeekRange(selectedDate)}</p>
    </header>

    <section className="mt-6 grid gap-3 sm:grid-cols-4"><Metric label="已结算任务" value={summary.completedQuests} /><Metric label="获得经验" value={`${summary.xpEarned} XP`} /><Metric label="获得金币" value={`${summary.coinsEarned} coins`} /><Metric label="仍待推进" value={summary.openQuests} /></section>

    {topWish ? <section className="mt-6 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm text-[var(--muted)]">愿望单 · 当前最想换</p><h2 className="mt-1 text-lg font-semibold">{topWish.name}</h2><p className="mt-2 text-sm">{missingCoins ? <>还差 <span className="font-semibold text-[var(--accent)]">{missingCoins} coins</span>，继续完成真正重要的任务吧。</> : <span className="font-medium text-[var(--success)]">金币已经足够，可以去兑换了。</span>}</p></div><Link className="rounded-lg border border-[var(--accent)] bg-white px-4 py-2 text-sm font-medium text-[var(--accent)]" href="/rewards">查看愿望单</Link></div></section> : null}

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-xl border border-[var(--line)] bg-white p-5">
        <div><h2 className="text-base font-semibold">本周战报</h2><p className="mt-1 text-xs text-[var(--muted)]">{formatWeekRange(selectedDate)} 的真实任务结算。</p></div>
        {settledQuests.length ? <div className="mt-5 divide-y divide-[var(--line)]">{settledQuests.map((quest) => <article className="flex items-center justify-between gap-3 py-3" key={quest.id}><div className="min-w-0"><p className="truncate text-sm font-medium">{quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">已完成结算</p></div><p className="shrink-0 text-sm text-[var(--muted)]">+{quest.reward?.xp ?? 0} XP · +{quest.reward?.coins ?? 0} coins</p></article>)}</div> : <p className="mt-5 rounded-lg bg-[var(--surface)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">这一周还没有结算任务。</p>}
        <div className="mt-6 border-t border-[var(--line)] pt-5"><h3 className="text-sm font-semibold">本周已兑换奖励</h3>{redeemedThisWeek.length ? <div className="mt-3 space-y-2">{redeemedThisWeek.map((redemption) => <div className="flex items-center justify-between rounded-lg bg-[var(--surface)] px-3 py-2.5 text-sm" key={redemption.id}><span>{redemption.rewardName}</span><span className="text-[var(--success)]">−{redemption.coinCost} coins</span></div>)}</div> : <p className="mt-2 text-sm text-[var(--muted)]">这一周还没有兑换奖励。</p>}</div>
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-white p-5">
        <h2 className="text-base font-semibold">下周三件事</h2><p className="mt-1 text-xs leading-5 text-[var(--muted)]">默认就是普通任务；只有需要时，再展开每一项的设置。</p>
        {!isCurrentWeek ? <div className="mt-5 rounded-lg bg-[var(--surface)] p-4 text-sm leading-6 text-[var(--muted)]">这是历史周结算。切换回本周后，可以为接下来一周创建任务。</div> : plan ? <div className="mt-5"><div className="rounded-lg bg-[var(--surface)] p-4"><p className="text-sm font-medium">已创建 {plannedQuests.length} 项下周任务</p>{plannedQuests.length ? <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">{plannedQuests.map((quest) => <li key={quest?.id}>· {quest?.title}</li>)}</ul> : null}</div><Link className="mt-4 inline-flex rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" href="/quests">前往任务清单</Link></div> : <div className="mt-5 space-y-3">{priorities.map((priority, index) => <fieldset className="rounded-lg border border-[var(--line)] p-3" key={index}><legend className="px-1 text-xs text-[var(--muted)]">第 {index + 1} 件</legend><input className="mt-1 w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => updatePriority(index, { title: event.target.value })} placeholder="下一步要推动的具体行动" value={priority.title} /><details className="mt-3"><summary className="cursor-pointer text-sm text-[var(--muted)] hover:text-[var(--ink)]">设置任务属性（可选）</summary><div className="mt-3 grid gap-2 sm:grid-cols-2"><Select label="任务类型" options={fieldOptions.questType} value={priority.questType} onChange={(value) => updatePriority(index, { questType: value as QuestType })} /><Select label="难度" options={fieldOptions.difficulty} value={priority.difficulty} onChange={(value) => updatePriority(index, { difficulty: value as Difficulty })} /><Select label="重要度" options={fieldOptions.importance} value={priority.importance} onChange={(value) => updatePriority(index, { importance: value as Importance })} /><Select label="心理阻力" options={fieldOptions.resistance} value={priority.resistance} onChange={(value) => updatePriority(index, { resistance: value as Resistance })} /><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>所属主线（可选）</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => updatePriority(index, { mainlineId: event.target.value || undefined })} value={priority.mainlineId ?? ""}><option value="">暂不关联主线</option>{state.mainlines.map((mainline) => <option key={mainline.id} value={mainline.id}>{mainline.name}</option>)}</select></label><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>所属副本（可选）</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => updatePriority(index, { projectId: event.target.value || undefined })} value={priority.projectId ?? ""}><option value="">暂不关联副本</option>{state.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label></div></details></fieldset>)}<button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!priorities.some((priority) => priority.title.trim())} onClick={createPlan} type="button">创建下周任务</button></div>}
      </section>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <article className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></article>; }
function Select({ label, options, value, onChange }: { label: string; options: readonly (readonly [string, string])[]; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>{label}</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>; }
function formatWeekRange(date: Date) { const start = new Date(date); const mondayOffset = (start.getDay() + 6) % 7; start.setDate(start.getDate() - mondayOffset); const end = new Date(start); end.setDate(end.getDate() + 6); const format = (value: Date) => `${value.getMonth() + 1}月${value.getDate()}日`; return `${format(start)} — ${format(end)}`; }
