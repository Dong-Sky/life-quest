"use client";

import { useState } from "react";
import { completePrototypeMilestone, createPrototypeMilestone, createPrototypeProject, initialPrototypeState, readPrototypeState, type PrototypeProject, type PrototypeState, updatePrototypeProject, writePrototypeState } from "@/src/prototype/state";

export default function ProjectsPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [name, setName] = useState("");
  const [victoryCondition, setVictoryCondition] = useState("");
  const [mainlineId, setMainlineId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editVictoryCondition, setEditVictoryCondition] = useState("");
  const [editMainlineId, setEditMainlineId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [addingMilestoneTo, setAddingMilestoneTo] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");

  const save = (next: PrototypeState) => { writePrototypeState(next); setState(next); };
  const create = () => {
    const next = createPrototypeProject(state, { name, victoryCondition, mainlineId: mainlineId || undefined, dueDate: dueDate || undefined });
    if (next !== state) {
      save(next);
      setName("");
      setVictoryCondition("");
      setMainlineId("");
      setDueDate("");
    }
  };
  const startEdit = (project: PrototypeProject) => {
    setEditingId(project.id);
    setEditName(project.name);
    setEditVictoryCondition(project.victoryCondition);
    setEditMainlineId(project.mainlineId ?? "");
    setEditDueDate(project.dueDate ?? "");
  };
  const saveEdit = () => {
    if (!editingId) return;
    const next = updatePrototypeProject(state, editingId, {
      name: editName,
      victoryCondition: editVictoryCondition,
      mainlineId: editMainlineId || undefined,
      dueDate: editDueDate || undefined,
    });
    if (next !== state) {
      save(next);
      setEditingId(null);
    }
  };
  const createMilestone = (projectId: string) => {
    const next = createPrototypeMilestone(state, projectId, milestoneTitle);
    if (next !== state) {
      save(next);
      setMilestoneTitle("");
      setAddingMilestoneTo(null);
    }
  };
  const completeMilestone = (id: string) => save(completePrototypeMilestone(state, id));

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="border-b border-[var(--line)] pb-6"><p className="text-sm text-[var(--muted)]">副本</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">为一件有终点的事，建立推进路径。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">副本适合一次旅行、考试计划或项目交付。先不关联主线也没关系，之后可随时编辑归属。</p></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm"><span className="font-medium">副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：完成 12 周减脂计划" value={name} /></label><label className="grid gap-2 text-sm"><span className="font-medium">胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setVictoryCondition(event.target.value)} placeholder="例如：完成全部训练与复盘" value={victoryCondition} /></label></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><MainlineSelect mainlines={state.mainlines} onChange={setMainlineId} value={mainlineId} /><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label></div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建副本</button></div>
    </form>
    <section className="mt-7 space-y-3">{state.projects.length ? state.projects.map((project) => {
      const related = state.quests.filter((quest) => quest.projectId === project.id);
      const milestones = state.milestones.filter((milestone) => milestone.projectId === project.id);
      const completeMilestones = milestones.filter((milestone) => milestone.status === "completed").length;
      const complete = related.filter((quest) => quest.status === "completed").length;
      const percent = related.length ? Math.round((complete / related.length) * 100) : 0;
      const mainline = state.mainlines.find((item) => item.id === project.mainlineId);
      const isEditing = editingId === project.id;
      return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={project.id}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{project.name}</p><p className="mt-2 text-sm text-[var(--muted)]">{project.victoryCondition || "尚未写下胜利条件。"}</p><p className="mt-3 text-xs text-[var(--muted)]">{mainline?.name ?? "未关联主线"}{project.dueDate ? ` · 目标日期：${project.dueDate}` : ""}</p></div><div className="flex items-center gap-2"><div className="min-w-36 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-right text-xs text-[var(--accent)]"><strong>{complete} / {related.length}</strong> 个任务<br /><span>{percent}% 推进</span></div><button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => startEdit(project)} type="button">编辑</button></div></div>
        {isEditing ? <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditName(event.target.value)} value={editName} /></label><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditVictoryCondition(event.target.value)} value={editVictoryCondition} /></label><MainlineSelect mainlines={state.mainlines} onChange={setEditMainlineId} value={editMainlineId} /><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditDueDate(event.target.value)} type="date" value={editDueDate} /></label><div className="flex gap-2 sm:col-span-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" onClick={saveEdit} type="button">保存修改</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={() => setEditingId(null)} type="button">取消</button></div></div> : null}
        <section className="mt-5 border-t border-[var(--line)] pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">阶段里程碑</p><p className="mt-1 text-xs text-[var(--muted)]">{completeMilestones} / {milestones.length} 已完成 · 只记录推进，不额外发放奖励</p></div><button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => { setAddingMilestoneTo(project.id); setMilestoneTitle(""); }} type="button">+ 新增里程碑</button></div>{addingMilestoneTo === project.id ? <form className="mt-3 flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); createMilestone(project.id); }}><input autoFocus className="min-w-[200px] flex-1 rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setMilestoneTitle(event.target.value)} placeholder="例如：完成第一周训练安排" value={milestoneTitle} /><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" type="submit">添加</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={() => setAddingMilestoneTo(null)} type="button">取消</button></form> : null}{milestones.length ? <div className="mt-3 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">{milestones.map((milestone) => <div className="flex items-center justify-between gap-3 px-3 py-2.5" key={milestone.id}><p className={milestone.status === "completed" ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{milestone.title}</p>{milestone.status === "completed" ? <span className="text-xs text-[var(--success)]">已完成</span> : <button className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent)]" onClick={() => completeMilestone(milestone.id)} type="button">完成阶段</button>}</div>)}</div> : <p className="mt-3 text-xs text-[var(--muted)]">把大副本拆成 2–5 个阶段，推进会更清楚。</p>}</section>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${percent}%` }} /></div>
      </article>;
    }) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">先创建一个有终点的副本。</p><p className="mt-2 text-sm text-[var(--muted)]">之后可以随时回到任务页，把具体行动关联进来。</p></div>}</section>
  </div>;
}

function MainlineSelect({ mainlines, value, onChange }: { mainlines: PrototypeState["mainlines"]; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>关联主线（可选）</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" value={value} onChange={(event) => onChange(event.target.value)}><option value="">暂不关联主线</option>{mainlines.map((mainline) => <option key={mainline.id} value={mainline.id}>{mainline.name}</option>)}</select></label>;
}
