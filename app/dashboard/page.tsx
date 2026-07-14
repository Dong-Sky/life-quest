const todayTasks = [
  { title: "明确本周最重要的成果", tag: "主线", estimate: "25 分钟", priority: "高" },
  { title: "完成一次任务结算体验记录", tag: "产品", estimate: "15 分钟", priority: "中" },
  { title: "整理一个待推进的副本", tag: "副本", estimate: "20 分钟", priority: "中" },
];

const activeQuests = [
  { name: "Life Quest MVP", detail: "定义首个可体验闭环", progress: 18 },
  { name: "个人健康节奏", detail: "建立每周运动计划", progress: 42 },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6">
        <div>
          <p className="text-sm text-[var(--muted)]">7 月 14 日 · 星期二</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">今天，推进一件重要的事。</h1>
        </div>
        <button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white hover:bg-black">+ 新建任务</button>
      </header>

      <section aria-label="角色状态" className="mt-7 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">当前等级</p>
          <p className="mt-2 text-2xl font-semibold">Lv. 1 <span className="text-sm font-normal text-[var(--muted)]">探索者</span></p>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <div className="flex items-center justify-between text-xs text-[var(--muted)]"><span>本周经验</span><span>42 / 100 XP</span></div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100"><div className="h-full w-[42%] rounded-full bg-[var(--accent)]" /></div>
        </div>
        <div className="rounded-xl border border-[var(--line)] bg-white p-4">
          <p className="text-xs text-[var(--muted)]">金币余额</p>
          <p className="mt-2 text-2xl font-semibold">8 <span className="text-sm font-normal text-[var(--muted)]">coins</span></p>
        </div>
      </section>

      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.9fr)]">
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">今日三件事</h2>
            <span className="text-xs text-[var(--muted)]">演示数据</span>
          </div>
          <div className="mt-3 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)] bg-white">
            {todayTasks.map((task, index) => (
              <article className="flex items-center gap-3 p-4" key={task.title}>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-[var(--line)] text-xs text-[var(--muted)]">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{task.tag} · {task.estimate}</p>
                </div>
                <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-[var(--muted)]">{task.priority}</span>
              </article>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-base font-semibold">正在推进的副本</h2>
          <div className="mt-3 space-y-3">
            {activeQuests.map((quest) => (
              <article className="rounded-xl border border-[var(--line)] bg-white p-4" key={quest.name}>
                <p className="font-medium">{quest.name}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">{quest.detail}</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-[var(--success)]" style={{ width: `${quest.progress}%` }} /></div>
                  <span className="text-xs text-[var(--muted)]">{quest.progress}%</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
