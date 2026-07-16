"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { calculateLevelProgress } from "@/src/domain/rewards/calculate-level";
import { calculateQuestReward } from "@/src/domain/rewards/calculate-quest-reward";
import { getPrototypeProjectProgress, getPrototypeQuestDeadlines, getPrototypeWeeklyReviewSummary, initialPrototypeState, readPrototypeState, settlePrototypeQuest, type PrototypeQuest, type PrototypeQuestDeadline, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

export default function DashboardPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const complete = (id: string) => setState((current) => {
    const next = settlePrototypeQuest(current, id);
    writePrototypeState(next);
    return next;
  });
  const level = calculateLevelProgress(state.totalXp);
  const weekly = getPrototypeWeeklyReviewSummary(state);
  const deadlines = getPrototypeQuestDeadlines(state);
  const deadlineOrder = new Map(deadlines.map((item, index) => [item.quest.id, index]));
  const open = state.quests
    .filter((quest) => quest.status === "open")
    .sort((left, right) => (deadlineOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (deadlineOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER))
    .slice(0, 3);
  const dateLabel = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "long" }).format(new Date());

  return <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:py-9">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6">
      <div><p className="text-sm font-medium text-[var(--accent)]">今日工作台</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-[32px]">今天，推进一件重要的事。</h1><p className="mt-2 text-sm text-[var(--muted)]">专注当下，积累复利，未来可期。</p></div>
      <div className="flex flex-wrap items-center justify-end gap-3"><p className="text-sm text-[var(--muted)]">{dateLabel}</p><Link className="rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(37,99,235,0.22)] transition hover:bg-blue-700" href="/quests">+ 新建任务</Link></div>
    </header>

    <section className="mt-6 grid gap-3 md:grid-cols-3">
      <StatCard label="当前等级" value={<>Lv. {level.level}</>} detail="稳定积累，每一次结算都算数" accent="blue" />
      <StatCard label="距下一等级" value={Math.max(level.nextLevelXp - state.totalXp, 0) + " XP"} detail={state.totalXp + " / " + level.nextLevelXp + " XP"} accent="blue" progress={level.progress * 100} />
      <StatCard label="金币余额" value={state.coinBalance + " coins"} detail="用努力换取真正想要的奖励" accent="gold" />
    </section>

    {deadlines.length ? <section className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">临近 DDL</h2><p className="mt-1 text-xs text-[var(--muted)]">优先处理逾期、今天到期和未来三天到期的任务。</p></div><Link className="text-xs font-semibold text-[var(--accent)] hover:underline" href="/quests">管理任务 →</Link></div><div className="mt-3 grid gap-2 lg:grid-cols-2">{deadlines.slice(0, 4).map((item) => <DeadlineTask key={item.quest.id} deadline={item} onComplete={complete} />)}</div></section> : null}

    <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
      <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.035)] sm:p-5">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">今日三件事</h2><p className="mt-1 text-xs text-[var(--muted)]">聚焦最重要的三项行动，完成即为胜利。</p></div><Link className="text-xs font-semibold text-[var(--accent)] hover:underline" href="/quests">查看全部</Link></div>
        <div className="mt-4 space-y-2">{open.length ? open.map((quest, index) => <TodayQuest key={quest.id} index={index + 1} quest={quest} state={state} onComplete={complete} />) : <EmptyState text="今天的任务已全部完成。去为下一步留下一件具体行动吧。" href="/quests" action="创建任务" />}</div>
        {open.length ? <Link className="mt-4 inline-flex text-sm font-semibold text-[var(--accent)] hover:underline" href="/quests">+ 添加任务</Link> : null}
      </section>

      <aside className="grid gap-5">
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.035)] sm:p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">最近结算</h2><p className="mt-1 text-xs text-[var(--muted)]">每次完成，都在为自己累积筹码。</p></div><Link className="text-xs font-semibold text-[var(--accent)] hover:underline" href="/reviews">查看全部</Link></div><div className="mt-4 space-y-2">{state.transactions.length ? state.transactions.slice(0, 3).map((transaction) => { const quest = state.quests.find((item) => item.id === transaction.questId); return <article className="flex items-center justify-between gap-3 rounded-xl bg-[#f8fbff] px-3 py-3" key={transaction.id}><p className="min-w-0 truncate text-sm font-medium">{quest?.title ?? "已结算任务"}</p><p className="shrink-0 text-xs font-semibold text-[var(--success)]">+{transaction.xpDelta} XP · +{transaction.coinDelta}</p></article>; }) : <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">完成一项任务后，会在这里留下结算记录。</p>}</div></section>
        <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.035)] sm:p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">本周节奏</h2><Link className="text-xs font-semibold text-[var(--accent)] hover:underline" href="/reviews">查看结算</Link></div><div className="mt-4 grid grid-cols-2 gap-3"><MiniStat label="已结算" value={weekly.completedQuests + " 项"} /><MiniStat label="获得经验" value={weekly.xpEarned + " XP"} /></div><p className="mt-4 text-xs leading-5 text-[var(--muted)]">下一轮会在这里加入 XP 趋势、完成率与连续推进节奏。</p></section>
      </aside>
    </div>

    <section className="mt-6 grid gap-5 lg:grid-cols-2">
      <FocusCollection title="正在推进的主线" href="/mainlines" linkText="查看主线" empty="先创建一条主线，把每天的行动连接到长期方向。">{state.mainlines.slice(0, 2).map((mainline) => { const count = state.quests.filter((quest) => quest.mainlineId === mainline.id && quest.status === "open").length; return <article className="rounded-xl bg-[#f8fbff] p-3.5" key={mainline.id}><p className="text-sm font-semibold">{mainline.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{count} 个待推进任务</p></article>; })}</FocusCollection>
      <FocusCollection title="正在推进的副本" href="/projects" linkText="管理副本" empty="创建一个有终点的副本，并把具体任务关联进来。">{state.projects.slice(0, 2).map((project) => { const progress = getPrototypeProjectProgress(state, project.id); return <article className="rounded-xl bg-[#f8fbff] p-3.5" key={project.id}><div className="flex justify-between gap-3"><p className="min-w-0 truncate text-sm font-semibold">{project.name}</p><span className="shrink-0 text-xs font-semibold text-[var(--accent)]">{progress.percent}%</span></div><p className="mt-1 text-xs text-[var(--muted)]">{progress.completedXp}/{progress.plannedXp} XP 权重</p><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: progress.percent + "%" }} /></div></article>; })}</FocusCollection>
    </section>
  </div>;
}

function TodayQuest({ quest, state, index, onComplete }: { quest: PrototypeQuest; state: PrototypeState; index: number; onComplete: (id: string) => void }) {
  const reward = calculateQuestReward(quest);
  const project = state.projects.find((item) => item.id === quest.projectId);
  const mainline = state.mainlines.find((item) => item.id === quest.mainlineId);
  const context = project ? "副本 · " + project.name : mainline ? "主线 · " + mainline.name : progressDescription(quest);
  return <article className="flex items-center gap-3 rounded-xl border border-[var(--line)] p-3.5 transition hover:border-blue-200 hover:bg-[#fbfdff]"><button aria-label={"结算：" + quest.title} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-sm font-semibold text-[var(--accent)] transition hover:bg-[var(--accent)] hover:text-white" onClick={() => onComplete(quest.id)} type="button">{index}</button><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{quest.title}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{context}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold">{reward.xp} XP</p><p className="mt-1 text-xs text-[var(--gold)]">{reward.coins} coins</p></div></article>;
}

function DeadlineTask({ deadline, onComplete }: { deadline: PrototypeQuestDeadline; onComplete: (id: string) => void }) {
  return <article className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white px-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{deadline.quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">DDL：{deadline.quest.dueDate}</p></div><div className="flex shrink-0 items-center gap-2"><DeadlineBadge deadline={deadline} /><button aria-label={"完成：" + deadline.quest.title} className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-xs font-semibold hover:border-[var(--success)] hover:text-[var(--success)]" onClick={() => onComplete(deadline.quest.id)} type="button">完成</button></div></article>;
}

function FocusCollection({ title, href, linkText, empty, children }: { title: string; href: string; linkText: string; empty: string; children: ReactNode }) {
  return <section className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.035)] sm:p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">{title}</h2><Link className="text-xs font-semibold text-[var(--accent)] hover:underline" href={href}>{linkText} →</Link></div><div className="mt-4 grid gap-2">{children || <p className="rounded-xl border border-dashed border-[var(--line)] p-4 text-sm text-[var(--muted)]">{empty}</p>}</div></section>;
}

function StatCard({ label, value, detail, progress, accent }: { label: string; value: ReactNode; detail: string; progress?: number; accent: "blue" | "gold" }) {
  return <article className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.035)] sm:p-5"><p className="text-sm text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-bold tracking-tight">{value}</p><p className={"mt-2 text-xs " + (accent === "gold" ? "text-amber-600" : "text-[var(--muted)]")}>{detail}</p>{progress !== undefined ? <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: Math.max(4, progress) + "%" }} /></div> : null}</article>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-[#f8fbff] px-3 py-3"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-1 text-lg font-bold">{value}</p></div>;
}

function EmptyState({ text, href, action }: { text: string; href: string; action: string }) {
  return <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center"><p className="text-sm text-[var(--muted)]">{text}</p><Link className="mt-3 inline-flex text-sm font-semibold text-[var(--accent)] hover:underline" href={href}>{action} →</Link></div>;
}

function progressDescription(quest: PrototypeQuest): string {
  if (!quest.recurrence) return "独立行动 · 点击完成并结算";
  const cadence = quest.recurrence.cadence === "daily" ? "今天" : "本周";
  return cadence + "进度：" + quest.recurrence.completedCount + " / " + quest.recurrence.targetCount;
}

function DeadlineBadge({ deadline }: { deadline: PrototypeQuestDeadline }) {
  const label = deadline.status === "overdue" ? "逾期 " + Math.abs(deadline.daysUntil) + " 天" : deadline.status === "today" ? "今天到期" : deadline.daysUntil + " 天后到期";
  const className = deadline.status === "overdue" ? "bg-red-50 text-red-700" : deadline.status === "today" ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-700";
  return <span className={"rounded-full px-2 py-1 text-xs font-semibold " + className}>{label}</span>;
}