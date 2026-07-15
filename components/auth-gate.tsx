"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { usePathname } from "next/navigation";
import { buildMagicLinkRedirectUrl } from "@/src/lib/auth/redirect-url";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/src/lib/supabase/client";

type AuthGateProps = {
  children: ReactNode;
};

export function AuthGate({ children }: AuthGateProps) {
  const pathname = usePathname();
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => (configured ? createSupabaseBrowserClient() : null), [configured]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;
    let active = true;

    async function loadUser() {
      const { data } = await client.auth.getUser();

      if (active) {
        setUser(data.user);
        setLoading(false);
      }
    }

    void loadUser();

    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  if (pathname === "/auth/callback") {
    return <>{children}</>;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!supabase) {
    return <ConfigurationScreen />;
  }

  if (!user) {
    return <MagicLinkLogin supabase={supabase} />;
  }

  return <AppShell accountEmail={user.email} onSignOut={() => void supabase.auth.signOut()}>{children}</AppShell>;
}

function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5"><p className="text-sm text-[var(--muted)]">正在确认登录状态…</p></main>;
}

function ConfigurationScreen() {
  return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-7 shadow-sm"><p className="text-sm font-medium text-[var(--ink)]">尚未连接云端</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">请在 Vercel 的 Environment Variables 中添加 Supabase 项目网址与 Publishable Key，然后重新部署。</p></section></main>;
}

function MagicLinkLogin({ supabase }: { supabase: ReturnType<typeof createSupabaseBrowserClient> }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setError("请输入邮箱地址。");
      return;
    }

    setError(null);
    setStatus("sending");

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: buildMagicLinkRedirectUrl(window.location.origin),
      },
    });

    if (signInError) {
      setError(signInError.message);
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5 py-10"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-7 shadow-sm sm:p-9"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--ink)] text-sm font-semibold text-white">QL</div><div><h1 className="text-lg font-semibold tracking-tight">Questline</h1><p className="text-sm text-[var(--muted)]">你的个人工作台</p></div></div><div className="mt-9"><h2 className="text-2xl font-semibold tracking-tight">登录后继续前进。</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">输入邮箱，我们会发送一封一次性登录邮件。无需设置或记忆密码。</p></div>{status === "sent" ? <div className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">登录邮件已发送。请打开邮箱并点击其中的链接，随后会自动回到 Questline。</div> : <form className="mt-7 space-y-4" onSubmit={submit}><label className="block text-sm font-medium text-[var(--ink)]" htmlFor="email">邮箱地址</label><input autoComplete="email" className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" type="email" value={email} /><button className="w-full rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#363b42] disabled:cursor-not-allowed disabled:opacity-60" disabled={status === "sending"} type="submit">{status === "sending" ? "正在发送…" : "发送登录邮件"}</button>{error ? <p role="alert" className="text-sm leading-6 text-red-700">{error}</p> : null}</form>}<p className="mt-7 text-xs leading-5 text-[var(--muted)]">首次使用此邮箱会自动建立一个私密的个人空间；其他账号无法查看你的数据。</p></section></main>;
}
