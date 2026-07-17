"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPrototypeWeeklyRhythm, initialPrototypeState, PROTOTYPE_STATE_EVENT, readPrototypeState, type PrototypeState } from "@/src/prototype/state";

export function WeeklyRhythmCard() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  useEffect(() => {
    const refresh = () => setState(readPrototypeState());
    window.addEventListener(PROTOTYPE_STATE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PROTOTYPE_STATE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const rhythm = getPrototypeWeeklyRhythm(state);

  return <section className="mt-8 hidden rounded-2xl border border-[var(--line)] bg-white p-4 lg:block">
    <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">本周节奏</p><span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--accent)]">进行中</span></div>
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="rounded-lg bg-white p-2.5"><p className="text-[11px] text-[var(--muted)]">已结算</p><p className="mt-1 text-sm font-semibold">{rhythm.summary.completedQuests} 项</p></div>
      <div className="rounded-lg bg-white p-2.5"><p className="text-[11px] text-[var(--muted)]">本周经验</p><p className="mt-1 text-sm font-semibold">{rhythm.summary.xpEarned} XP</p></div>
    </div>
    {rhythm.nextQuest ? <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-3"><p className="text-[11px] text-[var(--muted)]">下一件值得推进</p><p className="mt-1 line-clamp-2 text-sm font-medium leading-5">{rhythm.nextQuest.title}</p><Link className="mt-2 inline-flex text-xs font-medium text-[var(--accent)]" href="/quests">去完成任务 →</Link></div> : <div className="mt-4 rounded-lg border border-[var(--line)] bg-white p-3"><p className="text-sm font-medium">本周任务已清空</p><Link className="mt-2 inline-flex text-xs font-medium text-[var(--accent)]" href="/quests">创建下一件任务 →</Link></div>}
    {rhythm.topWish ? <Link className="mt-3 block rounded-lg bg-[var(--accent-soft)] px-3 py-2.5 text-xs text-[var(--accent)]" href="/rewards"><span className="text-[var(--muted)]">首愿望</span><span className="ml-1 font-medium">{rhythm.topWish.name}</span><span className="ml-1">{rhythm.missingCoins ? `还差 ${rhythm.missingCoins}` : "可兑换"}</span></Link> : null}
    <Link className="mt-4 block text-center text-xs text-[var(--muted)] hover:text-[var(--ink)]" href="/reviews">查看本周结算</Link>
  </section>;
}
