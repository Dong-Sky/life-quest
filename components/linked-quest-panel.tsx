"use client";

import Link from "next/link";
import { useState } from "react";
import { createPrototypeQuest, settlePrototypeQuest, type PrototypeState } from "@/src/prototype/state";

export function LinkedQuestPanel({ state, onStateChange, mainlineId, projectId }: {
  state: PrototypeState;
  onStateChange: (next: PrototypeState) => void;
  mainlineId?: string;
  projectId?: string;
}) {
  const [title, setTitle] = useState("");
  const quests = state.quests.filter((quest) => projectId ? quest.projectId === projectId : quest.mainlineId === mainlineId && !quest.projectId);
  const openCount = quests.filter((quest) => quest.status === "open").length;

  const create = () => {
    const next = createPrototypeQuest(state, {
      title,
      questType: "standard",
      difficulty: "standard",
      importance: "helpful",
      resistance: "none",
      mainlineId,
      projectId,
    });

    if (next !== state) {
      onStateChange(next);
      setTitle("");
    }
  };

  return <section className="mt-5 border-t border-[var(--line)] pt-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-medium">直接拆解任务</p><p className="mt-1 text-xs text-[var(--muted)]">先把要做的事逐条写下；默认以普通任务创建，之后可在任务页调整难度、重要度等设置。</p></div>
      <Link className="shrink-0 text-xs font-medium text-[var(--accent)] hover:underline" href="/quests">管理全部任务 →</Link>
    </div>
    <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <input className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setTitle(event.target.value)} placeholder="例如：预订酒店" value={title} />
      <button className="shrink-0 rounded-lg bg-[var(--ink)] px-3 py-2 text-sm font-medium text-white" type="submit">添加任务</button>
    </form>
    {quests.length ? <div className="mt-3 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-white">
      {quests.map((quest) => <div className="flex items-center justify-between gap-3 px-3 py-2.5" key={quest.id}>
        <p className={quest.status === "completed" ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{quest.title}</p>
        {quest.status === "completed" ? <span className="shrink-0 text-xs text-[var(--success)]">已结算 +{quest.reward?.xp ?? 0} XP</span> : <button className="shrink-0 rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => onStateChange(settlePrototypeQuest(state, quest.id))} type="button">完成</button>}
      </div>)}
    </div> : <p className="mt-3 text-xs text-[var(--muted)]">还没有直接拆解的任务。</p>}
    {quests.length ? <p className="mt-2 text-xs text-[var(--muted)]">待推进 {openCount} 项 · 已完成 {quests.length - openCount} 项</p> : null}
  </section>;
}
