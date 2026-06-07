"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Briefcase,
  Building2,
  FolderKanban,
  Package,
  Bug,
  Rocket,
  BookOpen,
  Boxes,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crm", label: "CRM", icon: Users },
  { href: "/hrm", label: "HRM", icon: UserCog },
  { href: "/recruitment", label: "Recruitment", icon: Briefcase },
  { href: "/operations", label: "Operations", icon: Building2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/product", label: "Product", icon: Package },
  { href: "/bugs", label: "Bugs", icon: Bug },
  { href: "/releases", label: "Releases", icon: Rocket },
  { href: "/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { href: "/assets", label: "Assets", icon: Boxes },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-6 py-6">
        <Link href="/dashboard" className="text-xl font-bold text-primary">
          GingXR Nexus
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
