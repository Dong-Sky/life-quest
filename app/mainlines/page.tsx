"use client";

import Link from "next/link";
import { useState } from "react";
import { createPrototypeMainline, initialPrototypeState, readPrototypeState, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

export default function MainlinesPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [name, setName] = useState("");
  const [vision, setVision] = useState("");

  const save = (next: PrototypeState) => { writePrototypeState(next); setState(next); };
  const create = () => {
    const next = createPrototypeMainline(state, { name, vision });
    if (next !== state) {
      save(next);
      setName("");
      setVision("");
    }
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6"><p className="text-sm text-[var(--muted)]">主线</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">先定义长期方向，再安排下一步。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">主线是持续数月的长期方向，不等同于一张待办清单。任务可以选择关联到其中一条主线。</p></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><label className="grid gap-2 text-sm"><span className="font-medium">主线名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：保持稳定的健康节奏" value={name} /></label><label className="grid gap-2 text-sm"><span className="font-medium">一句愿景（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setVision(event.target.value)} placeholder="例如：成为精力充沛、长期稳定行动的人" value={vision} /></label></div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建主线</button></div>
    </form>
    <section className="mt-7 space-y-3">{state.mainlines.length ? state.mainlines.map((mainline) => {
      const openCount = state.quests.filter((quest) => quest.mainlineId === mainline.id && quest.status === "open").length;
      const completedCount = state.quests.filter((quest) => quest.mainlineId === mainline.id && quest.status === "completed").length;
      return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={mainline.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{mainline.name}</p>{mainline.vision ? <p className="mt-2 text-sm text-[var(--muted)]">{mainline.vision}</p> : <p className="mt-2 text-sm text-[var(--muted)]">尚未写下愿景。</p>}</div><div className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--accent)]"><strong>{openCount}</strong> 个待推进 · {completedCount} 个已完成</div></div></article>;
    }) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">先创建第一条主线。</p><p className="mt-2 text-sm text-[var(--muted)]">它可以是健康、职业、关系、学习，或任何你真正想长期推进的方向。</p><Link className="mt-4 inline-block text-sm font-medium text-[var(--accent)]" href="/quests">暂时只管理任务也可以 →</Link></div>}</section>
  </div>;
}
