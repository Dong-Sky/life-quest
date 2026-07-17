"use client";

import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { CloudStateBridge } from "@/components/cloud-state-bridge";
import { isValidUsername, normalizeUsername, usernameToAuthEmail } from "@/src/lib/auth/username";
import { initialPrototypeState, writePrototypeState } from "@/src/prototype/state";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/src/lib/supabase/client";
import { QuestlineMark } from "@/components/questline-brand";

type AuthGateProps = {
  children: ReactNode;
};

type AuthMode = "login" | "register";

export function AuthGate({ children }: AuthGateProps) {
  const configured = isSupabaseConfigured();
  const supabase = useMemo(() => (configured ? createSupabaseBrowserClient() : null), [configured]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(() => Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;

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

  if (loading) {
    return <LoadingScreen />;
  }

  if (!supabase) {
    return <ConfigurationScreen />;
  }

  if (!user) {
    return <PasswordLogin supabase={supabase} />;
  }

  const authenticatedSupabase = supabase;
  const authenticatedUser = user;
  const displayName = typeof user.user_metadata.display_name === "string" && user.user_metadata.display_name.trim()
    ? user.user_metadata.display_name
    : "已登录用户";

  async function resetWorkspace() {
    if (!window.confirm("这会永久清空当前账号的任务、奖励、结算和计划，且不会影响其他账号。确定要重新开始吗？")) return;

    const initialState = initialPrototypeState();
    const { error } = await authenticatedSupabase
      .from("workspace_states")
      .upsert({ user_id: authenticatedUser.id, state: initialState }, { onConflict: "user_id" });

    if (error) {
      window.alert(`无法清空当前工作台：${error.message}`);
      return;
    }

    writePrototypeState(initialState);
    window.location.reload();
  }

  return <CloudStateBridge key={authenticatedUser.id} supabase={authenticatedSupabase} user={authenticatedUser}><AppShell accountName={displayName} onResetWorkspace={() => void resetWorkspace()} onSignOut={() => void supabase.auth.signOut()}>{children}</AppShell></CloudStateBridge>;
}

function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5"><p className="text-sm text-[var(--muted)]">正在确认登录状态…</p></main>;
}

function ConfigurationScreen() {
  return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-7 shadow-sm"><p className="text-sm font-medium text-[var(--ink)]">尚未连接云端</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">请在 Vercel 的 Environment Variables 中添加 Supabase 项目网址与 Publishable Key，然后重新部署。</p></section></main>;
}

function PasswordLogin({ supabase }: { supabase: ReturnType<typeof createSupabaseBrowserClient> }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "needs-confirmation">("idle");
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedUsername = normalizeUsername(username);

    if (!isValidUsername(normalizedUsername)) {
      setError("用户名需为 2—24 个字符，且不能包含空格。");
      return;
    }

    if (password.length < 8) {
      setError("密码至少需要 8 位。");
      return;
    }

    if (mode === "register" && password !== confirmation) {
      setError("两次输入的密码不一致。");
      return;
    }

    setError(null);
    setStatus("submitting");

    if (mode === "register") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: usernameToAuthEmail(normalizedUsername),
        password,
        options: {
          data: {
            display_name: username.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setStatus("idle");
        return;
      }

      if (!data.session) {
        setStatus("needs-confirmation");
        return;
      }

      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: usernameToAuthEmail(normalizedUsername),
      password,
    });

    if (signInError) {
      setError("用户名或密码不正确。");
      setStatus("idle");
    }
  }

  const registering = mode === "register";

  return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5 py-10"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-7 shadow-none sm:p-9"><div className="flex items-center gap-3"><QuestlineMark className="h-12 w-12" /><div><h1 className="text-xl font-bold tracking-tight">Questline</h1><p className="mt-0.5 text-sm text-[var(--muted)]">人生工作台</p></div></div><div className="mt-9"><h2 className="text-2xl font-semibold tracking-tight">{registering ? "创建你的工作台。" : "登录后继续前进。"}</h2><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{registering ? "创建用户名和密码；以后可在任意设备继续使用。" : "使用你的用户名和密码登录。不会发送验证邮件。"}</p></div>{status === "needs-confirmation" ? <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">账号已创建，但 Supabase 仍开启了邮箱确认。请关闭“Confirm email”后再重新注册一次；具体位置见本次 PR 的设置说明。</div> : <form className="mt-7 space-y-4" onSubmit={submit}><label className="block text-sm font-medium text-[var(--ink)]" htmlFor="username">用户名</label><input autoCapitalize="none" autoComplete="username" className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100" id="username" onChange={(event) => setUsername(event.target.value)} placeholder="例如：dong" value={username} /><p className="text-xs leading-5 text-[var(--muted)]">2—24 个字符，不含空格。用户名只用于登录，不会公开显示。</p><label className="block text-sm font-medium text-[var(--ink)]" htmlFor="password">密码</label><input autoComplete={registering ? "new-password" : "current-password"} className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100" id="password" onChange={(event) => setPassword(event.target.value)} placeholder="至少 8 位" type="password" value={password} />{registering ? <><label className="block text-sm font-medium text-[var(--ink)]" htmlFor="confirmation">确认密码</label><input autoComplete="new-password" className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-blue-100" id="confirmation" onChange={(event) => setConfirmation(event.target.value)} type="password" value={confirmation} /></> : null}<button className="w-full rounded-xl bg-[var(--ink)] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#363b42] disabled:cursor-not-allowed disabled:opacity-60" disabled={status === "submitting"} type="submit">{status === "submitting" ? "正在处理…" : registering ? "创建账号" : "登录"}</button>{error ? <p role="alert" className="text-sm leading-6 text-red-700">{error}</p> : null}</form>}<button className="mt-6 text-sm text-[var(--accent)] hover:underline" onClick={() => { setMode(registering ? "login" : "register"); setError(null); setStatus("idle"); }} type="button">{registering ? "已有账号？去登录" : "没有账号？创建一个"}</button><p className="mt-6 text-xs leading-5 text-[var(--muted)]">请妥善保存密码。第一版暂不提供自助找回密码功能。</p></section></main>;
}
