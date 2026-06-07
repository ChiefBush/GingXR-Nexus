import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmployeeActionsMenu } from "@/components/hrm/employee-actions-menu";
import { ProtectedLayout } from "@/lib/protected-layout";
import {
  getEmployee,
  listDepartments,
  listDesignations,
  listEmployees,
} from "../actions";
import type { EmployeeStatus, EmploymentType } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <ProtectedLayout>
      <EmployeeContent params={params} />
    </ProtectedLayout>
  );
}

async function EmployeeContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [empRes, deptsRes, desigsRes, allEmpsRes] = await Promise.all([
    getEmployee(id),
    listDepartments(),
    listDesignations(),
    listEmployees(),
  ]);
  if (!empRes.success || !empRes.data) return notFound();
  const e = empRes.data;
  const departments = deptsRes.success ? deptsRes.data : [];
  const designations = desigsRes.success ? desigsRes.data : [];
  const allEmployees = allEmpsRes.success
    ? allEmpsRes.data.filter((x) => x.id !== e.id)
    : [];

  return (
    <>
      <Link
        href="/hrm"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> Back to HRM
      </Link>
      <PageHeader
        title={e.name}
        description={
          [e.employeeId, e.designation?.title, e.department?.name]
            .filter(Boolean)
            .join(" · ") || e.email
        }
        actions={
          <EmployeeActionsMenu
            employeeId={e.id}
            initial={{
              name: e.name,
              email: e.email,
              phone: e.phone,
              photo: e.photo,
              departmentId: e.departmentId,
              designationId: e.designationId,
              joiningDate: e.joiningDate
                ? e.joiningDate.toISOString().slice(0, 10)
                : null,
              employmentType: e.employmentType as EmploymentType,
              salary: e.salary ? Number(e.salary) : null,
              reportingManagerId: e.reportingManagerId,
              status: e.status as EmployeeStatus,
            }}
            departments={departments}
            designations={designations}
            employees={allEmployees}
          />
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
        <StatusBadge status={e.status as EmployeeStatus} />
        <TypeBadge type={e.employmentType as EmploymentType} />
        {e.reportingManager ? (
          <span className="text-muted-foreground">
            Reports to {e.reportingManager.name ?? e.reportingManager.email}
          </span>
        ) : null}
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">
          Joined {new Date(e.joiningDate).toLocaleDateString()}
        </span>
        {e.salary ? (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">
              ₹ {Number(e.salary).toLocaleString()}
            </span>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h3 className="mb-2 text-sm font-semibold">Contact</h3>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Field label="Email" value={e.email} />
            <Field label="Phone" value={e.phone ?? "—"} />
            <Field
              label="Department"
              value={e.department?.name ?? "—"}
            />
            <Field
              label="Designation"
              value={e.designation?.title ?? "—"}
            />
            <Field
              label="Linked user"
              value={e.user?.email ?? "Not linked"}
            />
            <Field
              label="Employment type"
              value={(e.employmentType as EmploymentType)
                .replace("_", " ")
                .toLowerCase()}
            />
          </dl>
        </Card>
        <Card className="p-5">
          <h3 className="mb-2 text-sm font-semibold">Quick links</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/hrm/leaves"
                className="text-primary hover:underline"
              >
                Manage leave requests
              </Link>
            </li>
            <li>
              <Link
                href="/hrm/attendance"
                className="text-primary hover:underline"
              >
                Record attendance
              </Link>
            </li>
          </ul>
        </Card>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5">{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: EmployeeStatus }) {
  const map: Record<EmployeeStatus, { label: string; cls: string }> = {
    ACTIVE: { label: "Active", cls: "bg-accent text-foreground" },
    ON_LEAVE: { label: "On leave", cls: "bg-warning text-foreground" },
    TERMINATED: { label: "Terminated", cls: "bg-destructive text-destructive-foreground" },
    RESIGNED: { label: "Resigned", cls: "bg-muted text-muted-foreground" },
  };
  return <Badge className={map[status].cls}>{map[status].label}</Badge>;
}

function TypeBadge({ type }: { type: EmploymentType }) {
  const map: Record<EmploymentType, string> = {
    FULL_TIME: "Full time",
    PART_TIME: "Part time",
    CONTRACT: "Contract",
    INTERN: "Intern",
  };
  return <Badge className="bg-secondary text-foreground">{map[type]}</Badge>;
}
