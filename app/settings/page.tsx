import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

const TITLES: Record<string, { title: string; desc: string }> = {
  hrm: { title: "HRM", desc: "Employee directory, attendance, leaves." },
  recruitment: { title: "Recruitment", desc: "Candidate pipeline and scorecards." },
  operations: { title: "Operations", desc: "Investors, grants, partnerships, vendors." },
  projects: { title: "Projects", desc: "Tasks, sprints, kanban boards." },
  product: { title: "Product", desc: "Feature matrix across platforms." },
  bugs: { title: "Bugs", desc: "Issue tracking and resolution." },
  releases: { title: "Releases", desc: "Version tracking and changelogs." },
  "knowledge-base": { title: "Knowledge Base", desc: "Internal wiki and docs." },
  assets: { title: "Assets", desc: "Domains, servers, licenses." },
  reports: { title: "Reports", desc: "Executive dashboard and exports." },
  settings: { title: "Settings", desc: "RBAC and account settings." },
};

export default function Page() {
  const meta = TITLES["settings"];
  return (
    <AppShell>
      <PageHeader title={meta.title} description={meta.desc} />
      <Card className="p-6 text-sm text-muted-foreground">
        Module coming in the next phase. The data model and routes are scaffolded.
      </Card>
    </AppShell>
  );
}
