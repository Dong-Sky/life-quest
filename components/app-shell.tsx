"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { WeeklyRhythmCard } from "@/components/weekly-rhythm-card";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/src/lib/supabase/client";
import { FRIENDSHIP_STATE_EVENT } from "@/src/lib/friends/events";
import { QuestlineMark } from "@/components/questline-brand";

type NavigationIconName = "today" | "quests" | "mainlines" | "rewards" | "projects" | "reviews" | "friends";

const navigation: Array<{ href: string; label: string; icon: NavigationIconName }> = [
  { href: "/dashboard", label: "今日", icon: "today" },
  { href: "/quests", label: "任务", icon: "quests" },
  { href: "/mainlines", label: "主线", icon: "mainlines" },
  { href: "/rewards", label: "奖励", icon: "rewards" },
  { href: "/projects", label: "副本", icon: "projects" },
  { href: "/reviews", label: "结算", icon: "reviews" },
  { href: "/friends", label: "伙伴", icon: "friends" },
];

const mobilePrimaryNavigation = navigation.filter((item) => ["/dashboard", "/quests", "/mainlines", "/projects"].includes(item.href));
const mobileMoreNavigation = navigation.filter((item) => !mobilePrimaryNavigation.includes(item));

export function AppShell({ children, accountName, onSignOut, onResetWorkspace }: { children: ReactNode; accountName?: string; onSignOut?: () => void; onResetWorkspace?: () => void }) {
  const pathname = usePathname();
  const [pendingFriendCount, setPendingFriendCount] = useState(0);
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);

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

  return <div className="min-h-screen bg-[var(--canvas)] lg:grid lg:grid-cols-[232px_minmax(0,1fr)]">
    <aside className="border-b border-[var(--line)] bg-white/90 px-4 py-3 backdrop-blur lg:min-h-screen lg:border-b-0 lg:border-r lg:px-4 lg:py-5">
      <div className="flex items-center gap-3 px-1 lg:px-2 lg:pb-8 lg:pt-1">
        <QuestlineMark className="h-10 w-10" />
        <div><p className="text-[15px] font-semibold tracking-tight">Questline</p><p className="mt-0.5 text-xs text-[var(--muted)]">人生工作台</p></div>
        {accountName ? <p className="ml-auto max-w-[9rem] truncate text-xs text-[var(--muted)] lg:hidden" title={accountName}>{accountName}</p> : null}
        {onSignOut ? <button className="shrink-0 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--ink)] lg:hidden" onClick={onSignOut} type="button">退出</button> : null}
      </div>

      <nav aria-label="主导航" className="hidden lg:flex lg:flex-col lg:gap-1">
        {navigation.map((item) => <NavigationLink item={item} active={pathname === item.href} key={item.href} pendingCount={item.icon === "friends" ? pendingFriendCount : 0} />)}
      </nav>

      <div className="hidden lg:block"><WeeklyRhythmCard /></div>

      {accountName ? <div className="mt-5 hidden rounded-2xl border border-[var(--line)] bg-[#f8fbff] p-3.5 lg:block"><p className="truncate text-xs text-[var(--muted)]" title={accountName}>当前用户：{accountName}</p><div className="mt-2 flex items-center gap-3">{onSignOut ? <button className="text-xs font-medium text-[var(--muted)] transition hover:text-[var(--ink)]" onClick={onSignOut} type="button">退出登录</button> : null}{onResetWorkspace ? <button className="text-xs font-medium text-[var(--muted)] underline-offset-2 transition hover:text-red-600 hover:underline" onClick={onResetWorkspace} type="button">重新开始工作台</button> : null}</div></div> : null}
    </aside>
    <main className="min-w-0 pb-[calc(5.25rem+env(safe-area-inset-bottom))] lg:pb-0">{children}</main>
    {mobileMoreOpen ? <div className="fixed inset-x-0 bottom-[calc(4.55rem+env(safe-area-inset-bottom))] z-30 px-3 lg:hidden"><div className="mx-auto grid max-w-md grid-cols-3 gap-2 rounded-2xl border border-[var(--line)] bg-white p-2.5 shadow-[0_14px_36px_rgba(15,23,42,0.16)]">{mobileMoreNavigation.map((item) => { const active = pathname === item.href; const pendingCount = item.icon === "friends" ? pendingFriendCount : 0; return <Link aria-current={active ? "page" : undefined} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition ${active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)] hover:bg-slate-50"}`} href={item.href} key={item.href} onClick={() => setMobileMoreOpen(false)}><span className="relative"><NavigationIcon name={item.icon} />{pendingCount ? <PendingBadge count={pendingCount} /> : null}</span><span>{item.label}</span></Link>; })}</div></div> : null}
    <nav aria-label="手机主导航" className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--line)] bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] pt-1 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="grid grid-cols-5 gap-1">{mobilePrimaryNavigation.map((item) => {
        const active = pathname === item.href;
        return <Link aria-current={active ? "page" : undefined} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition ${active ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`} href={item.href} key={item.href}>
          <NavigationIcon name={item.icon} />
          <span>{item.label}</span>
        </Link>;
      })}
      <button aria-expanded={mobileMoreOpen} aria-label="打开更多导航" className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-medium transition ${mobileMoreNavigation.some((item) => item.href === pathname) || mobileMoreOpen ? "bg-[var(--accent-soft)] text-[var(--accent)]" : "text-[var(--muted)]"}`} onClick={() => setMobileMoreOpen((open) => !open)} type="button"><span aria-hidden="true" className="text-base leading-none">•••</span><span>更多</span></button>
      </div>
    </nav>
  </div>;
}

function NavigationLink({ item, active, pendingCount }: { item: (typeof navigation)[number]; active: boolean; pendingCount: number }) {
  return <Link aria-current={active ? "page" : undefined} className={`group flex min-w-fit items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active ? "bg-[var(--accent-soft)] font-semibold text-[var(--accent)] shadow-[inset_3px_0_0_var(--accent)]" : "text-[var(--muted)] hover:bg-[#f7f9fc] hover:text-[var(--ink)]"}`} href={item.href}>
    <span className="relative"><NavigationIcon name={item.icon} />{pendingCount ? <PendingBadge count={pendingCount} /> : null}</span>
    <span>{item.label}</span>
  </Link>;
}

function PendingBadge({ count }: { count: number }) {
  return <span aria-label={`${count} 个待确认好友请求`} className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-rose-500 px-0.5 text-[9px] font-semibold leading-none text-white">{count > 9 ? "9+" : count}</span>;
}

function NavigationIcon({ name }: { name: NavigationIconName }) {
  const common = { fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, strokeWidth: 1.7 };
  const paths: Record<NavigationIconName, ReactNode> = {
    today: <><circle cx="12" cy="12" r="6.5" {...common} /><path d="M12 8.5v3.8l2.5 1.5" {...common} /></>,
    quests: <><path d="m5 12 4 4 10-10" {...common} /><path d="M19 12v6H5V6h8" {...common} /></>,
    mainlines: <><path d="M5 18 18 5" {...common} /><path d="M9 5h9v9" {...common} /><circle cx="6" cy="17" r="1.5" {...common} /></>,
    rewards: <><path d="m12 4 1.9 4.1L18 10l-4.1 1.9L12 16l-1.9-4.1L6 10l4.1-.9L12 4Z" {...common} /><path d="m18 15 .9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9L18 15Z" {...common} /></>,
    projects: <><path d="m12 4 6.5 3.8v8.4L12 20 5.5 16.2V7.8L12 4Z" {...common} /><path d="m5.8 7.9 6.2 3.6 6.2-3.6M12 11.5V20" {...common} /></>,
    reviews: <><path d="M7 4.5h10v15H7z" {...common} /><path d="M10 8h4M10 12h4M10 16h2" {...common} /><path d="m5 8-1.5 1.5L5 11" {...common} /></>,
    friends: <><circle cx="9" cy="9" r="3" {...common} /><circle cx="17" cy="10" r="2.3" {...common} /><path d="M3.8 20c.7-3.3 3-5 5.2-5s4.5 1.7 5.2 5" {...common} /><path d="M14.5 15.7c2.7.2 4.7 1.6 5.2 4.3" {...common} /></>,
  };
  return <svg aria-hidden="true" className="h-[18px] w-[18px] shrink-0 transition group-hover:scale-105" viewBox="0 0 24 24">{paths[name]}</svg>;
}