const quests = [
  { title: "明确本周最重要的成果", type: "主线任务", difficulty: "普通", state: "进行中" },
  { title: "完成一次任务结算体验记录", type: "重点任务", difficulty: "普通", state: "待开始" },
  { title: "整理一个待推进的副本", type: "副本任务", difficulty: "困难", state: "待开始" },
];

export default function QuestsPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div>
          <p className="text-sm text-[var(--muted)]">任务</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">让下一步足够具体。</h1>
        </div>
        <button className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">+ 新建任务</button>
      </header>

      <section className="mt-7 overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 border-b border-[var(--line)] bg-[#fafafa] px-4 py-3 text-xs text-[var(--muted)] sm:grid-cols-[minmax(0,1fr)_110px_100px_92px]">
          <span>任务</span><span className="hidden sm:block">类型</span><span className="hidden sm:block">难度</span><span>状态</span>
        </div>
        {quests.map((quest) => (
          <article className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-[var(--line)] px-4 py-4 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_110px_100px_92px]" key={quest.title}>
            <div><p className="font-medium">{quest.title}</p><p className="mt-1 text-xs text-[var(--muted)]">{quest.type} · {quest.difficulty}</p></div>
            <span className="hidden text-sm text-[var(--muted)] sm:block">{quest.type}</span>
            <span className="hidden text-sm text-[var(--muted)] sm:block">{quest.difficulty}</span>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-center text-xs text-[var(--muted)]">{quest.state}</span>
          </article>
        ))}
      </section>
    </div>
  );
}
