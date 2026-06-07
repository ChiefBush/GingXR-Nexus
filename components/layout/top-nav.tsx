import { Search, Bell, Plus, Sparkles, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase-auth-server";
import type { User } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  // The route handler doesn't exist yet; client will navigate manually below.
}

export function TopNav({
  user,
}: {
  user?: Pick<User, "id" | "name" | "email" | "image" | "role"> | null;
}) {
  const initials = (user?.name ?? user?.email ?? "?")
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="relative flex-1 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search leads, employees, projects…" className="pl-9" />
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="AI Assistant">
          <Sparkles className="h-4 w-4" />
        </Button>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          Quick Create
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Open user menu"
              className="ml-2 h-9 w-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {initials || "?"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-medium">{user?.name ?? "Signed in"}</p>
              <p className="text-xs font-normal text-muted-foreground truncate">
                {user?.email}
              </p>
              {user?.role ? (
                <p className="mt-1 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase">
                  {user.role}
                </p>
              ) : null}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action={signOut}>
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </DropdownMenuItem>
            </form>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
