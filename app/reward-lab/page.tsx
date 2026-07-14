"use client";

import { useMemo, useState } from "react";
import { calculateQuestReward } from "@/src/domain/rewards/calculate-quest-reward";
import {
  difficulties,
  importances,
  questTypes,
  resistances,
  type Difficulty,
  type Importance,
  type QuestType,
  type Resistance,
} from "@/src/domain/rewards/types";

const labels = {
  questType: {
    micro: "微型任务",
    standard: "普通任务",
    focus: "重点任务",
    milestone: "项目里程碑",
    boss: "Boss 任务",
  } satisfies Record<QuestType, string>,
  difficulty: {
    easy: "简单",
    standard: "普通",
    hard: "困难",
    epic: "极难",
  } satisfies Record<Difficulty, string>,
  importance: {
    maintenance: "日常维护",
    helpful: "有帮助",
    goal: "推动目标",
    critical: "关键结果",
  } satisfies Record<Importance, string>,
  resistance: {
    none: "无明显阻力",
    reluctant: "有些不想做",
    procrastinated: "明显拖延",
    avoided: "长期回避",
  } satisfies Record<Resistance, string>,
};

export default function RewardLabPage() {
  const [questType, setQuestType] = useState<QuestType>("standard");
  const [difficulty, setDifficulty] = useState<Difficulty>("standard");
  const [importance, setImportance] = useState<Importance>("helpful");
  const [resistance, setResistance] = useState<Resistance>("none");

  const reward = useMemo(
    () => calculateQuestReward({ questType, difficulty, importance, resistance }),
    [questType, difficulty, importance, resistance],
  );

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <header className="border-b border-[var(--line)] pb-6">
        <p className="text-sm text-[var(--muted)]">奖励试验台</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">先验证反馈，再把它做成习惯。</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
          这是产品测试工具：调整任务属性，系统会实时调用奖励引擎 v1，展示本次任务应获得的经验与金币。
        </p>
      </header>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-xl border border-[var(--line)] bg-white p-5">
          <h2 className="text-base font-semibold">任务设定</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <SelectField label="任务类型" value={questType} options={questTypes} optionLabels={labels.questType} onChange={(value) => setQuestType(value as QuestType)} />
            <SelectField label="难度" value={difficulty} options={difficulties} optionLabels={labels.difficulty} onChange={(value) => setDifficulty(value as Difficulty)} />
            <SelectField label="重要度" value={importance} options={importances} optionLabels={labels.importance} onChange={(value) => setImportance(value as Importance)} />
            <SelectField label="心理阻力" value={resistance} options={resistances} optionLabels={labels.resistance} onChange={(value) => setResistance(value as Resistance)} />
          </div>
        </section>

        <aside className="rounded-xl border border-[var(--line)] bg-white p-5">
          <p className="text-sm font-medium">本次结算预览</p>
          <div className="mt-5 border-b border-[var(--line)] pb-5">
            <p className="text-xs text-[var(--muted)]">经验值</p>
            <p className="mt-1 text-4xl font-semibold tracking-tight">{reward.xp} <span className="text-base font-normal text-[var(--muted)]">XP</span></p>
          </div>
          <div className="border-b border-[var(--line)] py-5">
            <p className="text-xs text-[var(--muted)]">金币</p>
            <p className="mt-1 text-2xl font-semibold">{reward.coins} <span className="text-sm font-normal text-[var(--muted)]">coins</span></p>
          </div>
          <div className="pt-5 text-sm">
            <p className="font-medium">计算理由</p>
            <dl className="mt-3 space-y-2 text-[var(--muted)]">
              <div className="flex justify-between gap-4"><dt>基础 XP</dt><dd>{reward.breakdown.baseXp}</dd></div>
              <div className="flex justify-between gap-4"><dt>难度系数</dt><dd>×{reward.breakdown.difficultyMultiplier}</dd></div>
              <div className="flex justify-between gap-4"><dt>重要度系数</dt><dd>×{reward.breakdown.importanceMultiplier}</dd></div>
              <div className="flex justify-between gap-4"><dt>心理阻力系数</dt><dd>×{reward.breakdown.resistanceMultiplier}</dd></div>
            </dl>
            <p className="mt-5 text-xs text-[var(--muted)]">规则版本：{reward.calculationVersion}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  optionLabels,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  optionLabels: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-2 text-sm">
      <span className="font-medium">{label}</span>
      <select
        className="rounded-lg border border-[var(--line)] bg-white px-3 py-2.5 text-[var(--ink)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => <option key={option} value={option}>{optionLabels[option]}</option>)}
      </select>
    </label>
  );
}
