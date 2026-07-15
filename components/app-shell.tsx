"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WeeklyRhythmCard } from "@/components/weekly-rhythm-card";

type NavigationIconName = "today" | "quests" | "mainlines" | "rewards" | "projects" | "reviews";

const navigation: Array<{ href: string; label: string; icon: NavigationIconName }> = [
  { href: "/dashboard", label: "今日", icon: "today" },
  { href: "/quests", label: "任务", icon: "quests" },
  { href: "/mainlines", label: "主线", icon: "mainlines" },
  { href: "/rewards", label: "奖励", icon: "rewards" },
  { href: "/projects", label: "副本", icon: "projects" },
  { href: "/reviews", label: "周结算", icon: "reviews" },
];

export function AppShell({ children, accountName, onSignOut }: { children: ReactNode; accountName?: string; onSignOut?: () => void }) {
  const pathname = usePathname();

  return <div className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="border-b border-[var(--line)] bg-white px-3 py-4 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-4">
      <div className="flex items-center gap-3 px-2 pb-7 pt-1">
        <BrandMark />
        <div><p className="text-[15px] font-semibold tracking-tight">Questline</p><p className="mt-0.5 text-xs text-[var(--muted)]">人生工作台</p></div>
      </div>

      <nav aria-label="主导航" className="flex gap-1 overflow-x-auto lg:flex-col">
        {navigation.map((item) => {
          const active = pathname === item.href;
          return <Link aria-current={active ? "page" : undefined} className={`group flex min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)] shadow-[inset_3px_0_0_var(--accent)]" : "text-[var(--muted)] hover:bg-[#f7f7f8] hover:text-[var(--ink)]"}`} href={item.href} key={item.href}><NavigationIcon name={item.icon} /><span>{item.label}</span></Link>;
        })}
      </nav>

      <WeeklyRhythmCard />

      {accountName ? <div className="mt-5 rounded-xl border border-[var(--line)] bg-[#fbfbfb] p-3"><p className="truncate text-xs text-[var(--muted)]" title={accountName}>当前用户：{accountName}</p>{onSignOut ? <button className="mt-2 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--ink)]" onClick={onSignOut} type="button">退出登录</button> : null}</div> : null}
    </aside>
    <main className="min-w-0">{children}</main>
  </div>;
}

function BrandMark() {
  return <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--ink)] shadow-sm"><svg aria-hidden="true" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><path d="M6 5.5h5.5a3 3 0 0 1 3 3V18H9a3 3 0 0 0-3 3V5.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="M14.5 18H18V9a3 3 0 0 0-3-3h-.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><path d="m10 11 1.3 1.3L14 9.6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg></div>;
}

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.7 };
  const paths: Record<NavigationIconName, ReactNode> = {
    today: <><circle cx="12" cy="12" r="6.5" {...common} /><path d="M12 8.5v3.8l2.5 1.5" {...common} /></>,
    quests: <><path d="m5 12 4 4 10-10" {...common} /><path d="M19 12v6H5V6h8" {...common} /></>,
    mainlines: <><path d="M5 18 18 5" {...common} /><path d="M9 5h9v9" {...common} /><circle cx="6" cy="17" r="1.5" {...common} /></>,
    rewards: <><path d="m12 4 1.9 4.1L18 10l-4.1 1.9L12 16l-1.9-4.1L6 10l4.1-1.9L12 4Z" {...common} /><path d="m18 15 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" {...common} /></>,
    projects: <><path d="m12 4 6.5 3.8v8.4L12 20 5.5 16.2V7.8L12 4Z" {...common} /><path d="m5.8 7.9 6.2 3.6 6.2-3.6M12 11.5V20" {...common} /></>,
    reviews: <><path d="M7 4.5h10v15H7z" {...common} /><path d="M10 8h4M10 12h4M10 16h2" {...common} /><path d="m5 8-1.5 1.5L5 11" {...common} /></>,
  };
  return <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0 transition group-hover:scale-105" viewBox="0 0 24 24">{paths[name]}</svg>;
}
