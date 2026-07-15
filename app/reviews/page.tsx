"use client";

import Link from "next/link";
import { useState } from "react";
import { createPrototypeWeeklyPlan, getPrototypeWeeklyReviewSummary, getPrototypeWeekKey, initialPrototypeState, readPrototypeState, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

export default function ReviewsPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [priorities, setPriorities] = useState(["", "", ""]);
  const now = new Date();
  const weekKey = getPrototypeWeekKey(now);
  const summary = getPrototypeWeeklyReviewSummary(state, now);
  const plan = state.weeklyPlans.find((item) => item.sourceWeekKey === weekKey);
  const settledQuests = state.quests.filter((quest) => quest.completedAt && getPrototypeWeekKey(new Date(quest.completedAt)) === weekKey);
  const plannedQuests = plan ? plan.questIds.map((questId) => state.quests.find((quest) => quest.id === questId)).filter(Boolean) : [];

  const createPlan = () => {
    const next = createPrototypeWeeklyPlan(state, now, priorities);
    if (next === state) return;
    writePrototypeState(next);
    setState(next);
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6">
      <p className="text-sm text-[var(--muted)]">本周结算</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight">这一周，已经推进了什么？</h1>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">像完成副本后的结算一样，先看真实结果；再把下周最重要的行动放入任务清单。</p>
    </header>

    <section className="mt-6 grid gap-3 sm:grid-cols-4">
      <Metric label="已结算任务" value={summary.completedQuests} />
      <Metric label="获得经验" value={`${summary.xpEarned} XP`} />
      <Metric label="获得金币" value={`${summary.coinsEarned} coins`} />
      <Metric label="仍待推进" value={summary.openQuests} />
    </section>

    <div className="mt-7 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-xl border border-[var(--line)] bg-white p-5">
        <div>
          <h2 className="text-base font-semibold">本周战报</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">从 {summary.weekKey} 开始的真实任务结算。</p>
        </div>
        {settledQuests.length ? <div className="mt-5 divide-y divide-[var(--line)]">
          {settledQuests.map((quest) => <article className="flex items-center justify-between gap-3 py-3" key={quest.id}>
            <div className="min-w-0"><p className="truncate text-sm font-medium">{quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">已完成结算</p></div>
            <p className="shrink-0 text-sm text-[var(--muted)]">+{quest.reward?.xp ?? 0} XP · +{quest.reward?.coins ?? 0} coins</p>
          </article>)}
        </div> : <p className="mt-5 rounded-lg bg-[var(--surface)] px-4 py-5 text-sm leading-6 text-[var(--muted)]">本周还没有结算任务。完成第一项任务后，这里会留下你的战报。</p>}
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-white p-5">
        <h2 className="text-base font-semibold">下周三件事</h2>
        <p className="mt-1 text-xs leading-5 text-[var(--muted)]">只写最重要、可执行的下一步。创建后会直接加入任务清单，本周不能重复创建。</p>
        {plan ? <div className="mt-5">
          <div className="rounded-lg bg-[var(--surface)] p-4">
            <p className="text-sm font-medium">已创建 {plannedQuests.length} 项下周任务</p>
            {plannedQuests.length ? <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">{plannedQuests.map((quest) => <li key={quest?.id}>· {quest?.title}</li>)}</ul> : null}
          </div>
          <Link className="mt-4 inline-flex rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" href="/quests">前往任务清单</Link>
        </div> : <div className="mt-5">
          <div className="space-y-2">{priorities.map((priority, index) => <label className="flex items-center gap-2" key={index}>
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--line)] text-xs text-[var(--muted)]">{index + 1}</span>
            <input className="w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setPriorities((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="下一步要推动的具体行动" value={priority} />
          </label>)}</div>
          <button className="mt-4 rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40" disabled={!priorities.some((priority) => priority.trim())} onClick={createPlan} type="button">创建下周任务</button>
        </div>}
      </section>
    </div>
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></article>;
}
