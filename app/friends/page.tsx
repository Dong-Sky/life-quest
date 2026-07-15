"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/src/lib/supabase/client";

type FriendRecord = {
  friendship_id: string;
  friend_id: string;
  display_name: string;
  status: "pending" | "accepted" | "declined";
  direction: "sent" | "received";
};

export default function FriendsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [inviteCode, setInviteCode] = useState("");
  const [incoming, setIncoming] = useState("");
  const [friends, setFriends] = useState<FriendRecord[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setStatus("loading");
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) {
      setMessage("请先登录后再管理搭档。");
      setStatus("error");
      return;
    }

    const [{ data: profile, error: profileError }, { data: friendshipData, error: friendshipError }] = await Promise.all([
      supabase.from("profiles").select("invite_code").eq("id", user.id).single(),
      supabase.rpc("list_my_friendships"),
    ]);

    if (profileError || friendshipError || !profile?.invite_code) {
      setMessage(profileError?.message ?? friendshipError?.message ?? "无法读取好友信息。请确认已执行本轮 Supabase SQL。");
      setStatus("error");
      return;
    }

    setInviteCode(profile.invite_code);
    setFriends((friendshipData ?? []) as FriendRecord[]);
    setStatus("ready");
  }, [supabase]);

  useEffect(() => {
    setIncoming(new URL(window.location.href).searchParams.get("invite") ?? "");
    void load();
  }, [load]);

  const shareUrl = inviteCode ? `${typeof window === "undefined" ? "" : window.location.origin}/friends?invite=${inviteCode}` : "";

  const copyInvite = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setMessage("邀请链接已复制，发给对方即可。");
  };

  const sendRequest = async () => {
    if (!incoming) return;
    const { data, error } = await supabase.rpc("send_friend_request", { code: incoming });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage(data === "accepted" ? "已成为搭档。" : data === "pending" ? "已接受邀请，等待对方确认。" : "你们已经建立过伙伴关系。");
    await load();
  };

  const accept = async (friendshipId: string) => {
    const { error } = await supabase.rpc("accept_friend_request", { friendship_id: friendshipId });
    if (error) {
      setMessage(error.message);
      return;
    }
    setMessage("已成为好友。下一步即可邀请对方进入共同副本。");
    await load();
  };

  const pendingReceived = friends.filter((friend) => friend.status === "pending" && friend.direction === "received");
  const acceptedFriends = friends.filter((friend) => friend.status === "accepted");

  return <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
    <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-6">
      <div><p className="text-sm text-[var(--muted)]">伙伴</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">先成为搭档，再一起推进副本。</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">不会展示任何陌生用户。只有收到并确认私密邀请链接的人，才能成为你的好友。</p></div>
      <Link className="rounded-lg border border-[var(--line)] bg-white px-3 py-2 text-sm hover:bg-gray-50" href="/projects">返回副本</Link>
    </header>

    {status === "loading" ? <p className="mt-8 text-sm text-[var(--muted)]">正在加载伙伴关系…</p> : null}
    {status === "error" ? <section className="mt-6 rounded-xl border border-red-200 bg-red-50 p-5"><p className="text-sm text-red-700">{message}</p></section> : null}

    {status === "ready" ? <div className="mt-6 space-y-6">
      {incoming && incoming !== inviteCode ? <section className="rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] p-5"><p className="text-sm font-medium">你收到了一个搭档邀请</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">接受后，对方会看到待确认提醒；双方确认后即可一起参与副本。</p><button className="mt-4 rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" onClick={() => void sendRequest()} type="button">接受邀请</button></section> : null}

      {pendingReceived.length ? <section className="rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold">待确认的搭档邀请</p><p className="mt-1 text-sm text-[var(--muted)]">对方已接受你的邀请，确认后即可一起参与副本。</p></div><span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-900">{pendingReceived.length} 条待确认</span></div><div className="mt-4 space-y-3">{pendingReceived.map((friend) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white/80 p-3" key={friend.friendship_id}><p className="font-medium">{friend.display_name}</p><button className="rounded-md bg-[var(--ink)] px-3 py-2 text-xs font-medium text-white" onClick={() => void accept(friend.friendship_id)} type="button">确认成为搭档</button></article>)}</div></section> : null}

      <section className="rounded-xl border border-[var(--line)] bg-white p-5"><p className="text-sm font-semibold">邀请一位搭档</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">复制链接发给对方即可。</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><input className="min-w-0 flex-1 rounded-lg border border-[var(--line)] bg-[#fafafa] px-3 py-2.5 text-xs text-[var(--muted)]" readOnly value={shareUrl} /><button className="shrink-0 rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-medium text-white" onClick={() => void copyInvite()} type="button">复制邀请链接</button></div></section>

      <section><div className="flex items-center justify-between"><h2 className="text-base font-semibold">我的搭档</h2><span className="text-xs text-[var(--muted)]">{acceptedFriends.length} 位好友</span></div><div className="mt-3 space-y-3">{friends.length ? friends.filter((friend) => !(friend.status === "pending" && friend.direction === "received")).map((friend) => <article className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white p-4" key={friend.friendship_id}><div><p className="font-medium">{friend.display_name}</p><p className="mt-1 text-xs text-[var(--muted)]">{friend.status === "accepted" ? "已成为搭档" : friend.status === "declined" ? "未接受此次邀请" : "已发送邀请，等待对方确认"}</p></div></article>) : <div className="rounded-xl border border-dashed border-[var(--line)] bg-white p-7 text-center"><p className="font-medium">还没有搭档。</p><p className="mt-2 text-sm text-[var(--muted)]">先复制上方邀请链接，发给想一起推进生活副本的人。</p></div>}</div></section>
      {message ? <p className="text-sm text-[var(--success)]">{message}</p> : null}
    </div> : null}
  </div>;
}
