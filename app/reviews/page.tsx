"use client";

import { useState } from "react";
import { getPrototypeWeeklyReviewSummary, getPrototypeWeekKey, initialPrototypeState, readPrototypeState, type PrototypeState, upsertPrototypeWeeklyReview, writePrototypeState } from "@/src/prototype/state";

export default function ReviewsPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const now = new Date();
  const current = state.reviews.find((review) => review.weekKey === getPrototypeWeekKey(now));
  const [wins, setWins] = useState(current?.wins ?? "");
  const [blockers, setBlockers] = useState(current?.blockers ?? "");
  const [priorities, setPriorities] = useState<string[]>(current?.nextPriorities.length ? [...current.nextPriorities, "", "", ""].slice(0, 3) : ["", "", ""]);
  const summary = getPrototypeWeeklyReviewSummary(state, now);
  const save = () => {
    const next = upsertPrototypeWeeklyReview(state, now, { wins, blockers, nextPriorities: priorities });
    writePrototypeState(next);
    setState(next);
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6"><p className="text-sm text-[var(--muted)]">周结算</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">停下来，看清这一周真正推进了什么。</h1><p className="mt-2 text-sm leading-6 text-[var(--muted)]">自动数据提供事实；你的胜利、阻碍和下周重点提供判断。</p></header>
    <section className="mt-6 grid gap-3 sm:grid-cols-4"><Metric label="已结算任务" value={summary.completedQuests} /><Metric label="获得经验" value={`${summary.xpEarned} XP`} /><Metric label="获得金币" value={`${summary.coinsEarned} coins`} /><Metric label="仍待推进" value={summary.openQuests} /></section>
    <section className="mt-7 rounded-xl border border-[var(--line)] bg-white p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-base font-semibold">本周复盘</h2><p className="mt-1 text-xs text-[var(--muted)]">本周从 {summary.weekKey} 开始；保存后可随时修改。</p></div><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" onClick={save} type="button">保存周结算</button></div><div className="mt-5 grid gap-5"><Field label="本周最重要的胜利" placeholder="例如：完成减脂计划的第一周安排" value={wins} onChange={setWins} /><Field label="本周最大的阻碍" placeholder="例如：临时会议占用了深度工作时间" value={blockers} onChange={setBlockers} /><div><p className="text-sm font-medium">下周三件事</p><div className="mt-2 space-y-2">{priorities.map((priority, index) => <label className="flex items-center gap-2" key={index}><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--line)] text-xs text-[var(--muted)]">{index + 1}</span><input className="w-full rounded-lg border border-[var(--line)] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setPriorities((currentPriorities) => currentPriorities.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="下一步要推动的具体行动" value={priority} /></label>)}</div></div></div></section>
    {state.reviews.filter((review) => review.weekKey !== summary.weekKey).length ? <section className="mt-7"><h2 className="text-base font-semibold">最近周结算</h2><div className="mt-3 space-y-3">{state.reviews.filter((review) => review.weekKey !== summary.weekKey).slice(0, 3).map((review) => <article className="rounded-xl border border-[var(--line)] bg-white p-4" key={review.id}><p className="text-xs text-[var(--muted)]">{review.weekKey} 当周</p><p className="mt-2 font-medium">{review.wins || "未记录本周胜利"}</p></article>)}</div></section> : null}
  </div>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <article className="rounded-xl border border-[var(--line)] bg-white p-4"><p className="text-xs text-[var(--muted)]">{label}</p><p className="mt-2 text-xl font-semibold">{value}</p></article>;
}

function Field({ label, placeholder, value, onChange }: { label: string; placeholder: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-2 text-sm"><span className="font-medium">{label}</span><textarea className="min-h-24 resize-y rounded-lg border border-[var(--line)] px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => onChange(event.target.value)} placeholder={placeholder} value={value} /></label>;
}
