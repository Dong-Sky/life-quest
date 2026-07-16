"use client";

import Link from "next/link";
import { useState } from "react";
import type { Difficulty, Importance, QuestType, Resistance } from "@/src/domain/rewards/types";
import { createPrototypeQuest, settlePrototypeQuest, type PrototypeState } from "@/src/prototype/state";

const options = {
  questType: [["micro", "微型任务"], ["standard", "普通任务"], ["focus", "重点任务"], ["milestone", "项目里程碑"], ["boss", "Boss 任务"]],
  difficulty: [["easy", "简单"], ["standard", "普通"], ["hard", "困难"], ["epic", "极难"]],
  importance: [["maintenance", "日常维护"], ["helpful", "有帮助"], ["goal", "推动目标"], ["critical", "关键结果"]],
  resistance: [["none", "无明显阻力"], ["reluctant", "有些不想做"], ["procrastinated", "明显拖延"], ["avoided", "长期回避"]],
} as const;

export function LinkedQuestPanel({ state, onStateChange, mainlineId, projectId, embedded = false }: {
  state: PrototypeState;
  onStateChange: (next: PrototypeState) => void;
  mainlineId?: string;
  projectId?: string;
  embedded?: boolean;
}) {
  const [title, setTitle] = useState("");
  const [questType, setQuestType] = useState<QuestType>("standard");
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [importance, setImportance] = useState<Importance>("helpful");
  const [resistance, setResistance] = useState<Resistance>("none");
  const [dueDate, setDueDate] = useState("");
  const milestoneQuestIds = new Set(projectId ? state.milestones.filter((milestone) => milestone.projectId === projectId).flatMap((milestone) => milestone.questIds) : []);
  const quests = state.quests.filter((quest) => projectId ? quest.projectId === projectId && !milestoneQuestIds.has(quest.id) : quest.mainlineId === mainlineId && !quest.projectId);
  const openCount = quests.filter((quest) => quest.status === "open").length;

  const create = () => {
    const next = createPrototypeQuest(state, { title, questType, difficulty, importance, resistance, mainlineId, projectId, dueDate: dueDate || undefined });

    if (next !== state) {
      onStateChange(next);
      setTitle("");
      setDueDate("");
    }
  };

  return <section className={embedded ? "pt-4" : "mt-5 border-t border-[var(--line)] pt-4"}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-sm font-medium">任务 · 未编入阶段的直接行动</p><p className="mt-1 text-xs text-[var(--muted)]">{projectId ? "这些行动属于当前副本，但暂未归入一个阶段里程碑。" : "这些行动连接到当前主线，但还没有归入某个副本。"} 需要时再展开设置任务属性。</p></div>
      <Link className="shrink-0 text-xs font-medium text-[var(--accent)] hover:underline" href="/quests">管理全部任务 →</Link>
    </div>
    <form className="mt-3" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" onChange={(event) => setTitle(event.target.value)} placeholder="例如：预订酒店" value={title} /><button className="shrink-0 rounded-lg bg-[var(--ink)] px-3 py-2 text-sm font-medium text-white" type="submit">添加任务</button></div>
      <details className="mt-2 rounded-lg border border-[var(--line)] bg-[#fafafa] px-3 py-2"><summary className="cursor-pointer text-xs font-medium text-[var(--muted)]">设置任务属性（可选）</summary><div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><TaskSelect label="任务类型" options={options.questType} onChange={(value) => setQuestType(value as QuestType)} value={questType} /><TaskSelect label="难度" options={options.difficulty} onChange={(value) => setDifficulty(value as Difficulty)} value={difficulty} /><TaskSelect label="重要度" options={options.importance} onChange={(value) => setImportance(value as Importance)} value={importance} /><TaskSelect label="心理阻力" options={options.resistance} onChange={(value) => setResistance(value as Resistance)} value={resistance} /></div><label className="mt-3 grid max-w-xs gap-1 text-xs text-[var(--muted)]"><span>DDL（可选）</span><input className="rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm text-[var(--ink)]" onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} /></label></details>
    </form>
    {quests.length ? <div className="mt-3 divide-y divide-[var(--line)] rounded-lg border border-[var(--line)] bg-white">
      {quests.map((quest) => <div className="flex items-center justify-between gap-3 px-3 py-2.5" key={quest.id}>
        <div><p className={quest.status === "completed" ? "text-sm text-[var(--muted)] line-through" : "text-sm"}>{quest.title}</p><p className="mt-0.5 text-xs text-[var(--muted)]">{quest.questType} · {quest.difficulty}{quest.dueDate ? ` · DDL：${quest.dueDate}` : ""}</p></div>
        {quest.status === "completed" ? <span className="shrink-0 text-xs text-[var(--success)]">已结算 +{quest.reward?.xp ?? 0} XP</span> : <button className="shrink-0 rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => onStateChange(settlePrototypeQuest(state, quest.id))} type="button">完成</button>}
      </div>)}
    </div> : <p className="mt-3 text-xs text-[var(--muted)]">还没有直接拆解的任务。</p>}
    {quests.length ? <p className="mt-2 text-xs text-[var(--muted)]">待推进 {openCount} 项 · 已完成 {quests.length - openCount} 项</p> : null}
  </section>;
}

function TaskSelect({ label, options, value, onChange }: { label: string; options: readonly (readonly [string, string])[]; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1 text-xs text-[var(--muted)]"><span>{label}</span><select className="rounded-md border border-[var(--line)] bg-white px-2 py-1.5 text-sm text-[var(--ink)]" onChange={(event) => onChange(event.target.value)} value={value}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}