"use client";

import Link from "next/link";
import { useState } from "react";
import { LinkedQuestPanel } from "@/components/linked-quest-panel";
import { createPrototypeMilestone, createPrototypeQuest, createPrototypeProject, getPrototypeMilestoneProgress, initialPrototypeState, readPrototypeState, type PrototypeMilestone, type PrototypeProject, type PrototypeQuest, type PrototypeState, updatePrototypeMilestone, updatePrototypeProject, writePrototypeState } from "@/src/prototype/state";

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
  const [milestoneQuestIds, setMilestoneQuestIds] = useState<string[]>([]);
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null);
  const [editMilestoneTitle, setEditMilestoneTitle] = useState("");
  const [editMilestoneQuestIds, setEditMilestoneQuestIds] = useState<string[]>([]);

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
    const next = updatePrototypeProject(state, editingId, { name: editName, victoryCondition: editVictoryCondition, mainlineId: editMainlineId || undefined, dueDate: editDueDate || undefined });
    if (next !== state) {
      save(next);
      setEditingId(null);
    }
  };
  const createMilestone = (projectId: string, quickTaskTitle: string) => {
    if (!milestoneTitle.trim()) return;

    const project = state.projects.find((item) => item.id === projectId);
    let next = state;
    let questIds = milestoneQuestIds;

    if (quickTaskTitle.trim()) {
      next = createPrototypeQuest(next, {
        title: quickTaskTitle,
        questType: "standard",
        difficulty: "standard",
        importance: "helpful",
        resistance: "none",
        mainlineId: project?.mainlineId,
        projectId,
      });
      questIds = [...questIds, next.quests[0].id];
    }

    next = createPrototypeMilestone(next, projectId, milestoneTitle, questIds);
    if (next !== state) {
      save(next);
      setMilestoneTitle("");
      setMilestoneQuestIds([]);
      setAddingMilestoneTo(null);
    }
  };
  const startMilestoneEdit = (milestone: PrototypeMilestone) => {
    setEditingMilestoneId(milestone.id);
    setEditMilestoneTitle(milestone.title);
    setEditMilestoneQuestIds(milestone.questIds);
  };
  const saveMilestoneEdit = (quickTaskTitle: string) => {
    if (!editingMilestoneId) return;
    const milestone = state.milestones.find((item) => item.id === editingMilestoneId);
    if (!milestone) return;

    let next = updatePrototypeMilestone(state, editingMilestoneId, editMilestoneTitle, editMilestoneQuestIds);
    if (quickTaskTitle.trim()) {
      const project = state.projects.find((item) => item.id === milestone.projectId);
      next = createPrototypeQuest(next, {
        title: quickTaskTitle,
        questType: "standard",
        difficulty: "standard",
        importance: "helpful",
        resistance: "none",
        mainlineId: project?.mainlineId,
        projectId: milestone.projectId,
      });
      next = updatePrototypeMilestone(next, milestone.id, editMilestoneTitle, [...editMilestoneQuestIds, next.quests[0].id]);
    }

    if (next !== state) {
      save(next);
      setEditingMilestoneId(null);
    }
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6"><div><p className="text-sm text-[var(--muted)]">副本</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">为一件有终点的事，建立推进路径。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">副本适合一次旅行、考试计划或项目交付。先不关联主线也没关系，之后可随时编辑归属。</p></div><div className="flex rounded-lg border border-[var(--line)] bg-white p-1 text-sm"><Link className="rounded-md bg-[var(--accent-soft)] px-3 py-1.5 font-medium text-[var(--accent)]" href="/projects">个人副本</Link><Link className="rounded-md px-3 py-1.5 text-[var(--muted)] hover:bg-gray-50 hover:text-[var(--ink)]" href="/shared-projects">共同副本</Link></div></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm"><span className="font-medium">副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：完成 12 周减脂计划" value={name} /></label><label className="grid gap-2 text-sm"><span className="font-medium">胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setVictoryCondition(event.target.value)} placeholder="例如：完成全部训练与复盘" value={victoryCondition} /></label></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><MainlineSelect mainlines={state.mainlines} onChange={setMainlineId} value={mainlineId} /><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label></div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建副本</button></div>
    </form>
    <section className="mt-7 space-y-3">{state.projects.length ? state.projects.map((project) => {
      const related = state.quests.filter((quest) => quest.projectId === project.id);
      const milestones = state.milestones.filter((milestone) => milestone.projectId === project.id);
      const completeMilestones = milestones.filter((milestone) => getPrototypeMilestoneProgress(state, milestone).isCompleted).length;
      const complete = related.filter((quest) => quest.status === "completed").length;
      const percent = related.length ? Math.round((complete / related.length) * 100) : 0;
      const mainline = state.mainlines.find((item) => item.id === project.mainlineId);
      const isEditing = editingId === project.id;
      return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={project.id}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{project.name}</p><p className="mt-2 text-sm text-[var(--muted)]">{project.victoryCondition || "尚未写下胜利条件。"}</p><p className="mt-3 text-xs text-[var(--muted)]">{mainline?.name ?? "未关联主线"}{project.dueDate ? ` · 目标日期：${project.dueDate}` : ""}</p></div><div className="flex items-center gap-2"><div className="min-w-36 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-right text-xs text-[var(--accent)]"><strong>{complete} / {related.length}</strong> 个任务<br /><span>{percent}% 推进</span></div><button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => startEdit(project)} type="button">编辑</button></div></div>
        {isEditing ? <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditName(event.target.value)} value={editName} /></label><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditVictoryCondition(event.target.value)} value={editVictoryCondition} /></label><MainlineSelect mainlines={state.mainlines} onChange={setEditMainlineId} value={editMainlineId} /><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditDueDate(event.target.value)} type="date" value={editDueDate} /></label><div className="flex gap-2 sm:col-span-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" onClick={saveEdit} type="button">保存修改</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={() => setEditingId(null)} type="button">取消</button></div></div> : null}
        <LinkedQuestPanel state={state} onStateChange={save} mainlineId={project.mainlineId} projectId={project.id} />
        <section className="mt-5 border-t border-[var(--line)] pt-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">阶段里程碑</p><p className="mt-1 text-xs text-[var(--muted)]">{completeMilestones} / {milestones.length} 自动完成 · 关联任务全部结算后达成</p></div><button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => { setAddingMilestoneTo(project.id); setMilestoneTitle(""); setMilestoneQuestIds([]); }} type="button">+ 新增里程碑</button></div>{addingMilestoneTo === project.id ? <MilestoneEditor title={milestoneTitle} questIds={milestoneQuestIds} tasks={related} onCancel={() => setAddingMilestoneTo(null)} onSave={(quickTaskTitle) => createMilestone(project.id, quickTaskTitle)} onTitleChange={setMilestoneTitle} onQuestIdsChange={setMilestoneQuestIds} saveLabel="添加里程碑" /> : null}{milestones.length ? <div className="mt-3 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">{milestones.map((milestone) => { const progress = getPrototypeMilestoneProgress(state, milestone); const isMilestoneEditing = editingMilestoneId === milestone.id; return <div className="px-3 py-3" key={milestone.id}><div className="flex items-center justify-between gap-3"><div><p className={progress.isCompleted ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{milestone.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{progress.total ? `已结算 ${progress.completed} / ${progress.total} 项关联任务` : "尚未关联任务"}</p></div><div className="flex items-center gap-2">{progress.isCompleted ? <span className="text-xs text-[var(--success)]">自动完成</span> : <span className="text-xs text-[var(--muted)]">推进中</span>}<button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => startMilestoneEdit(milestone)} type="button">编辑</button></div></div>{isMilestoneEditing ? <MilestoneEditor title={editMilestoneTitle} questIds={editMilestoneQuestIds} tasks={related} onCancel={() => setEditingMilestoneId(null)} onSave={saveMilestoneEdit} onTitleChange={setEditMilestoneTitle} onQuestIdsChange={setEditMilestoneQuestIds} saveLabel="保存修改" /> : null}</div>; })}</div> : <p className="mt-3 text-xs text-[var(--muted)]">先为副本创建任务，再把 2–5 项相关任务编组为一个里程碑。</p>}</section>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${percent}%` }} /></div>
      </article>;
    }) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">先创建一个有终点的副本。</p><p className="mt-2 text-sm text-[var(--muted)]">之后可以随时回到任务页，把具体行动关联进来。</p></div>}</section>
  </div>;
}

function MilestoneEditor({ tasks, title, questIds, onTitleChange, onQuestIdsChange, onSave, onCancel, saveLabel }: { tasks: PrototypeQuest[]; title: string; questIds: string[]; onTitleChange: (value: string) => void; onQuestIdsChange: (value: string[]) => void; onSave: (quickTaskTitle: string) => void; onCancel: () => void; saveLabel: string }) {
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const toggleQuest = (questId: string) => onQuestIdsChange(questIds.includes(questId) ? questIds.filter((item) => item !== questId) : [...questIds, questId]);

  return <form className="mt-3 rounded-lg bg-[#fafafa] p-3" onSubmit={(event) => { event.preventDefault(); onSave(quickTaskTitle); }}>
    <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>里程碑名称</span><input autoFocus className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onTitleChange(event.target.value)} placeholder="例如：完成第一周训练安排" value={title} /></label>
    <div className="mt-3"><p className="text-xs text-[var(--muted)]">在此里程碑下新增任务（可选）</p><input className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setQuickTaskTitle(event.target.value)} placeholder="例如：预订酒店" value={quickTaskTitle} /><p className="mt-1 text-xs text-[var(--muted)]">保存时会自动归属这个副本，并关联到此里程碑。</p></div>
    <div className="mt-3"><p className="text-xs text-[var(--muted)]">关联已有任务（全部结算后自动完成）</p>{tasks.length ? <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[var(--line)] bg-white p-2">{tasks.map((task) => <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-gray-50" key={task.id}><input checked={questIds.includes(task.id)} className="h-4 w-4 accent-[var(--accent)]" onChange={() => toggleQuest(task.id)} type="checkbox" /><span className={task.status === "completed" ? "text-[var(--muted)] line-through" : ""}>{task.title}</span>{task.status === "completed" ? <span className="ml-auto text-xs text-[var(--success)]">已结算</span> : null}</label>)}</div> : <p className="mt-2 rounded-lg border border-dashed border-[var(--line)] bg-white p-3 text-xs text-[var(--muted)]">可以直接在上方填写一项新任务；保存后它会自动关联这个里程碑。</p>}</div>
    <div className="mt-3 flex gap-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" type="submit">{saveLabel}</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={onCancel} type="button">取消</button></div>
  </form>;
}

function MainlineSelect({ mainlines, value, onChange }: { mainlines: PrototypeState["mainlines"]; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>关联主线（可选）</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" value={value} onChange={(event) => onChange(event.target.value)}><option value="">暂不关联主线</option>{mainlines.map((mainline) => <option key={mainline.id} value={mainline.id}>{mainline.name}</option>)}</select></label>;
}
