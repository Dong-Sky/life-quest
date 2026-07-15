"use client";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { useEffect, useState, type ReactNode } from "react";
import { hydratePrototypeState, PROTOTYPE_STATE_EVENT, readPrototypeState, type PrototypeState, writePrototypeState } from "@/src/prototype/state";

type CloudStateBridgeProps = {
  children: ReactNode;
  supabase: SupabaseClient;
  user: User;
};

export function CloudStateBridge({ children, supabase, user }: CloudStateBridgeProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    let initializing = true;
    let timer: number | undefined;

    async function persist(state: PrototypeState) {
      const { error } = await supabase
        .from("workspace_states")
        .upsert({ user_id: user.id, state }, { onConflict: "user_id" });

      if (error) {
        throw error;
      }
    }

    function schedulePersist() {
      if (initializing) return;
      if (timer) window.clearTimeout(timer);

      timer = window.setTimeout(() => {
        void persist(readPrototypeState()).catch((error: unknown) => {
          console.error("Questline cloud sync failed", error);
        });
      }, 350);
    }

    async function initialize() {
      try {
        const { data, error } = await supabase
          .from("workspace_states")
          .select("state")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data?.state && typeof data.state === "object") {
          writePrototypeState(hydratePrototypeState(data.state as Partial<PrototypeState>));
        } else {
          await persist(readPrototypeState());
        }

        if (active) setStatus("ready");
      } catch (error) {
        if (active) {
          setErrorMessage(error instanceof Error ? error.message : "无法连接云端工作台。");
          setStatus("error");
        }
      } finally {
        initializing = false;
      }
    }

    window.addEventListener(PROTOTYPE_STATE_EVENT, schedulePersist);
    void initialize();

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener(PROTOTYPE_STATE_EVENT, schedulePersist);
    };
  }, [supabase, user.id]);

  if (status === "loading") {
    return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5"><p className="text-sm text-[var(--muted)]">正在打开云端工作台…</p></main>;
  }

  if (status === "error") {
    return <main className="grid min-h-screen place-items-center bg-[var(--canvas)] px-5"><section className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-7 shadow-sm"><p className="text-sm font-medium text-[var(--ink)]">云端工作台尚未准备好</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">请执行本次更新附带的 Supabase SQL 文件，再刷新页面。</p><p className="mt-3 break-words rounded-lg bg-red-50 p-3 text-xs leading-5 text-red-700">{errorMessage}</p></section></main>;
  }

  return <>{children}</>;
}
