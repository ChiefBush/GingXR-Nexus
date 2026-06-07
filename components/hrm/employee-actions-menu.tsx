"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteEmployee, updateEmployee } from "@/app/hrm/actions";
import type { EmployeeStatus, EmploymentType } from "@prisma/client";

type Dept = { id: string; name: string };
type Desig = { id: string; title: string };
type Emp = { id: string; name: string; email: string };
type Initial = {
  name: string;
  email: string;
  phone: string | null;
  photo: string | null;
  departmentId: string | null;
  designationId: string | null;
  joiningDate: string | null;
  employmentType: EmploymentType;
  salary: number | null;
  reportingManagerId: string | null;
  status: EmployeeStatus;
};

export function EmployeeActionsMenu({
  employeeId,
  initial,
  departments,
  designations,
  employees,
}: {
  employeeId: string;
  initial: Initial;
  departments: Dept[];
  designations: Desig[];
  employees: Emp[];
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(initial.name);
  const [email, setEmail] = useState(initial.email);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [departmentId, setDepartmentId] = useState<string>(
    initial.departmentId ?? "__none__",
  );
  const [designationId, setDesignationId] = useState<string>(
    initial.designationId ?? "__none__",
  );
  const [employmentType, setEmploymentType] = useState<EmploymentType>(
    initial.employmentType,
  );
  const [status, setStatus] = useState<EmployeeStatus>(initial.status);
  const [joiningDate, setJoiningDate] = useState(initial.joiningDate ?? "");
  const [salary, setSalary] = useState<string>(
    initial.salary ? String(initial.salary) : "",
  );
  const [reportingManagerId, setReportingManagerId] = useState<string>(
    initial.reportingManagerId ?? "__none__",
  );
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, startDelete] = useTransition();

  const save = () => {
    setError(null);
    start(async () => {
      const res = await updateEmployee({
        id: employeeId,
        name: name.trim(),
        email: email.trim(),
        phone: phone || null,
        departmentId: departmentId === "__none__" ? null : departmentId,
        designationId: designationId === "__none__" ? null : designationId,
        employmentType,
        status,
        joiningDate: joiningDate || null,
        salary: salary ? Number(salary) : null,
        reportingManagerId:
          reportingManagerId === "__none__" ? null : reportingManagerId,
      });
      if (res.success) {
        setEditOpen(false);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  const onDelete = () => {
    if (!confirm("Delete this employee? The record will be hidden.")) return;
    startDelete(async () => {
      const res = await deleteEmployee(employeeId);
      if (res.success) {
        router.push("/hrm");
        router.refresh();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            Edit employee
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={onDelete}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="eename">Name</Label>
                <Input id="eename" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="eeemail">Email</Label>
                <Input
                  id="eeemail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eephone">Phone</Label>
                <Input
                  id="eephone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eesalary">Salary</Label>
                <Input
                  id="eesalary"
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="eedate">Joining date</Label>
                <Input
                  id="eedate"
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>
              <div>
                <Label>Employment type</Label>
                <Select
                  value={employmentType}
                  onValueChange={(v) => setEmploymentType(v as EmploymentType)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_TIME">Full time</SelectItem>
                    <SelectItem value="PART_TIME">Part time</SelectItem>
                    <SelectItem value="CONTRACT">Contract</SelectItem>
                    <SelectItem value="INTERN">Intern</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Designation</Label>
                <Select value={designationId} onValueChange={setDesignationId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {designations.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Reporting manager</Label>
                <Select
                  value={reportingManagerId}
                  onValueChange={setReportingManagerId}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— None —</SelectItem>
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(v) => setStatus(v as EmployeeStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="ON_LEAVE">On leave</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                    <SelectItem value="RESIGNED">Resigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={pending || !name.trim() || !email.trim()}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {pendingDelete ? (
        <span className="ml-2 text-xs text-muted-foreground">Deleting…</span>
      ) : null}
    </>
  );
}
