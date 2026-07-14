"use client";

import { useState } from "react";
import type { Difficulty, Importance, QuestType, Resistance } from "@/src/domain/rewards/types";
import { createPrototypeQuest, initialPrototypeState, readPrototypeState, settlePrototypeQuest, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

const fieldOptions = {
  questType: [["micro","微型任务"],["standard","普通任务"],["focus","重点任务"],["milestone","项目里程碑"],["boss","Boss 任务"]],
  difficulty: [["easy","简单"],["standard","普通"],["hard","困难"],["epic","极难"]],
  importance: [["maintenance","日常维护"],["helpful","有帮助"],["goal","推动目标"],["critical","关键结果"]],
  resistance: [["none","无明显阻力"],["reluctant","有些不想做"],["procrastinated","明显拖延"],["avoided","长期回避"]],
} as const;

export default function QuestsPage() {
  const [state, setState] = useState<PrototypeState>(initialPrototypeState);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [questType, setQuestType] = useState<QuestType>("standard");
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [importance, setImportance] = useState<Importance>("helpful");
  const [resistance, setResistance] = useState<Resistance>("none");
  useEffect(() => { setState(readPrototypeState()); setReady(true); }, []);
  const save = (next: PrototypeState) => { writePrototypeState(next); setState(next); };
  const create = () => { const next = createPrototypeQuest(state, { title, questType, difficulty, importance, resistance }); if (next !== state) { save(next); setTitle(""); } };
  const reset = () => save(initialPrototypeState());
  return <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6"><div><p className="text-sm text-[var(--muted)]">任务</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">让下一步足够具体。</h1></div><button className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm hover:bg-gray-50" onClick={reset}>重置体验数据</button></header>
    <form className="mt-5 rounded-xl border border-[var(--line)] bg-[#fafafa] p-4" onSubmit={(event) => { event.preventDefault(); create(); }}><label className="grid gap-2 text-sm"><span className="font-medium">下一步行动</span><input className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 outline-none focus:border-[var(--accent)]" onChange={(event) => setTitle(event.target.value)} placeholder="例如：完成本周三项关键任务" value={title} /></label><div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Select label="任务类型" options={fieldOptions.questType} value={questType} onChange={(value) => setQuestType(value as QuestType)} /><Select label="难度" options={fieldOptions.difficulty} value={difficulty} onChange={(value) => setDifficulty(value as Difficulty)} /><Select label="重要度" options={fieldOptions.importance} value={importance} onChange={(value) => setImportance(value as Importance)} /><Select label="心理阻力" options={fieldOptions.resistance} value={resistance} onChange={(value) => setResistance(value as Resistance)} /></div><div className="mt-4 flex justify-end"><button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" type="submit">创建任务</button></div></form>
    <section className="mt-7 overflow-hidden rounded-xl border border-[var(--line)] bg-white">{state.quests.map((quest) => <article className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-4 last:border-b-0" key={quest.id}><div><p className={quest.status === "completed" ? "font-medium text-[var(--muted)] line-through" : "font-medium"}>{quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{quest.questType} · {quest.difficulty} · {quest.importance}</p></div>{quest.status === "completed" ? <span className="text-xs text-[var(--success)]">+{quest.reward?.xp} XP</span> : <button className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent)]" onClick={() => save(settlePrototypeQuest(state, quest.id))}>完成并结算</button>}</article>)}</section>
  </div>;
}
function Select({ label, options, value, onChange }: { label: string; options: readonly (readonly [string,string])[]; value: string; onChange: (value: string) => void }) { return <label className="grid gap-1.5 text-xs text-[var(--muted)]"><span>{label}</span><select className="rounded-lg border border-[var(--line)] bg-white px-2.5 py-2 text-sm text-[var(--ink)]" value={value} onChange={(event) => onChange(event.target.value)}>{options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>; }
