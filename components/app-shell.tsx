"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WeeklyRhythmCard } from "@/components/weekly-rhythm-card";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/src/lib/supabase/client";
import { FRIENDSHIP_STATE_EVENT } from "@/src/lib/friends/events";

type NavigationIconName = "today" | "quests" | "mainlines" | "rewards" | "projects" | "sharedProjects" | "reviews" | "friends";

const navigation: Array<{ href: string; label: string; icon: NavigationIconName }> = [
  { href: "/dashboard", label: "今日", icon: "today" },
  { href: "/quests", label: "任务", icon: "quests" },
  { href: "/mainlines", label: "主线", icon: "mainlines" },
  { href: "/rewards", label: "奖励", icon: "rewards" },
  { href: "/projects", label: "副本", icon: "projects" },
  { href: "/shared-projects", label: "共同副本", icon: "sharedProjects" },
  { href: "/reviews", label: "结算", icon: "reviews" },
  { href: "/friends", label: "伙伴", icon: "friends" },
];

export function AppShell({ children, accountName, onSignOut, onResetWorkspace }: { children: ReactNode; accountName?: string; onSignOut?: () => void; onResetWorkspace?: () => void }) {
  const pathname = usePathname();
  const [pendingFriendCount, setPendingFriendCount] = useState(0);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const supabase = createSupabaseBrowserClient();
    let active = true;

    async function loadPendingFriendCount() {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { count } = await supabase
        .from("friendships")
        .select("id", { count: "exact", head: true })
        .eq("addressee_id", userData.user.id)
        .eq("status", "pending");

      if (active) setPendingFriendCount(count ?? 0);
    }

    function handleFriendshipStateChanged() {
      void loadPendingFriendCount();
    }

    window.addEventListener(FRIENDSHIP_STATE_EVENT, handleFriendshipStateChanged);
    void loadPendingFriendCount();
    return () => {
      active = false;
      window.removeEventListener(FRIENDSHIP_STATE_EVENT, handleFriendshipStateChanged);
    };
  }, []);

  return <div className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
    <aside className="border-b border-[var(--line)] bg-white px-4 py-3 lg:min-h-screen lg:border-b-0 lg:border-r lg:px-4 lg:py-4">
      <div className="flex items-center gap-3 px-1 lg:px-2 lg:pb-7 lg:pt-1">
        <BrandMark />
        <div><p className="text-[15px] font-semibold tracking-tight">Questline</p><p className="mt-0.5 text-xs text-[var(--muted)]">人生工作台</p></div>
        {accountName ? <p className="ml-auto max-w-[9rem] truncate text-xs text-[var(--muted)] lg:hidden" title={accountName}>{accountName}</p> : null}
        {onSignOut ? <button className="shrink-0 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--ink)] lg:hidden" onClick={onSignOut} type="button">退出</button> : null}
      </div>

      <nav aria-label="主导航" className="hidden lg:flex lg:flex-col lg:gap-1">
        {navigation.map((item) => <NavigationLink item={item} active={pathname === item.href} key={item.href} pendingCount={item.icon === "friends" ? pendingFriendCount : 0} />)}
      </nav>

      <div className="hidden lg:block"><WeeklyRhythmCard /></div>

      {accountName ? <div className="mt-5 hidden rounded-xl border border-[var(--line)] bg-[#fbfbfb] p-3 lg:block"><p className="truncate text-xs text-[var(--muted)]" title={accountName}>当前用户：{accountName}</p><div className="mt-2 flex items-center gap-3">{onSignOut ? <button className="text-xs font-medium text-[var(--muted)] transition hover:text-[var(--ink)]" onClick={onSignOut} type="button">退出登录</button> : null}{onResetWorkspace ? <button className="text-xs font-medium text-[var(--muted)] underline-offset-2 transition hover:text-red-600 hover:underline" onClick={onResetWorkspace} type="button">重新开始工作台</button> : null}</div></div> : null}
    </aside>
    <main className="min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
    <nav aria-label="手机主导航" className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white/95 px-1 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-8px_24px_rgba(31,35,40,0.05)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-8">{navigation.map((item) => {
        const active = pathname === item.href;
        const pendingCount = item.icon === "friends" ? pendingFriendCount : 0;
        return <Link aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium transition ${active ? "text-[var(--accent)]" : "text-[var(--muted)]"}`} href={item.href} key={item.href}>
          <span className="relative"><NavigationIcon name={item.icon} />{pendingCount ? <PendingBadge count={pendingCount} /> : null}</span>
          <span>{item.label}</span>
        </Link>;
      })}</div>
    </nav>
  </div>;
}

function NavigationLink({ item, active, pendingCount }: { item: (typeof navigation)[number]; active: boolean; pendingCount: number }) {
  return <Link aria-current={active ? "page" : undefined} className={`group flex min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-[var(--accent-soft)] font-medium text-[var(--accent)] shadow-[inset_3px_0_0_var(--accent)]" : "text-[var(--muted)] hover:bg-[#f7f7f8] hover:text-[var(--ink)]"}`} href={item.href}>
    <span className="relative"><NavigationIcon name={item.icon} />{pendingCount ? <PendingBadge count={pendingCount} /> : null}</span>
    <span>{item.label}</span>
  </Link>;
}

function PendingBadge({ count }: { count: number }) {
  return <span aria-label={`${count} 个待确认好友请求`} className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[9px] font-semibold leading-none text-white">{count > 9 ? "9+" : count}</span>;
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
    rewards: <><path d="m12 4 1.9 4.1L18 10l-4.1 1.9L12 16l-1.9-4.1L6 10l4.1-.9L12 4Z" {...common} /><path d="m18 15 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" {...common} /></>,
    projects: <><path d="m12 4 6.5 3.8v8.4L12 20 5.5 16.2V7.8L12 4Z" {...common} /><path d="m5.8 7.9 6.2 3.6 6.2-3.6M12 11.5V20" {...common} /></>,
    sharedProjects: <><path d="m12 4 6.5 3.8v8.4L12 20 5.5 16.2V7.8L12 4Z" {...common} /><path d="m5.8 7.9 6.2 3.6 6.2-3.6M12 11.5V20" {...common} /><path d="m8.5 7.5 3.5 2 3.5-2" {...common} /></>,
    reviews: <><path d="M7 4.5h10v15H7z" {...common} /><path d="M10 8h4M10 12h4M10 16h2" {...common} /><path d="m5 8-1.5 1.5L5 11" {...common} /></>,
    friends: <><circle cx="9" cy="9" r="3" {...common} /><circle cx="17" cy="10" r="2.3" {...common} /><path d="M3.8 20c.7-3.3 3-5 5.2-5s4.5 1.7 5.2 5" {...common} /><path d="M14.5 15.7c2.7.2 4.7 1.6 5.2 4.3" {...common} /></>,
  };
  return <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0 transition group-hover:scale-105" viewBox="0 0 24 24">{paths[name]}</svg>;
}
