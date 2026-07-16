"use client";

import { useState } from "react";
import type { Difficulty, Importance, QuestType, Resistance } from "@/src/domain/rewards/types";
import type { RecurrenceCadence } from "@/src/prototype/recurrence";
import { createPrototypeQuest, initialPrototypeState, readPrototypeState, settlePrototypeQuest, type PrototypeQuest, type PrototypeState, updatePrototypeQuest, writePrototypeState } from "@/src/prototype/state";

const fieldOptions = {
  questType: [["micro", "微型任务"], ["standard", "普通任务"], ["focus", "重点任务"], ["milestone", "项目里程碑"], ["boss", "Boss 任务"]],
  difficulty: [["easy", "简单"], ["standard", "普通"], ["hard", "困难"], ["epic", "极难"]],
  importance: [["maintenance", "日常维护"], ["helpful", "有帮助"], ["goal", "推动目标"], ["critical", "关键结果"]],
  resistance: [["none", "无明显阻力"], ["reluctant", "有些不想做"], ["procrastinated", "明显拖延"], ["avoided", "长期回避"]],
} as const;

export default function QuestsPage() {
  const [state, setState] = useState<PrototypeState>(() => typeof window === "undefined" ? initialPrototypeState() : readPrototypeState());
  const [title, setTitle] = useState("");
  const [questType, setQuestType] = useState<QuestType>("standard");
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [importance, setImportance] = useState<Importance>("helpful");
  const [resistance, setResistance] = useState<Resistance>("none");
  const [mainlineId, setMainlineId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [cadence, setCadence] = useState<RecurrenceCadence>("daily");
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [dueDate, setDueDate] = useState("");
  const [showAttributes, setShowAttributes] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editMainlineId, setEditMainlineId] = useState("");
  const [editProjectId, setEditProjectId] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const save = (next: PrototypeState) => { writePrototypeState(next); setState(next); };
  const create = () => {
    const next = createPrototypeQuest(state, {
      title,
      questType,
      difficulty,
      importance,
      resistance,
      mainlineId: mainlineId || undefined,
      projectId: isRecurring ? undefined : projectId || undefined,
      recurrence: isRecurring ? { cadence, targetCount: cadence === "weekly" ? weeklyTarget : undefined } : undefined,
      dueDate: isRecurring ? undefined : dueDate || undefined,
    });
    if (next !== state) {
      save(next);
      setTitle("");
      setMainlineId("");
      setProjectId("");
      setDueDate("");
    }
  };
  const reset = () => save(initialPrototypeState());
  const startEdit = (quest: PrototypeQuest) => {
    setEditingId(quest.id);
    setEditTitle(quest.title);
    setEditMainlineId(quest.mainlineId ?? "");
    setEditProjectId(quest.projectId ?? "");
    setEditDueDate(quest.dueDate ?? "");
  };
  const saveEdit = (quest: PrototypeQuest) => {
    const next = updatePrototypeQuest(state, quest.id, {
      title: editTitle,
      mainlineId: editMainlineId || undefined,
      projectId: quest.recurrence ? undefined : editProjectId || undefined,
      dueDate: quest.recurrence ? undefined : editDueDate || undefined,
    });
    if (next !== state) {
      save(next);
      setEditingId(null);
    }
  };

  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6"><div><p className="text-sm text-[var(--muted)]">任务</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">让下一步足够具体。</h1><p className="mt-2 text-sm text-[var(--muted)]">任务可先独立创建，之后通过“编辑”关联或更换主线与副本。</p></div><button className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm hover:bg-gray-50" onClick={reset}>重置体验数据</button></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}>
      <label className="grid gap-2 text-sm"><span className="font-medium">下一步行动</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setTitle(event.target.value)} placeholder="例如：锻炼 30 分钟" value={title} /></label>
      <button aria-expanded={showAttributes} className="mt-3 flex w-full items-center justify-between rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-left text-sm font-medium hover:bg-gray-50" onClick={() => setShowAttributes((current) => !current)} type="button"><span>{showAttributes ? "收起任务属性" : "设置任务属性（可选）"}</span><span className="text-[var(--muted)]">{showAttributes ? "⌃" : "⌄"}</span></button>
      {!showAttributes ? <p className="mt-2 text-xs text-[var(--muted)]">默认创建为普通任务；需要关联主线、副本、设置周期或 DDL 时再展开。</p> : <div className="mt-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Select label="任务类型" options={fieldOptions.questType} value={questType} onChange={(value) => setQuestType(value as QuestType)} /><Select label="难度" options={fieldOptions.difficulty} value={difficulty} onChange={(value) => setDifficulty(value as Difficulty)} /><Select label="重要度" options={fieldOptions.importance} value={importance} onChange={(value) => setImportance(value as Importance)} /><Select label="心理阻力" options={fieldOptions.resistance} value={resistance} onChange={(value) => setResistance(value as Resistance)} /></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <AssociationSelect label="所属主线（可选）" items={state.mainlines} emptyLabel="暂不关联主线" onChange={setMainlineId} value={mainlineId} />
          <div className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><input checked={isRecurring} className="h-4 w-4 accent-[var(--accent)]" onChange={(event) => setIsRecurring(event.target.checked)} type="checkbox" />设为周期任务</label><p className="mt-1 text-xs text-[var(--muted)]">例如每天锻炼，或每周完成 3 次运动。</p></div>
        </div>
        {!isRecurring ? <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2"><AssociationSelect label="所属副本（可选）" items={state.projects} emptyLabel="暂不关联副本" onChange={setProjectId} value={projectId} /><DeadlineInput onChange={setDueDate} value={dueDate} /></div> : null}
        {isRecurring ? <div className="mt-3 grid max-w-xl gap-3 sm:grid-cols-2"><Select label="重复频率" options={[["daily", "每天"], ["weekly", "每周"]]} value={cadence} onChange={(value) => setCadence(value as RecurrenceCadence)} />{cadence === "weekly" ? <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>本周目标次数</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" max="7" min="1" onChange={(event) => setWeeklyTarget(Number(event.target.value))} type="number" value={weeklyTarget} /></label> : <p className="self-end pb-2 text-sm text-[var(--muted)]">每天完成 1 次后，明天会自动重新出现。</p>}</div> : null}
      </div>}
      <div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建任务</button></div>
    </form>
    <section className="mt-7 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      {state.quests.map((quest) => {
        const mainline = state.mainlines.find((item) => item.id === quest.mainlineId);
        const project = state.projects.find((item) => item.id === quest.projectId);
        const recurring = recurrenceDescription(quest);
        const action = quest.recurrence ? "记录一次并结算" : "完成并结算";
        const isEditing = editingId === quest.id;
        return <div className="border-b border-[var(--line)] last:border-b-0" key={quest.id}>
          <article className="flex items-center justify-between gap-4 px-4 py-4"><div><p className={quest.status === "completed" ? "font-medium text-[var(--muted)] line-through" : "font-medium"}>{quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{project?.name ?? mainline?.name ?? "未关联主线"} · {recurring ?? `${quest.questType} · ${quest.difficulty}`}{quest.dueDate ? ` · DDL：${quest.dueDate}` : ""}</p></div><div className="flex shrink-0 items-center gap-2">{quest.status === "completed" ? <span className="text-right text-xs text-[var(--success)]">{quest.recurrence ? "本周期已完成" : `+${quest.reward?.xp} XP · +${quest.reward?.coins} coins`}</span> : <button className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent)]" onClick={() => save(settlePrototypeQuest(state, quest.id))}>{action}</button>}<button className="rounded-md border border-[var(--line)] px-2.5 py-1.5 text-xs hover:bg-gray-50" onClick={() => startEdit(quest)} type="button">编辑</button></div></article>
          {isEditing ? <div className="grid gap-3 bg-[#fafafa] px-4 pb-4 pt-1 sm:grid-cols-2"><label className="grid gap-1.5 text-xs text-[var(--muted)] sm:col-span-2"><span>下一步行动</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => setEditTitle(event.target.value)} value={editTitle} /></label><AssociationSelect label="所属主线（可选）" items={state.mainlines} emptyLabel="暂不关联主线" onChange={setEditMainlineId} value={editMainlineId} />{quest.recurrence ? <p className="self-end pb-2 text-xs text-[var(--muted)]">周期任务保留独立节奏，暂不关联副本或 DDL。</p> : <><AssociationSelect label="所属副本（可选）" items={state.projects} emptyLabel="暂不关联副本" onChange={setEditProjectId} value={editProjectId} /><DeadlineInput onChange={setEditDueDate} value={editDueDate} /></>}<div className="flex gap-2 sm:col-span-2"><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" onClick={() => saveEdit(quest)} type="button">保存修改</button><button className="rounded-md border border-[var(--line)] px-3 py-2 text-xs" onClick={() => setEditingId(null)} type="button">取消</button></div></div> : null}
        </div>;
      })}
    </section>
  </div>;
}

function recurrenceDescription(quest: PrototypeQuest): string | undefined {
  if (!quest.recurrence) return undefined;
  const label = quest.recurrence.cadence === "daily" ? "每天" : "每周";
  return `${label} · 本周期 ${quest.recurrence.completedCount} / ${quest.recurrence.targetCount}`;
}

function AssociationSelect({ label, items, emptyLabel, value, onChange }: { label: string; items: Array<{ id: string; name: string }>; emptyLabel: string; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>{label}</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{emptyLabel}</option>{items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>;
}

function DeadlineInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>DDL（可选）</span><input className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" onChange={(event) => onChange(event.target.value)} type="date" value={value} /></label>;
}

function Select({ label, options, value, onChange }: { label: string; options: readonly (readonly [string, string])[]; value: string; onChange: (value: string) => void }) {
  return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>{label}</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([optionValue, optionLabel]) => <option key={optionValue} value={optionValue}>{optionLabel}</option>)}</select></label>;
}
