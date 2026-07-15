"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let browserClient: SupabaseClient | undefined;

export function isSupabaseConfigured() {
  return Boolean(url && publishableKey);
}

export function createSupabaseBrowserClient() {
  if (!url || !publishableKey) {
    throw new Error("Supabase is not configured. Add the public project URL and publishable key to your environment variables.");
  }

  if (!browserClient) {
    browserClient = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true,
      },
    });
  }

  return browserClient;
}
