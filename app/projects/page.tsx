"use client";

import Link from "next/link";
import { useState } from "react";
import { LinkedQuestPanel } from "@/components/linked-quest-panel";
import { createPrototypeMilestone, createPrototypeQuest, createPrototypeProject, getPrototypeMilestoneProgress, getPrototypeProjectProgress, initialPrototypeState, readPrototypeState, type PrototypeMilestone, type PrototypeProject, type PrototypeQuest, type PrototypeQuestDraft, type PrototypeState, updatePrototypeMilestone, updatePrototypeProject, writePrototypeState } from "@/src/prototype/state";

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
  const createMilestone = (projectId: string, quickTask: PrototypeQuestDraft) => {
    if (!milestoneTitle.trim()) return;

    const project = state.projects.find((item) => item.id === projectId);
    let next = state;
    let questIds = milestoneQuestIds;

    if (quickTask.title.trim()) {
      next = createPrototypeQuest(next, { ...quickTask, title: quickTask.title, mainlineId: project?.mainlineId, projectId });
      const createdQuestId = next.quests[0]?.id;
      if (createdQuestId) questIds = [...questIds, createdQuestId];
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
  const saveMilestoneEdit = (quickTask: PrototypeQuestDraft) => {
    if (!editingMilestoneId || !editMilestoneTitle.trim()) return;
    const milestone = state.milestones.find((item) => item.id === editingMilestoneId);
    if (!milestone) return;

    let next = updatePrototypeMilestone(state, editingMilestoneId, editMilestoneTitle, editMilestoneQuestIds);
    if (quickTask.title.trim()) {
      const project = state.projects.find((item) => item.id === milestone.projectId);
      next = createPrototypeQuest(next, { ...quickTask, title: quickTask.title, mainlineId: project?.mainlineId, projectId: milestone.projectId });
      const createdQuestId = next.quests[0]?.id;
      if (createdQuestId) next = updatePrototypeMilestone(next, milestone.id, editMilestoneTitle, [...editMilestoneQuestIds, createdQuestId]);
    }

    if (next !== state) {
      save(next);
      setEditingMilestoneId(null);
    }
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6"><div><p className="text-sm text-[var(--muted)]">副本 · 有终点的项目</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">为一件有终点的事，建立推进路径。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">先写下阶段成果，再把任务编入每个阶段；不属于阶段的行动会保留为直接任务。</p></div><div className="flex rounded-lg border border-[var(--line)] bg-white p-1 text-sm"><Link className="rounded-md bg-[var(--accent-soft)] px-3 py-1.5 font-medium text-[var(--accent)]" href="/projects">个人副本</Link><Link className="rounded-md px-3 py-1.5 text-[var(--muted)] hover:bg-gray-50 hover:text-[var(--ink)]" href="/shared-projects">共同副本</Link></div></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm"><span className="font-medium">副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：完成 12 周减脂计划" value={name} /></label><label className="grid gap-2 text-sm"><span className="font-medium">胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setVictoryCondition(event.target.value)} placeholder="例如：完成全部训练与复盘" value={victoryCondition} /></label></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2"><MainlineSelect mainlines={state.mainlines} onChange={setMainlineId} value={mainlineId} /><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label></div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建副本</button></div>
    </form>
    <section className="mt-7 space-y-3">{state.projects.length ? state.projects.map((project) => {
      const related = state.quests.filter((quest) => quest.projectId === project.id);
      const milestones = state.milestones.filter((milestone) => milestone.projectId === project.id);
      const directTasks = related.filter((quest) => !milestones.some((milestone) => milestone.questIds.includes(quest.id)));
      const completeMilestones = milestones.filter((milestone) => getPrototypeMilestoneProgress(state, milestone).isCompleted).length;
      const progress = getPrototypeProjectProgress(state, project.id);
      const complete = progress.completed;
      const percent = progress.percent;
      const mainline = state.mainlines.find((item) => item.id === project.mainlineId);
      const isEditing = editingId === project.id;
      return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={project.id}>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="font-semibold">{project.name}</p><p className="mt-2 text-sm text-[var(--muted)]">{project.victoryCondition || "尚未写下胜利条件。"}</p><p className="mt-3 text-xs text-[var(--muted)]">{mainline ? <Link className="font-medium text-[var(--accent)] hover:underline" href="/mainlines">主线 · {mainline.name}</Link> : "未归入长期方向"}{project.dueDate ? ` · 目标日期：${project.dueDate}` : ""}</p></div><div className="flex items-center gap-2"><div className="min-w-40 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-right text-xs text-[var(--accent)]"><strong>{progress.completedXp} / {progress.plannedXp}</strong> XP 权重<br /><span>{complete}/{related.length} 个行动 · {percent}%</span></div><button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => startEdit(project)} type="button">编辑</button></div></div>
        {isEditing ? <div className="mt-5 grid gap-3 border-t border-[var(--line)] pt-4 sm:grid-cols-2"><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditName(event.target.value)} value={editName} /></label><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditVictoryCondition(event.target.value)} value={editVictoryCondition} /></label><MainlineSelect mainlines={state.mainlines} onChange={setEditMainlineId} value={editMainlineId} /><label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditDueDate(event.target.value)} type="date" value={editDueDate} /></label><div className="flex gap-2 sm:col-span-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" onClick={saveEdit} type="button">保存修改</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={() => setEditingId(null)} type="button">取消</button></div></div> : null}
        <details className="group mt-5 border-t border-[var(--line)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
            <div><p className="text-sm font-medium">阶段里程碑 · 阶段成果</p><p className="mt-1 text-xs text-[var(--muted)]">{completeMilestones} / {milestones.length} 已达成 · 点击查看阶段与关联任务</p></div>
            <span className="shrink-0 text-xs font-medium text-[var(--accent)]">查看</span>
          </summary>
          <div className="border-t border-[var(--line)] pt-4">
            <div className="flex flex-wrap items-center justify-end gap-2"><button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => { setAddingMilestoneTo(project.id); setMilestoneTitle(""); setMilestoneQuestIds([]); }} type="button">+ 新增里程碑</button></div>
            {addingMilestoneTo === project.id ? <MilestoneEditor title={milestoneTitle} questIds={milestoneQuestIds} tasks={related} onCancel={() => setAddingMilestoneTo(null)} onSave={(quickTaskTitle) => createMilestone(project.id, quickTaskTitle)} onTitleChange={setMilestoneTitle} onQuestIdsChange={setMilestoneQuestIds} saveLabel="添加里程碑" /> : null}
            {milestones.length ? <div className="mt-4 border-l-2 border-[var(--line)] pl-4">{milestones.map((milestone) => { const progress = getPrototypeMilestoneProgress(state, milestone); const isMilestoneEditing = editingMilestoneId === milestone.id; return <div className="relative mb-3 rounded-lg border border-[var(--line)] bg-white px-3 py-3 last:mb-0" key={milestone.id}><span aria-hidden="true" className={"absolute -left-[1.45rem] top-5 h-3 w-3 rounded-full border-2 border-white " + (progress.isCompleted ? "bg-[var(--success)]" : "bg-[var(--accent)]")} /><div className="flex items-center justify-between gap-3"><div><p className={progress.isCompleted ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{milestone.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{progress.total ? `已结算 ${progress.completed} / ${progress.total} 项关联任务 · ${progress.completedXp}/${progress.plannedXp} XP` : "尚未关联任务"}</p></div><div className="flex items-center gap-2">{progress.isCompleted ? <span className="text-xs text-[var(--success)]">自动完成</span> : <span className="text-xs text-[var(--muted)]">推进中</span>}<button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => startMilestoneEdit(milestone)} type="button">编辑</button></div></div>{isMilestoneEditing ? <MilestoneEditor title={editMilestoneTitle} questIds={editMilestoneQuestIds} tasks={related} onCancel={() => setEditingMilestoneId(null)} onSave={saveMilestoneEdit} onTitleChange={setEditMilestoneTitle} onQuestIdsChange={setEditMilestoneQuestIds} saveLabel="保存修改" /> : null}</div>; })}</div> : <p className="mt-3 rounded-lg border border-dashed border-[var(--line)] bg-[#fafafa] px-3 py-3 text-xs text-[var(--muted)]">还没有阶段。可以先新增一个阶段，再在其中直接创建或编入任务。</p>}
          </div>
        </details>
        <details className="group border-t border-[var(--line)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 [&::-webkit-details-marker]:hidden">
            <div><p className="text-sm font-medium">任务 · 未编入阶段的直接行动</p><p className="mt-1 text-xs text-[var(--muted)]">{directTasks.length} 项 · 点击查看、添加或完成直接行动</p></div>
            <span className="shrink-0 text-xs font-medium text-[var(--accent)]">查看</span>
          </summary>
          <div className="border-t border-[var(--line)]"><LinkedQuestPanel embedded state={state} onStateChange={save} mainlineId={project.mainlineId} projectId={project.id} /></div>
        </details>
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${percent}%` }} /></div>
      </article>;
    }) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">先创建一个有终点的副本。</p><p className="mt-2 text-sm text-[var(--muted)]">之后可以随时回到任务页，把具体行动关联进来。</p></div>}</section>
  </div>;
}

function MilestoneEditor({ tasks, title, questIds, onTitleChange, onQuestIdsChange, onSave, onCancel, saveLabel }: { tasks: PrototypeQuest[]; title: string; questIds: string[]; onTitleChange: (value: string) => void; onQuestIdsChange: (value: string[]) => void; onSave: (quickTask: PrototypeQuestDraft) => void; onCancel: () => void; saveLabel: string }) {
  const [quickTask, setQuickTask] = useState<PrototypeQuestDraft>({ title: "", questType: "standard", difficulty: "standard", importance: "helpful", resistance: "none" });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const toggleQuest = (questId: string) => onQuestIdsChange(questIds.includes(questId) ? questIds.filter((item) => item !== questId) : [...questIds, questId]);
  const update = (patch: Partial<PrototypeQuestDraft>) => setQuickTask((current) => ({ ...current, ...patch }));

  return <form className="mt-3 rounded-lg bg-[#fafafa] p-3" onSubmit={(event) => { event.preventDefault(); onSave(quickTask); }}>
    <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>里程碑名称</span><input autoFocus className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onTitleChange(event.target.value)} placeholder="例如：完成第一周训练安排" value={title} /></label>
    <div className="mt-3"><p className="text-xs text-[var(--muted)]">在此里程碑下新增任务（可选）</p><input className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => update({ title: event.target.value })} placeholder="例如：预订酒店" value={quickTask.title} /><button className="mt-2 text-xs text-[var(--muted)] hover:text-[var(--accent)]" onClick={() => setOptionsOpen((current) => !current)} type="button">{optionsOpen ? "⌄ 收起任务属性" : "› 设置任务属性（可选）"}</button>{optionsOpen ? <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><TaskSelect label="任务类型" onChange={(value) => update({ questType: value as PrototypeQuestDraft["questType"] })} options={[["micro", "微型任务"], ["standard", "普通任务"], ["focus", "重点任务"], ["milestone", "里程碑任务"], ["boss", "Boss 任务"]]} value={quickTask.questType} /><TaskSelect label="难度" onChange={(value) => update({ difficulty: value as PrototypeQuestDraft["difficulty"] })} options={[["easy", "简单"], ["standard", "普通"], ["hard", "困难"], ["epic", "极难"]]} value={quickTask.difficulty} /><TaskSelect label="重要度" onChange={(value) => update({ importance: value as PrototypeQuestDraft["importance"] })} options={[["maintenance", "日常维护"], ["helpful", "有帮助"], ["goal", "推动目标"], ["critical", "关键结果"]]} value={quickTask.importance} /><TaskSelect label="心理阻力" onChange={(value) => update({ resistance: value as PrototypeQuestDraft["resistance"] })} options={[["none", "无明显阻力"], ["reluctant", "有些不想做"], ["procrastinated", "明显拖延"], ["avoided", "长期回避"]]} value={quickTask.resistance} /><label className="grid gap-1 text-xs text-[var(--muted)]"><span>DDL（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => update({ dueDate: event.target.value || undefined })} type="date" value={quickTask.dueDate ?? ""} /></label></div> : null}<p className="mt-1 text-xs text-[var(--muted)]">保存时会自动归属这个副本，并关联到此里程碑。</p></div>
    <div className="mt-3"><p className="text-xs text-[var(--muted)]">关联已有任务（全部结算后自动完成）</p>{tasks.length ? <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[var(--line)] bg-white p-2">{tasks.map((task) => <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-gray-50" key={task.id}><input checked={questIds.includes(task.id)} className="h-4 w-4 accent-[var(--accent)]" onChange={() => toggleQuest(task.id)} type="checkbox" /><span className={task.status === "completed" ? "text-[var(--muted)] line-through" : ""}>{task.title}</span>{task.status === "completed" ? <span className="ml-auto text-xs text-[var(--success)]">已结算</span> : null}</label>)}</div> : <p className="mt-2 rounded-lg border border-dashed border-[var(--line)] bg-white p-3 text-xs text-[var(--muted)]">可以直接在上方填写一项新任务；保存后它会自动关联这个里程碑。</p>}</div>
    <div className="mt-3 flex gap-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" type="submit">{saveLabel}</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={onCancel} type="button">取消</button></div>
  </form>;
}

function TaskSelect({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs text-[var(--muted)]"><span>{label}</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}</select></label>;
}

function MainlineSelect({ mainlines, value, onChange }: { mainlines: PrototypeState["mainlines"]; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>关联主线（可选）</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" value={value} onChange={(event) => onChange(event.target.value)}><option value="">暂不关联主线</option>{mainlines.map((mainline) => <option key={mainline.id} value={mainline.id}>{mainline.name}</option>)}</select></label>;
}