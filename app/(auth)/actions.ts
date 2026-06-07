"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase-auth-server";
import { prisma } from "@/lib/prisma";

export type AuthFormState = { error?: string; ok?: boolean };

export async function signInWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Email and password are required." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Touch the user record to ensure it exists.
  await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, role: "EMPLOYEE", status: "ACTIVE" },
  });

  revalidatePath("/", "layout");
  redirect("/crm");
}

export async function signUpWithPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!email || !password) return { error: "Email and password are required." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name, role: "EMPLOYEE" } },
  });
  if (error) return { error: error.message };

  await prisma.user.upsert({
    where: { email },
    update: { name: name || undefined, emailVerified: null },
    create: { email, name: name || null, role: "EMPLOYEE", status: "ACTIVE" },
  });

  revalidatePath("/", "layout");
  redirect("/crm");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
