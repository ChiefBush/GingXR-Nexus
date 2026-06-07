import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { prisma } from "./prisma";

export async function getSupabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as CookieOptions),
            );
          } catch {
            // Server Components can't set cookies; ignore (handled by middleware).
          }
        },
      },
    },
  );
}

/**
 * Returns the current user from Supabase session, mapped to the Prisma User row.
 * Creates the Prisma row on first sign-in (Supabase auth.users -> public.users).
 */
export async function getCurrentUser() {
  const supabase = await getSupabaseServer();
  const {
    data: { user: sbUser },
  } = await supabase.auth.getUser();
  if (!sbUser?.email) return null;

  const existing = await prisma.user.findUnique({
    where: { email: sbUser.email },
  });
  if (existing) return existing;

  // First-time sign-in: create the local user record.
  return prisma.user.create({
    data: {
      id: sbUser.id,
      email: sbUser.email,
      name: (sbUser.user_metadata?.name as string) ?? sbUser.email.split("@")[0],
      image: (sbUser.user_metadata?.avatar_url as string) ?? null,
      emailVerified: sbUser.email_confirmed_at ? new Date(sbUser.email_confirmed_at) : null,
      role: (sbUser.user_metadata?.role as never) ?? "EMPLOYEE",
      status: "ACTIVE",
    },
  });
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}

export type Role =
  | "FOUNDER"
  | "ADMIN"
  | "HR"
  | "SALES"
  | "DEVELOPER"
  | "PRODUCT_MANAGER"
  | "EMPLOYEE"
  | "INTERN";

export async function requireRole(...allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role as Role)) {
    throw new Error("Forbidden: insufficient role");
  }
  return user;
}

// Service-role admin client (server-only, full DB access). Never import in client code.
export function supabaseAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
