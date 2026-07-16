"use client";

import Link from "next/link";
import { LinkedQuestPanel } from "@/components/linked-quest-panel";
import { useState } from "react";
import { createPrototypeMainline, getPrototypeProjectProgress, initialPrototypeState, readPrototypeState, type PrototypeMainline, type PrototypeState, updatePrototypeMainline, writePrototypeState } from "@/src/prototype/state";

export default function MainlinesPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [name, setName] = useState("");
  const [vision, setVision] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVision, setEditVision] = useState("");

  const save = (next: PrototypeState) => { writePrototypeState(next); setState(next); };
  const create = () => {
    const next = createPrototypeMainline(state, { name, vision });
    if (next !== state) {
      save(next);
      setName("");
      setVision("");
    }
  };
  const startEdit = (mainline: PrototypeMainline) => {
    setEditingId(mainline.id);
    setEditName(mainline.name);
    setEditVision(mainline.vision);
  };
  const saveEdit = () => {
    if (!editingId) return;
    const next = updatePrototypeMainline(state, editingId, { name: editName, vision: editVision });
    if (next !== state) {
      save(next);
      setEditingId(null);
    }
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6"><p className="text-sm text-[var(--muted)]">主线 · 长期方向</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">先定义长期方向，再安排下一步。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">主线连接持续数月的方向；副本是其中有终点的项目，任务则是今天能完成的行动。</p></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"><label className="grid gap-2 text-sm"><span className="font-medium">主线名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：保持稳定的健康节奏" value={name} /></label><label className="grid gap-2 text-sm"><span className="font-medium">一句愿景（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setVision(event.target.value)} placeholder="例如：成为精力充沛、长期稳定行动的人" value={vision} /></label></div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建主线</button></div>
    </form>
    <section className="mt-7 space-y-3">{state.mainlines.length ? state.mainlines.map((mainline) => {
      const relatedProjects = state.projects.filter((project) => project.mainlineId === mainline.id);
      const openCount = state.quests.filter((quest) => quest.mainlineId === mainline.id && quest.status === "open").length;
      const completedCount = state.quests.filter((quest) => quest.mainlineId === mainline.id && quest.status === "completed").length;
      const isEditing = editingId === mainline.id;
      return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={mainline.id}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{mainline.name}</p>{mainline.vision ? <p className="mt-2 text-sm text-[var(--muted)]">{mainline.vision}</p> : <p className="mt-2 text-sm text-[var(--muted)]">尚未写下愿景。</p>}</div><div className="flex items-center gap-2"><div className="rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--accent)]"><strong>{openCount}</strong> 个待推进 · {completedCount} 个已完成</div><button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => startEdit(mainline)} type="button">编辑</button></div></div>
        {isEditing ? <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>主线名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditName(event.target.value)} value={editName} /></label><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>一句愿景（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditVision(event.target.value)} value={editVision} /></label><div className="flex gap-2 sm:col-span-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" onClick={saveEdit} type="button">保存修改</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={() => setEditingId(null)} type="button">取消</button></div></div> : null}
        <section className="mt-5 border-t border-[var(--line)] pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">关联副本 · 有终点的项目</p><p className="mt-1 text-xs text-[var(--muted)]">把这条长期方向拆成一个个可完成的项目。</p></div><Link className="text-xs font-medium text-[var(--accent)] hover:underline" href="/projects">管理副本 →</Link></div>{relatedProjects.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{relatedProjects.map((project) => { const progress = getPrototypeProjectProgress(state, project.id); return <Link className="rounded-lg border border-[var(--line)] bg-[#fafafa] px-3 py-3 transition hover:border-[var(--accent)] hover:bg-white" href="/projects" key={project.id}><div className="flex items-start justify-between gap-2"><p className="text-sm font-medium">{project.name}</p><span className="shrink-0 text-xs text-[var(--muted)]">{progress.completedXp}/{progress.plannedXp} XP</span></div><p className="mt-2 text-xs text-[var(--muted)]">{project.victoryCondition || "尚未写下胜利条件"} · {progress.completed}/{progress.total} 个行动 · {progress.percent}%</p></Link>; })}</div> : <p className="mt-3 rounded-lg border border-dashed border-[var(--line)] bg-[#fafafa] px-3 py-3 text-xs text-[var(--muted)]">还没有关联副本。需要一个明确终点时，创建副本并把它归入这条主线。</p>}</section>
        <LinkedQuestPanel state={state} onStateChange={save} mainlineId={mainline.id} />
      </article>;
    }) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">先创建第一条主线。</p><p className="mt-2 text-sm text-[var(--muted)]">它可以是健康、职业、关系、学习，或任何你真正想长期推进的方向。</p><Link className="mt-4 inline-block text-sm font-medium text-[var(--accent)]" href="/quests">暂时只管理任务也可以 →</Link></div>}</section>
  </div>;
}
