"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/src/lib/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("正在完成登录…");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setMessage("云端连接尚未配置完成。");
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const code = new URLSearchParams(window.location.search).get("code");

    async function completeLogin() {
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage(`登录链接无法使用：${error.message}`);
          return;
        }
      }

      const { data } = await supabase.auth.getUser();

      if (data.user) {
        router.replace("/dashboard");
        return;
      }

      setMessage("登录链接已失效或已被使用。请返回后重新发送一封登录邮件。");
    }

    void completeLogin();
  }, [router]);

  return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-7 text-center shadow-sm"><p className="text-sm leading-6 text-[var(--muted)]">{message}</p></section></main>;
}
