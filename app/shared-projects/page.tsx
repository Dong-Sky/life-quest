"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

type Partner = {
  friend_id: string;
  display_name: string;
  status: "pending" | "accepted" | "declined";
  direction: "sent" | "received";
};

type SharedMember = {
  user_id: string;
  display_name: string;
};

type SharedTask = {
  id: string;
  title: string;
  status: "open" | "completed";
  completed_at: string | null;
  completed_by: string | null;
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
};

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
  const [taskTitles, setTaskTitles] = useState<Record<string, string>>({});

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

    setPartners(((friendships ?? []) as Partner[]).filter((partner) => partner.status === "accepted"));
    setProjects((sharedProjects ?? []) as SharedProject[]);
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

  const addTask = async (projectId: string) => {
    const title = taskTitles[projectId]?.trim();
    if (!title) return;

    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error: taskError } = await supabase.rpc("create_shared_project_task", {
      target_project_id: projectId,
      task_title: title,
    });

    if (taskError) {
      setError(taskError.message);
      return;
    }

    setTaskTitles((current) => ({ ...current, [projectId]: "" }));
    await load();
  };

  const completeTask = async (taskId: string) => {
    setError("");
    setNotice("");
    const supabase = createSupabaseBrowserClient();
    const { error: completeError } = await supabase.rpc("complete_shared_project_task", {
      target_task_id: taskId,
    });

    if (completeError) {
      setError(completeError.message);
      return;
    }

    setNotice("共同任务已完成，并已同步给所有参与者。");
    await load();
  };

  return <main className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6">
      <div>
        <p className="text-sm text-[var(--muted)]">共同副本</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">和搭档一起，推进一件有终点的事。</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">副本内的任何任务都可由参与者完成，进度会同步给所有人。第一版只同步进度，不影响各自的 XP、金币和周结算。</p>
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
        const completed = project.tasks.filter((task) => task.status === "completed").length;
        const total = project.tasks.length;
        const percent = total ? Math.round((completed / total) * 100) : 0;
        const isCompleted = project.status === "completed";

        return <article className="rounded-xl border border-[var(--line)] bg-white p-5" key={project.id}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><div className="flex items-center gap-2"><p className="font-semibold">{project.name}</p><span className={isCompleted ? "rounded-full bg-green-50 px-2 py-0.5 text-xs text-[var(--success)]" : "rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]"}>{isCompleted ? "已完成" : "推进中"}</span></div><p className="mt-2 text-sm text-[var(--muted)]">{project.victory_condition || "尚未写下胜利条件。"}</p><p className="mt-3 text-xs text-[var(--muted)]">参与者：{project.members.map((member) => member.display_name).join("、")}{project.due_date ? ` · 目标日期：${project.due_date}` : ""}</p></div>
            <div className="min-w-36 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-right text-xs text-[var(--accent)]"><strong>{completed} / {total}</strong> 个任务<br /><span>{percent}% 推进</span></div>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${percent}%` }} /></div>
          <div className="mt-5 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)]">
            {project.tasks.length ? project.tasks.map((task) => <div className="flex items-center justify-between gap-3 px-3 py-3" key={task.id}><p className={task.status === "completed" ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{task.title}</p>{task.status === "completed" ? <span className="text-xs text-[var(--success)]">已完成</span> : <button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => void completeTask(task.id)} type="button">完成任务</button>}</div>) : <p className="px-3 py-4 text-sm text-[var(--muted)]">还没有共同任务。先添加一个下一步行动。</p>}
          </div>
          {!isCompleted ? <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); void addTask(project.id); }}><input className="min-w-0 flex-1 rounded-lg border border-[var(--line)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setTaskTitles((current) => ({ ...current, [project.id]: event.target.value }))} placeholder="添加一项共同任务" value={taskTitles[project.id] ?? ""} /><button className="shrink-0 rounded-lg bg-[var(--ink)] px-3 py-2 text-sm font-medium text-white" type="submit">添加任务</button></form> : null}
        </article>;
      })}
    </section>
  </main>;
}
