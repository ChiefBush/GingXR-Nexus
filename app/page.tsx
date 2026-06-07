import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase-auth";

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect("/crm");
  redirect("/login");
}
