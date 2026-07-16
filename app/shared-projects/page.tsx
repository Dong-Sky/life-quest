"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { calculateQuestReward } from "@/src/domain/rewards/calculate-quest-reward";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";
import { recordPrototypeSharedQuestSettlement, readPrototypeState, writePrototypeState } from "@/src/prototype/state";

type Partner = {
  friend_id: string;
  display_name: string;
  status: "pending" | "accepted" | "declined";
  direction: "sent" | "received";
};

type TaskAttributes = {
  questType: "micro" | "standard" | "focus" | "milestone" | "boss";
  difficulty: "easy" | "standard" | "hard" | "epic";
  importance: "maintenance" | "helpful" | "goal" | "critical";
  resistance: "none" | "reluctant" | "procrastinated" | "avoided";
};

type TaskDraft = TaskAttributes & { title: string; dueDate: string };

type SharedMember = {
  user_id: string;
  display_name: string;
};

type SharedTask = {
  id: string;
  title: string;
  quest_type: TaskAttributes["questType"];
  difficulty: TaskAttributes["difficulty"];
  importance: TaskAttributes["importance"];
  resistance: TaskAttributes["resistance"];
  status: "open" | "completed";
  completed_at: string | null;
  completed_by: string | null;
  xp_awarded: number | null;
  coins_awarded: number | null;
  due_date: string | null;
};

type SharedMilestone = {
  id: string;
  title: string;
  task_ids: string[];
};

type SharedProject = {
  id: string;
  name: string;
  victory_condition: string;
  due_date: string | null;
  status: "active" | "completed";
  created_at: string;
  members: SharedMember[];
  tasks: SharedTask[];
  milestones: SharedMilestone[];
};

const defaultTaskAttributes: TaskAttributes = {
  questType: "standard",
  difficulty: "standard",
  importance: "helpful",
  resistance: "none",
};

const taskTypeLabels: Record<TaskAttributes["questType"], string> = {
  micro: "微型任务",
  standard: "普通任务",
  focus: "重点任务",
  milestone: "里程碑任务",
  boss: "Boss 任务",
};

const difficultyLabels: Record<TaskAttributes["difficulty"], string> = {
  easy: "简单",
  standard: "普通",
  hard: "困难",
  epic: "极难",
};

const importanceLabels: Record<TaskAttributes["importance"], string> = {
  maintenance: "日常维护",
  helpful: "有帮助",
  goal: "推动目标",
  critical: "关键结果",
};

const resistanceLabels: Record<TaskAttributes["resistance"], string> = {
  none: "无明显阻力",
  reluctant: "有些不想做",
  procrastinated: "明显拖延",
  avoided: "长期回避",
};

function createTaskDraft(): TaskDraft {
  return { title: "", dueDate: "", ...defaultTaskAttributes };
}

function getSharedTaskProgress(tasks: SharedTask[]) {
  const plannedXp = tasks.reduce((total, task) => total + calculateQuestReward({
    questType: task.quest_type,
    difficulty: task.difficulty,
    importance: task.importance,
    resistance: task.resistance,
  }).xp, 0);
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const completedXp = completedTasks.reduce((total, task) => total + calculateQuestReward({
    questType: task.quest_type,
    difficulty: task.difficulty,
    importance: task.importance,
    resistance: task.resistance,
  }).xp, 0);

  return {
    total: tasks.length,
    completed: completedTasks.length,
    plannedXp,
    completedXp,
    percent: plannedXp ? Math.round((completedXp / plannedXp) * 100) : 0,
  };
}

export default function SharedProjectsPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [projects, setProjects] = useState<SharedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [victoryCondition, setVictoryCondition] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, TaskDraft>>({});
  const [expandedTaskForms, setExpandedTaskForms] = useState<Record<string, boolean>>({});
  const [milestoneProjectId, setMilestoneProjectId] = useState<string | null>(null);
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneTaskIds, setMilestoneTaskIds] = useState<string[]>([]);
  const [milestoneNewTask, setMilestoneNewTask] = useState<TaskDraft>(createTaskDraft());
  const [milestoneOptionsOpen, setMilestoneOptionsOpen] = useState(false);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const [{ data: friendships, error: friendshipsError }, { data: sharedProjects, error: projectsError }] = await Promise.all([
      supabase.rpc("list_my_friendships"),
      supabase.rpc("list_my_shared_projects"),
    ]);

    if (friendshipsError || projectsError) {
      setError(friendshipsError?.message ?? projectsError?.message ?? "无法加载共同副本。");
      setIsLoading(false);
      return;
    }

    const normalizedProjects = ((sharedProjects ?? []) as Partial<SharedProject>[]).map((project) => ({
      ...project,
      members: project.members ?? [],
      tasks: (project.tasks ?? []).map((task) => ({
        ...defaultTaskAttributes,
        ...task,
        xp_awarded: task.xp_awarded ?? null,
        coins_awarded: task.coins_awarded ?? null,
        due_date: task.due_date ?? null,
      })),
      milestones: project.milestones ?? [],
    })) as SharedProject[];

    setPartners(((friendships ?? []) as Partner[]).filter((partner) => partner.status === "accepted"));
    setProjects(normalizedProjects);

    const { data: userData } = await supabase.auth.getUser();
    if (userData.user) {
      const currentWorkspaceState = readPrototypeState();
      let nextWorkspaceState = currentWorkspaceState;

      for (const task of normalizedProjects.flatMap((project) => project.tasks)) {
        if (task.status !== "completed" || task.completed_by !== userData.user.id || task.xp_awarded === null || task.coins_awarded === null) continue;
        nextWorkspaceState = recordPrototypeSharedQuestSettlement(nextWorkspaceState, {
          sharedTaskId: task.id,
          title: task.title,
          questType: task.quest_type,
          difficulty: task.difficulty,
          importance: task.importance,
          resistance: task.resistance,
          xp: task.xp_awarded,
          coins: task.coins_awarded,
          completedAt: task.completed_at ?? undefined,
        });
      }

      if (nextWorkspaceState !== currentWorkspaceState) writePrototypeState(nextWorkspaceState);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePartner = (partnerId: string) => {
    setSelectedPartnerIds((current) => current.includes(partnerId) ? current.filter((id) => id !== partnerId) : [...current, partnerId]);
  };

  const createProject = async () => {
    setError("");
    setNotice("");

    if (!name.trim()) {
      setError("请填写共同副本名称。");
      return;
    }

    if (!selectedPartnerIds.length) {
      setError("请选择至少一位已确认的搭档。");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { error: createError } = await supabase.rpc("create_shared_project", {
      project_name: name.trim(),
      project_victory_condition: victoryCondition.trim(),
      project_due_date: dueDate || null,
      participant_ids: selectedPartnerIds,
    });

    if (createError) {
      setError(createError.message);
      return;
    }

    setName("");
    setVictoryCondition("");
    setDueDate("");
    setSelectedPartnerIds([]);
    setNotice("共同副本已创建，搭档现在也能看到它。");
    await load();
  };

  const updateTaskDraft = (projectId: string, patch: Partial<TaskDraft>) => {
    setTaskDrafts((current) => ({ ...current, [projectId]: { ...(current[projectId] ?? createTaskDraft()), ...patch } }));
  };

  const addTask = async (projectId: string) => {
    const draft = taskDrafts[projectId] ?? createTaskDraft();
    const title = draft.title.trim();
    if (!title) return;

    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error: taskError } = await supabase.rpc("create_shared_project_task", {
      target_project_id: projectId,
      task_title: title,
      task_quest_type: draft.questType,
      task_difficulty: draft.difficulty,
      task_importance: draft.importance,
      task_resistance: draft.resistance,
      task_due_date: draft.dueDate || null,
    });

    if (taskError) {
      setError(taskError.message);
      return;
    }

    setTaskDrafts((current) => ({ ...current, [projectId]: createTaskDraft() }));
    setExpandedTaskForms((current) => ({ ...current, [projectId]: false }));
    await load();
  };

  const completeTask = async (taskId: string) => {
    setError("");
    setNotice("");
    const task = projects.flatMap((project) => project.tasks).find((item) => item.id === taskId);
    if (!task) return;

    const supabase = createSupabaseBrowserClient();
    const { data, error: completeError } = await supabase.rpc("complete_shared_project_task", {
      target_task_id: taskId,
    });

    if (completeError) {
      setError(completeError.message);
      return;
    }

    const awarded = data as { xp?: number; coins?: number } | null;
    const xp = awarded?.xp ?? 0;
    const coins = awarded?.coins ?? 0;
    const nextWorkspaceState = recordPrototypeSharedQuestSettlement(readPrototypeState(), {
      sharedTaskId: task.id,
      title: task.title,
      questType: task.quest_type,
      difficulty: task.difficulty,
      importance: task.importance,
      resistance: task.resistance,
      xp,
      coins,
      completedAt: new Date().toISOString(),
    });
    writePrototypeState(nextWorkspaceState);

    setNotice(`共同任务已完成，并同步给所有参与者。你获得了 +${xp} XP · +${coins} 金币。`);
    await load();
  };

  const reopenProject = async (projectId: string) => {
    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error: reopenError } = await supabase.rpc("reopen_shared_project", {
      target_project_id: projectId,
    });

    if (reopenError) {
      setError(reopenError.message);
      return;
    }

    setNotice("共同副本已恢复为推进中，可以继续补充任务和里程碑。");
    await load();
  };

  const completeProject = async (projectId: string) => {
    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error: completeError } = await supabase.rpc("complete_shared_project", {
      target_project_id: projectId,
    });

    if (completeError) {
      setError(completeError.message);
      return;
    }

    setNotice("共同副本已完成。之后如需补充计划，可以选择“继续规划”。");
    await load();
  };

  const beginMilestone = (projectId: string) => {
    setMilestoneProjectId(projectId);
    setMilestoneTitle("");
    setMilestoneTaskIds([]);
    setMilestoneNewTask(createTaskDraft());
    setMilestoneOptionsOpen(false);
  };

  const toggleMilestoneTask = (taskId: string) => {
    setMilestoneTaskIds((current) => current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]);
  };

  const createMilestone = async () => {
    if (!milestoneProjectId || !milestoneTitle.trim()) return;

    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error: milestoneError } = await supabase.rpc("create_shared_project_milestone", {
      target_project_id: milestoneProjectId,
      milestone_title: milestoneTitle.trim(),
      task_ids: milestoneTaskIds,
      new_task_title: milestoneNewTask.title.trim(),
      new_task_quest_type: milestoneNewTask.questType,
      new_task_difficulty: milestoneNewTask.difficulty,
      new_task_importance: milestoneNewTask.importance,
      new_task_resistance: milestoneNewTask.resistance,
      new_task_due_date: milestoneNewTask.dueDate || null,
    });

    if (milestoneError) {
      setError(milestoneError.message);
      return;
    }

    setMilestoneProjectId(null);
    setNotice("里程碑已创建；关联任务全部完成后会自动达成。");
    await load();
  };

  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6">
      <div>
        <p className="text-sm text-[var(--muted)]">共同副本</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">和搭档一起，推进一件有终点的事。</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">共同副本沿用个人副本的任务、奖励与里程碑逻辑。任何参与者都能推进任务；进度同步给所有人，完成者获得自己的 XP 和金币。</p>
      </div>
      <div className="flex rounded-lg border border-[var(--line)] bg-white p-1 text-sm"><Link className="rounded-md px-3 py-1.5 text-[var(--muted)] hover:bg-gray-50 hover:text-[var(--ink)]" href="/projects">个人副本</Link><Link className="rounded-md bg-[var(--accent-soft)] px-3 py-1.5 font-medium text-[var(--accent)]" href="/shared-projects">共同副本</Link></div>
    </header>

    {notice ? <p className="mt-5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p> : null}
    {error ? <p className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

    <section className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4">
      <h2 className="text-sm font-semibold">创建共同副本</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm"><span className="font-medium">副本名称</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setName(event.target.value)} placeholder="例如：2026 夏季旅行" value={name} /></label>
        <label className="grid gap-2 text-sm"><span className="font-medium">胜利条件（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setVictoryCondition(event.target.value)} placeholder="例如：完成双方满意的五天旅行" value={victoryCondition} /></label>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p className="text-sm font-medium">邀请哪些搭档一起参加？</p>
          {partners.length ? <div className="mt-2 flex flex-wrap gap-2">{partners.map((partner) => <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm" key={partner.friend_id}><input checked={selectedPartnerIds.includes(partner.friend_id)} className="h-4 w-4 accent-[var(--accent)]" onChange={() => togglePartner(partner.friend_id)} type="checkbox" />{partner.display_name}</label>)}</div> : <p className="mt-2 text-sm text-[var(--muted)]">先到 <Link className="text-[var(--accent)] underline" href="/friends">伙伴</Link> 页面确认一位搭档，才能创建共同副本。</p>}
        </div>
        <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>目标日期（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm text-[var(--ink)]" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label>
      </div>
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!partners.length} onClick={() => void createProject()} type="button">创建共同副本</button></div>
    </section>

    <section className="mt-7 space-y-3">
      {isLoading ? <div className="rounded-xl border border-[var(--line)] bg-white p-8 text-center text-sm text-[var(--muted)]">正在加载共同副本…</div> : null}
      {!isLoading && !projects.length ? <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center"><p className="font-medium">还没有共同副本。</p><p className="mt-2 text-sm text-[var(--muted)]">从一次旅行、家庭计划或共同挑战开始即可。</p></div> : null}
      {projects.map((project) => {
        const progress = getSharedTaskProgress(project.tasks);
        const completed = progress.completed;
        const total = progress.total;
        const percent = progress.percent;
        const isCompleted = project.status === "completed";
        const isCreatingMilestone = milestoneProjectId === project.id;

        return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={project.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="flex items-center gap-2"><p className="font-semibold">{project.name}</p><span className={isCompleted ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-[var(--success)]" : "rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]"}>{isCompleted ? "已完成" : "推进中"}</span></div><p className="mt-2 text-sm text-[var(--muted)]">{project.victory_condition || "尚未写下胜利条件。"}</p><p className="mt-3 text-xs text-[var(--muted)]">参与者：{project.members.map((member) => member.display_name).join("、")}{project.due_date ? ` · 目标日期：${project.due_date}` : ""}</p></div>
            <div className="min-w-40 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-right text-xs text-[var(--accent)]"><strong>{progress.completedXp} / {progress.plannedXp}</strong> XP 权重<br /><span>{completed}/{total} 个行动 · {percent}%</span></div>
          </div>

          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${percent}%` }} /></div>

          {isCompleted ? <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-3 py-2"><p className="text-xs text-green-800">这个副本已由参与者主动结束。需要补充计划时可重新开启。</p><button className="shrink-0 rounded-md border border-green-300 bg-white px-2.5 py-1.5 text-xs text-green-800 hover:bg-green-100" onClick={() => void reopenProject(project.id)} type="button">继续规划</button></div> : total > 0 && completed === total ? <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-[#fafafa] px-3 py-2"><p className="text-xs text-[var(--muted)]">当前任务都已完成；如确认这件事已结束，可手动完成副本。</p><button className="shrink-0 rounded-md bg-[var(--ink)] px-2.5 py-1.5 text-xs text-white" onClick={() => void completeProject(project.id)} type="button">完成副本</button></div> : null}

          <section className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">直接拆解任务</p><p className="mt-1 text-xs text-[var(--muted)]">先把要做的事逐条写下；需要时再展开设置任务属性。</p></div></div>
            <div className="mt-3 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">
              {project.tasks.length ? project.tasks.map((task) => <div className="flex items-center justify-between gap-3 px-3 py-3" key={task.id}><div><p className={task.status === "completed" ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{task.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{taskTypeLabels[task.quest_type]} · {difficultyLabels[task.difficulty]} · {importanceLabels[task.importance]} · {resistanceLabels[task.resistance]}{task.due_date ? ` · DDL：${task.due_date}` : ""}</p></div>{task.status === "completed" ? <span className="text-right text-xs text-[var(--success)]">已完成<br />+{task.xp_awarded ?? 0} XP · +{task.coins_awarded ?? 0} 金币</span> : <button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => void completeTask(task.id)} type="button">完成任务</button>}</div>) : <p className="px-3 py-4 text-sm text-[var(--muted)]">还没有共同任务。先添加一个下一步行动。</p>}
            </div>

            {!isCompleted ? <form className="mt-3 rounded-lg border border-[var(--line)] bg-[#fafafa] p-3" onSubmit={(event) => { event.preventDefault(); void addTask(project.id); }}><div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => updateTaskDraft(project.id, { title: event.target.value })} placeholder="例如：预订酒店" value={(taskDrafts[project.id] ?? createTaskDraft()).title} /><button className="shrink-0 rounded-lg bg-[var(--ink)] px-3 py-2 text-sm font-medium text-white" type="submit">添加任务</button></div><button className="mt-2 text-xs text-[var(--muted)] hover:text-[var(--accent)]" onClick={() => setExpandedTaskForms((current) => ({ ...current, [project.id]: !current[project.id] }))} type="button">{expandedTaskForms[project.id] ? "⌄ 收起任务属性" : "› 设置任务属性（可选）"}</button>{expandedTaskForms[project.id] ? <TaskAttributeFields draft={taskDrafts[project.id] ?? createTaskDraft()} onChange={(patch) => updateTaskDraft(project.id, patch)} /> : null}</form> : null}
          </section>

          <section className="mt-5 border-t border-[var(--line)] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-medium">阶段里程碑</p><p className="mt-1 text-xs text-[var(--muted)]">把若干任务编成一个阶段；其中全部完成后自动达成。</p></div>{!isCompleted ? <button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => beginMilestone(project.id)} type="button">+ 新增里程碑</button> : null}</div>
            {isCreatingMilestone ? <MilestoneEditor project={project} newTask={milestoneNewTask} onCancel={() => setMilestoneProjectId(null)} onNewTaskChange={(patch) => setMilestoneNewTask((current) => ({ ...current, ...patch }))} onSave={() => void createMilestone()} onTaskIdsChange={setMilestoneTaskIds} onTitleChange={setMilestoneTitle} optionsOpen={milestoneOptionsOpen} selectedTaskIds={milestoneTaskIds} setOptionsOpen={setMilestoneOptionsOpen} title={milestoneTitle} /> : null}
            {project.milestones.length ? <div className="mt-3 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">{project.milestones.map((milestone) => {
              const milestoneTasks = project.tasks.filter((task) => milestone.task_ids.includes(task.id));
              const milestoneProgress = getSharedTaskProgress(milestoneTasks);
              const milestoneCompleted = milestoneProgress.completed;
              const autoCompleted = milestoneTasks.length > 0 && milestoneCompleted === milestoneTasks.length;
              return <div className="flex items-center justify-between gap-3 px-3 py-3" key={milestone.id}><div><p className={autoCompleted ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{milestone.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{milestoneTasks.length ? `已完成 ${milestoneCompleted} / ${milestoneTasks.length} 项关联任务 · ${milestoneProgress.completedXp}/${milestoneProgress.plannedXp} XP` : "尚未关联任务"}</p></div><span className={autoCompleted ? "text-xs text-[var(--success)]" : "text-xs text-[var(--muted)]"}>{autoCompleted ? "自动完成" : "推进中"}</span></div>;
            })}</div> : <p className="mt-3 text-xs text-[var(--muted)]">可先直接拆解任务，或在新增里程碑时同时创建并关联第一项任务。</p>}
          </section>
        </article>;
      })}
    </section>
  </main>;
}

function TaskAttributeFields({ draft, onChange }: { draft: TaskDraft; onChange: (patch: Partial<TaskDraft>) => void }) {
  return <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <SelectField label="任务类型" onChange={(value) => onChange({ questType: value as TaskAttributes["questType"] })} value={draft.questType}>{Object.entries(taskTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
    <SelectField label="难度" onChange={(value) => onChange({ difficulty: value as TaskAttributes["difficulty"] })} value={draft.difficulty}>{Object.entries(difficultyLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
    <SelectField label="重要度" onChange={(value) => onChange({ importance: value as TaskAttributes["importance"] })} value={draft.importance}>{Object.entries(importanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
    <SelectField label="心理阻力" onChange={(value) => onChange({ resistance: value as TaskAttributes["resistance"] })} value={draft.resistance}>{Object.entries(resistanceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</SelectField>
    <label className="grid gap-1 text-xs text-[var(--muted)]"><span>DDL（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onChange({ dueDate: event.target.value })} type="date" value={draft.dueDate} /></label>
  </div>;
}

function SelectField({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return <label className="grid gap-1 text-xs text-[var(--muted)]"><span>{label}</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onChange(event.target.value)} value={value}>{children}</select></label>;
}

function MilestoneEditor({ project, title, selectedTaskIds, newTask, optionsOpen, onTitleChange, onTaskIdsChange, onNewTaskChange, setOptionsOpen, onSave, onCancel }: {
  project: SharedProject;
  title: string;
  selectedTaskIds: string[];
  newTask: TaskDraft;
  optionsOpen: boolean;
  onTitleChange: (value: string) => void;
  onTaskIdsChange: (value: string[]) => void;
  onNewTaskChange: (patch: Partial<TaskDraft>) => void;
  setOptionsOpen: (value: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const toggleTask = (taskId: string) => onTaskIdsChange(selectedTaskIds.includes(taskId) ? selectedTaskIds.filter((id) => id !== taskId) : [...selectedTaskIds, taskId]);

  return <form className="mt-3 rounded-lg bg-[#fafafa] p-3" onSubmit={(event) => { event.preventDefault(); onSave(); }}>
    <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>里程碑名称</span><input autoFocus className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onTitleChange(event.target.value)} placeholder="例如：完成行前准备" value={title} /></label>
    <div className="mt-3"><p className="text-xs text-[var(--muted)]">在此里程碑下新增任务（可选）</p><input className="mt-2 w-full rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onNewTaskChange({ title: event.target.value })} placeholder="例如：预订酒店" value={newTask.title} /><button className="mt-2 text-xs text-[var(--muted)] hover:text-[var(--accent)]" onClick={() => setOptionsOpen(!optionsOpen)} type="button">{optionsOpen ? "⌄ 收起新任务属性" : "› 设置新任务属性（可选）"}</button>{optionsOpen ? <TaskAttributeFields draft={newTask} onChange={onNewTaskChange} /> : null}<p className="mt-1 text-xs text-[var(--muted)]">保存时会自动归属该共同副本，并关联这个里程碑。</p></div>
    <div className="mt-3"><p className="text-xs text-[var(--muted)]">关联已有任务（全部完成后自动达成）</p>{project.tasks.length ? <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-lg border border-[var(--line)] bg-white p-2">{project.tasks.map((task) => <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1.5 text-sm hover:bg-gray-50" key={task.id}><input checked={selectedTaskIds.includes(task.id)} className="h-4 w-4 accent-[var(--accent)]" onChange={() => toggleTask(task.id)} type="checkbox" /><span className={task.status === "completed" ? "text-[var(--muted)] line-through" : ""}>{task.title}</span>{task.status === "completed" ? <span className="ml-auto text-xs text-[var(--success)]">已完成</span> : null}</label>)}</div> : <p className="mt-2 rounded-lg border border-dashed border-[var(--line)] bg-white p-3 text-xs text-[var(--muted)]">可直接在上方填写第一项任务；保存后会自动关联到这个里程碑。</p>}</div>
    <div className="mt-3 flex gap-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" type="submit">添加里程碑</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={onCancel} type="button">取消</button></div>
  </form>;
}
