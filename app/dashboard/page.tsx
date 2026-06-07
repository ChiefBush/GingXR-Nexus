import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <AppShell>
      <PageHeader
        title="Dashboard"
        description="Welcome back. Cross-module activity at a glance."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Leads</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Open Bugs</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">Active Sprints</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase text-muted-foreground">On Leave</p>
          <p className="mt-2 text-2xl font-semibold">—</p>
        </Card>
      </div>
    </AppShell>
  );
}
