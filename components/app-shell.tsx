"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/dashboard", label: "今日", icon: "◌" },
  { href: "/quests", label: "任务", icon: "✓" },
  { href: "/mainlines", label: "主线", icon: "↗" },
  { href: "/rewards", label: "奖励商城", icon: "✦" },
  { href: "/projects", label: "副本", icon: "◇" },
  { href: "/reviews", label: "周结算", icon: "◫" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[238px_minmax(0,1fr)]">
      <aside className="border-b border-[var(--line)] bg-white px-4 py-4 lg:min-h-screen lg:border-r lg:border-b-0">
        <div className="flex items-center gap-2 px-2 pb-6 pt-1">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--ink)] text-sm font-bold text-white">LQ</div>
          <div>
            <p className="text-sm font-semibold">Life Quest</p>
            <p className="text-xs text-[var(--muted)]">个人工作台</p>
          </div>
        </div>

        <nav aria-label="主导航" className="flex gap-1 overflow-x-auto lg:flex-col">
          {navigation.map((item) => {
            const active = pathname === item.href;
            const className = `flex min-w-fit items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${active
              ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)]"
              : item.disabled
                ? "cursor-not-allowed text-gray-400"
                : "text-[var(--muted)] hover:bg-gray-100 hover:text-[var(--ink)]"}`;

            if (item.disabled) {
              return <span aria-disabled="true" className={className} key={item.label}><span>{item.icon}</span>{item.label}</span>;
            }

            return <Link className={className} href={item.href} key={item.href}><span>{item.icon}</span>{item.label}</Link>;
          })}
        </nav>

        <div className="mt-8 hidden rounded-xl border border-[var(--line)] bg-[#fafafa] p-3 lg:block">
          <p className="text-xs font-medium">本周节奏</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">先完成一件真正重要的事，再查看其余待办。</p>
        </div>
      </aside>

      <main className="min-w-0">{children}</main>
    </div>
  );
}