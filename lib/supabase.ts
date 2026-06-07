// Browser-side Supabase client. Use this in Client Components only.
// Server-side clients live in lib/supabase-auth-server.ts and lib/supabase-auth.ts.
"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
