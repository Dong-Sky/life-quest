"use client";

import { useState } from "react";
import { createPrototypeReward, initialPrototypeState, readPrototypeState, redeemPrototypeReward, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

export default function RewardsPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [name, setName] = useState("");
  const [coinCostInput, setCoinCostInput] = useState("50");
  const [isRepeatable, setIsRepeatable] = useState(true);

  const save = (next: PrototypeState) => { writePrototypeState(next); setState(next); };
  const create = () => {
    const next = createPrototypeReward(state, { name, coinCost: Number(coinCostInput), isRepeatable });
    if (next !== state) {
      save(next);
      setName("");
      setCoinCostInput("50");
      setIsRepeatable(true);
    }
  };
  const redeem = (rewardId: string) => save(redeemPrototypeReward(state, rewardId));

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6"><p className="text-sm text-[var(--muted)]">奖励商城</p><div className="mt-1 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold tracking-tight">把完成感，兑换成真实的好事情。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">奖励由你定义，金币只能来自任务结算。休息和基本生活不需要兑换。</p></div><div className="rounded-xl bg-[var(--accent-soft)] px-4 py-3 text-right"><p className="text-xs text-[var(--muted)]">可用金币</p><p className="mt-1 text-2xl font-semibold text-[var(--accent)]">{state.coinBalance} <span className="text-sm font-normal">coins</span></p></div></div></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]"><label className="grid min-w-0 gap-2 text-sm"><span className="font-medium">想兑换什么？</span><input className="w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：吃一顿喜欢的餐厅" value={name} /></label><label className="grid min-w-0 gap-2 text-sm"><span className="font-medium">所需金币</span><input className="w-full min-w-0 rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" inputMode="numeric" min="1" onChange={(event) => setCoinCostInput(event.target.value)} required type="number" value={coinCostInput} /></label></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-sm"><input checked={isRepeatable} className="h-4 w-4 accent-[var(--accent)]" onChange={(event) => setIsRepeatable(event.target.checked)} type="checkbox" />可重复兑换</label><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建奖励</button></div></form>
    <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]"><section><div className="flex items-center justify-between"><h2 className="text-base font-semibold">我的奖励</h2><span className="text-xs text-[var(--muted)]">{state.rewards.length} 个奖励</span></div><div className="mt-3 space-y-3">{state.rewards.length ? state.rewards.map((reward) => { const redeemed = state.redemptions.some((item) => item.rewardId === reward.id); const unavailable = state.coinBalance < reward.coinCost || (!reward.isRepeatable && redeemed); const reason = !reward.isRepeatable && redeemed ? "已兑换" : state.coinBalance < reward.coinCost ? "金币不足" : ""; return <article className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-white p-4" key={reward.id}><div><p className="font-medium">{reward.name}</p><p className="mt-1 text-xs text-[var(--muted)]">{reward.isRepeatable ? "可重复兑换" : "仅可兑换一次"} · {reward.coinCost} coins</p></div><button className={unavailable ? "rounded-md border border-[var(--line)] px-3 py-2 text-xs text-[var(--muted)]" : "rounded-md bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--accent)]"} disabled={unavailable} onClick={() => redeem(reward.id)} type="button">{unavailable ? reason : `兑换 −${reward.coinCost}`}</button></article>; }) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">先放入一个你真正期待的奖励。</p><p className="mt-2 text-sm text-[var(--muted)]">例如一场电影、一顿喜欢的餐厅，或一次旅行体验升级。</p></div>}</div></section><aside><h2 className="text-base font-semibold">最近兑换</h2><div className="mt-3 space-y-3">{state.redemptions.length ? state.redemptions.slice(0, 5).map((redemption) => <article className="rounded-xl border border-[var(--line)] bg-white p-4" key={redemption.id}><p className="font-medium">{redemption.rewardName}</p><p className="mt-2 text-sm text-[var(--success)]">−{redemption.coinCost} coins</p></article>) : <p className="rounded-xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-[var(--muted)]">完成任务攒下金币后，可以在这里兑换奖励。</p>}</div></aside></div>
  </div>;
}
