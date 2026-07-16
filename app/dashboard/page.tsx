"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { calculateLevelProgress } from "@/src/domain/rewards/calculate-level";
import { getPrototypeProjectProgress, getPrototypeQuestDeadlines, initialPrototypeState, readPrototypeState, settlePrototypeQuest, type PrototypeQuest, type PrototypeQuestDeadline, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

export default function DashboardPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const complete = (id: string) => setState((current) => {
    const next = settlePrototypeQuest(current, id);
    writePrototypeState(next);
    return next;
  });
  const level = calculateLevelProgress(state.totalXp);
  const deadlines = getPrototypeQuestDeadlines(state);
  const deadlineOrder = new Map(deadlines.map((item, index) => [item.quest.id, index]));
  const open = state.quests
    .filter((quest) => quest.status === "open")
    .sort((left, right) => (deadlineOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (deadlineOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3);

  return <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6"><div><p className="text-sm text-[var(--muted)]">本地测试原型</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">今天，推进一件重要的事。</h1></div><Link className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white hover:bg-black" href="/quests">+ 新建任务</Link></header>
    <section className="mt-7 grid gap-3 sm:grid-cols-3">
      <Card label="当前等级" value={<>Lv. {level.level} <span className="text-sm font-normal text-[var(--muted)]">探索者</span></>} />
      <div className="rounded-xl border border-[var(--line)] bg-white p-4"><div className="flex justify-between text-xs text-[var(--muted)]"><span>距下一等级</span><span>{state.totalXp} / {level.nextLevelXp} XP</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, level.progress * 100)}%` }} /></div></div>
      <Card label="金币余额" value={<>{state.coinBalance} <span className="text-sm font-normal text-[var(--muted)]">coins</span></>} />
    </section>
    {deadlines.length ? <section className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="text-sm font-semibold">临近 DDL</h2><p className="mt-1 text-xs text-[var(--muted)]">优先处理逾期、今天到期和未来三天到期的任务。</p></div><Link className="text-xs font-medium text-[var(--accent)]" href="/quests">管理任务 →</Link></div><div className="mt-3 grid gap-2 sm:grid-cols-2">{deadlines.slice(0, 4).map((item) => <article className="flex items-center justify-between gap-3 rounded-lg border border-amber-100 bg-white px-3 py-2.5" key={item.quest.id}><div className="min-w-0"><p className="truncate text-sm font-medium">{item.quest.title}</p><p className="mt-0.5 text-xs text-[var(--muted)]">DDL：{item.quest.dueDate}</p></div><div className="flex shrink-0 items-center gap-2"><DeadlineBadge deadline={item} /><button aria-label={"完成：" + item.quest.title} className="rounded-md border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-medium hover:border-[var(--success)] hover:text-[var(--success)]" onClick={() => complete(item.quest.id)} type="button">完成</button></div></article>)}</div></section> : null}
    <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.9fr)]">
      <section><div className="flex items-center justify-between"><h2 className="text-base font-semibold">今日三件事</h2><Link className="text-xs text-[var(--accent)]" href="/quests">查看全部</Link></div><div className="mt-3 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-white">{open.length ? open.map((quest) => <article className="flex items-center gap-3 p-4" key={quest.id}><button aria-label={`结算：${quest.title}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--success)] hover:text-[var(--success)]" onClick={() => complete(quest.id)}>✓</button><div className="min-w-0 flex-1"><p className="font-medium">{quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{progressDescription(quest)}</p></div></article>) : <p className="p-6 text-sm text-[var(--muted)]">今天的任务已全部完成。</p>}</div></section>
      <aside className="space-y-6">
        <section><h2 className="text-base font-semibold">最近结算</h2><div className="mt-3 space-y-3">{state.transactions.length ? state.transactions.slice(0, 2).map((transaction) => { const quest = state.quests.find((item) => item.id === transaction.questId); return <article className="rounded-xl border border-[var(--line)] bg-white p-4" key={transaction.id}><p className="font-medium">{quest?.title ?? "已结算任务"}</p><p className="mt-2 text-sm text-[var(--success)]">+{transaction.xpDelta} XP · +{transaction.coinDelta} coins</p></article>; }) : <p className="rounded-xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">完成一项任务后，会在这里留下结算记录。</p>}</div></section>
        <section><div className="flex items-center justify-between"><h2 className="text-base font-semibold">正在推进的主线</h2><Link className="text-xs text-[var(--accent)]" href="/mainlines">管理主线</Link></div><div className="mt-3 space-y-3">{state.mainlines.length ? state.mainlines.slice(0, 3).map((mainline) => { const count = state.quests.filter((quest) => quest.mainlineId === mainline.id && quest.status === "open").length; return <article className="rounded-xl border border-[var(--line)] bg-white p-4" key={mainline.id}><p className="font-medium">{mainline.name}</p><p className="mt-2 text-sm text-[var(--muted)]">{count} 个待推进任务</p></article>; }) : <p className="rounded-xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">先创建一条主线，把每天的行动连接到长期方向。</p>}</div></section>
        <section><div className="flex items-center justify-between"><h2 className="text-base font-semibold">正在推进的副本</h2><Link className="text-xs text-[var(--accent)]" href="/projects">管理副本</Link></div><div className="mt-3 space-y-3">{state.projects.length ? state.projects.slice(0, 3).map((project) => { const progress = getPrototypeProjectProgress(state, project.id); const percent = progress.percent; return <article className="rounded-xl border border-[var(--line)] bg-white p-4" key={project.id}><div className="flex justify-between gap-3"><p className="font-medium">{project.name}</p><span className="text-xs text-[var(--muted)]">{progress.completedXp}/{progress.plannedXp} XP</span></div><p className="mt-1 text-xs text-[var(--muted)]">{progress.completed}/{progress.total} 个行动 · {percent}%</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${percent}%` }} /></div></article>; }) : <p className="rounded-xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">创建一个有终点的副本，并把具体任务关联进来。</p>}</div></section>
      </aside>
    </div>
  </div>;
}

function progressDescription(quest: PrototypeQuest): string {
  if (!quest.recurrence) return "点击圆圈完成并结算";
  const cadence = quest.recurrence.cadence === "daily" ? "今天" : "本周";
  return `${cadence}进度：${quest.recurrence.completedCount} / ${quest.recurrence.targetCount} · 点击记录一次`;
}

function DeadlineBadge({ deadline }: { deadline: PrototypeQuestDeadline }) {
  const label = deadline.status === "overdue" ? "逾期 " + Math.abs(deadline.daysUntil) + " 天" : deadline.status === "today" ? "今天到期" : deadline.daysUntil + " 天后到期";
  const className = deadline.status === "overdue" ? "bg-red-50 text-red-700" : deadline.status === "today" ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-700";
  return <span className={"shrink-0 rounded-full px-2 py-1 text-xs font-medium " + className}>{label}</span>;
}

function Card({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>;
}