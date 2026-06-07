import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { NewLeaveDialog } from "@/components/hrm/new-leave-dialog";
import { LeaveRequestsTable } from "@/components/hrm/leave-requests-table";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listLeaveRequests, listEmployees } from "../actions";

export const dynamic = "force-dynamic";

export default async function LeavesPage() {
  return (
    <ProtectedLayout>
      <LeavesContent />
    </ProtectedLayout>
  );
}

async function LeavesContent() {
  const [leavesRes, employeesRes] = await Promise.all([
    listLeaveRequests(),
    listEmployees(),
  ]);
  const leaves = leavesRes.success ? leavesRes.data : [];
  const employees = employeesRes.success ? employeesRes.data : [];

  const counts = {
    pending: leaves.filter((l) => l.status === "PENDING").length,
    approved: leaves.filter((l) => l.status === "APPROVED").length,
    rejected: leaves.filter((l) => l.status === "REJECTED").length,
  };

  return (
    <>
      <PageHeader
        title="Leave Requests"
        description={`${counts.pending} pending · ${counts.approved} approved · ${counts.rejected} rejected`}
        actions={<NewLeaveDialog employees={employees} />}
      />

      {leaves.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No leave requests yet.
        </Card>
      ) : (
        <LeaveRequestsTable leaves={leaves} />
      )}
    </>
  );
}
