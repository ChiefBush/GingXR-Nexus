import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { NewAttendanceDialog } from "@/components/hrm/new-attendance-dialog";
import { AttendanceTable } from "@/components/hrm/attendance-table";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listAttendance, listEmployees } from "../actions";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  return (
    <ProtectedLayout>
      <AttendanceContent />
    </ProtectedLayout>
  );
}

async function AttendanceContent() {
  const [attRes, employeesRes] = await Promise.all([
    listAttendance(),
    listEmployees(),
  ]);
  const attendance = attRes.success ? attRes.data : [];
  const employees = employeesRes.success ? employeesRes.data : [];

  return (
    <>
      <PageHeader
        title="Attendance"
        description={`${attendance.length} records`}
        actions={<NewAttendanceDialog employees={employees} />}
      />
      {attendance.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No attendance records yet. Use New Attendance to record one.
        </Card>
      ) : (
        <AttendanceTable records={attendance} />
      )}
    </>
  );
}
