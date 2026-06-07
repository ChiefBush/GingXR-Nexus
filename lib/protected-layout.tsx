import { redirect } from "next/navigation";
import { getCurrentUser } from "./supabase-auth";
import { AppShell } from "@/components/layout/app-shell";

export async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <AppShell user={user}>{children}</AppShell>;
}
