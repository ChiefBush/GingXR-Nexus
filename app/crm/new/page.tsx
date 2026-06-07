import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { NewLeadDialog } from "@/components/crm/new-lead-dialog";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewLeadPage() {
  return (
    <AppShell>
      <Link
        href="/crm"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to CRM
      </Link>
      <PageHeader
        title="New Lead"
        description="Add a new lead to the pipeline."
        actions={<NewLeadDialog />}
      />
      <Card className="p-6 text-sm text-muted-foreground">
        Click <span className="font-medium text-foreground">New Lead</span> in the
        top right to open the create form.
      </Card>
    </AppShell>
  );
}
