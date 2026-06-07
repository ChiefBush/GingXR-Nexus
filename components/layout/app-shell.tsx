import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { TopNav } from "./top-nav";
import type { User } from "@prisma/client";

export function AppShell({
  children,
  user,
}: {
  children: ReactNode;
  user?: Pick<User, "id" | "name" | "email" | "image" | "role"> | null;
}) {
  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav user={user} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
