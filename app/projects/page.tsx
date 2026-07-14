"use client";

import { useState } from "react";
import { createPrototypeProject, initialPrototypeState, readPrototypeState, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

export default function ProjectsPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [name, setName] = useState("");
  const [victoryCondition, setVictoryCondition] = useState("");
  const [mainlineId, setMainlineId] = useState("");
  const [dueDate, setDueDate] = useState("");

  const save = (next: PrototypeState) => { writePrototypeState(next); setState(next); };
  const create = () => {
    const next = createPrototypeProject(state, {
      name,
      victoryCondition,
      mainlineId: mainlineId || undefined,
      dueDate: dueDate || undefined,
    });
    if (next !== state) {
      save(next);
      setName("");
      setVictoryCondition("");
      setMainlineId("");
      setDueDate("");
    }
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6"><p className="text-sm text-[var(--muted)]">副本</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">为一件有终点的事，建立推进路径。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">副本适合一次旅行、考试计划或项目交付。它不同于每天运动等长期习惯：副本需要一个清晰的胜利条件。</p></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm"><span className="font-medium">副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：完成 12 周减脂计划" value={name} /></label><label className="grid gap-2 text-sm"><span className="font-medium">胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setVictoryCondition(event.target.value)} placeholder="例如：完成全部训练与复盘" value={victoryCondition} /></label></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>关联主线（可选）</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" value={mainlineId} onChange={(event) => setMainlineId(event.target.value)}><option value="">暂不关联主线</option>{state.mainlines.map((mainline) => <option key={mainline.id} value={mainline.id}>{mainline.name}</option>)}</select></label><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label></div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建副本</button></div>
    </form>
    <section className="mt-7 space-y-3">{state.projects.length ? state.projects.map((project) => {
      const related = state.quests.filter((quest) => quest.projectId === project.id);
      const complete = related.filter((quest) => quest.status === "completed").length;
      const percent = related.length ? Math.round((complete / related.length) * 100) : 0;
      const mainline = state.mainlines.find((item) => item.id === project.mainlineId);
      return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={project.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{project.name}</p><p className="mt-2 text-sm text-[var(--muted)]">{project.victoryCondition || "尚未写下胜利条件。"}</p><p className="mt-3 text-xs text-[var(--muted)]">{mainline?.name ?? "未关联主线"}{project.dueDate ? ` · 目标日期：${project.dueDate}` : ""}</p></div><div className="min-w-36 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-right text-xs text-[var(--accent)]"><strong>{complete} / {related.length}</strong> 个任务<br /><span>{percent}% 推进</span></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${percent}%` }} /></div></article>;
    }) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">先创建一个有终点的副本。</p><p className="mt-2 text-sm text-[var(--muted)]">之后在创建任务时，将具体行动关联到这个副本。</p></div>}</section>
  </div>;
}
