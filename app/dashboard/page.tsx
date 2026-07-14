"use client";

import Link from "next/link";
import { useState } from "react";
import { calculateLevelProgress } from "@/src/domain/rewards/calculate-level";
import { initialPrototypeState, readPrototypeState, settlePrototypeQuest, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

export default function DashboardPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const complete = (id: string) => setState((current) => { const next = settlePrototypeQuest(current, id); writePrototypeState(next); return next; });
  const level = calculateLevelProgress(state.totalXp);
  const open = state.quests.filter((quest) => quest.status === "open").slice(0, 3);

  return <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6"><div><p className="text-sm text-[var(--muted)]">本地测试原型</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">今天，推进一件重要的事。</h1></div><Link className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white hover:bg-black" href="/quests">+ 新建任务</Link></header>
    <section className="mt-7 grid gap-3 sm:grid-cols-3">
      <Card label="当前等级" value={<>Lv. {level.level} <span className="text-sm font-normal text-[var(--muted)]">探索者</span></>} />
      <div className="rounded-xl border border-[var(--line)] bg-white p-4"><div className="flex justify-between text-xs text-[var(--muted)]"><span>距下一等级</span><span>{state.totalXp} / {level.nextLevelXp} XP</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, level.progress * 100)}%` }} /></div></div>
      <Card label="金币余额" value={<>{state.coinBalance} <span className="text-sm font-normal text-[var(--muted)]">coins</span></>} />
    </section>
    <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.9fr)]"><section><div className="flex items-center justify-between"><h2 className="text-base font-semibold">今日三件事</h2><Link className="text-xs text-[var(--accent)]" href="/quests">查看全部</Link></div><div className="mt-3 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-white">{open.length ? open.map((quest) => <article className="flex items-center gap-3 p-4" key={quest.id}><button aria-label={`完成：${quest.title}`} className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line)] hover:border-[var(--success)] hover:text-[var(--success)]" onClick={() => complete(quest.id)}>✓</button><div className="min-w-0 flex-1"><p className="font-medium">{quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">点击圆圈完成并结算</p></div></article>) : <p className="p-6 text-sm text-[var(--muted)]">今天的任务已全部完成。</p>}</div></section><section><h2 className="text-base font-semibold">最近结算</h2><div className="mt-3 space-y-3">{state.quests.filter((quest) => quest.status === "completed").slice(0, 2).map((quest) => <article className="rounded-xl border border-[var(--line)] bg-white p-4" key={quest.id}><p className="font-medium">{quest.title}</p><p className="mt-2 text-sm text-[var(--success)]">+{quest.reward?.xp} XP · +{quest.reward?.coins} coins</p></article>) || <p />}</div></section></div>
  </div>;
}
function Card({ label, value }: { label: string; value: React.ReactNode }) { return <div className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-semibold">{value}</p></div>; }
