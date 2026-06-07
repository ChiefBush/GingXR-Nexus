"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { createAssignment } from "@/app/assets/actions";

type Emp = { id: string; name: string; email: string; employeeId: string };

export function NewAssignmentButton({
  assetId,
  employees,
}: {
  assetId: string;
  employees: Emp[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [employeeId, setEmployeeId] = useState(employees[0]?.id ?? "");
  const [assignedAt, setAssignedAt] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [condition, setCondition] = useState("");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createAssignment({
        assetId,
        employeeId,
        assignedAt,
        condition: condition || null,
      });
      if (res.success) {
        setOpen(false);
        setCondition("");
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5">
          <Plus className="h-4 w-4" /> Assign
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign asset</DialogTitle>
          <DialogDescription>Assign this asset to an employee.</DialogDescription>
        </DialogHeader>
        {employees.length === 0 ? (
          <p className="rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-muted-foreground">
            Add an employee first.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} ({e.employeeId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="asndate">Assigned on</Label>
              <Input
                id="asndate"
                type="date"
                value={assignedAt}
                onChange={(e) => setAssignedAt(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="asncond">Condition</Label>
              <Textarea
                id="asncond"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                rows={2}
                placeholder="e.g. New, Good, Has scratches on lid"
              />
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={pending || !employeeId || !assignedAt}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assign"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
