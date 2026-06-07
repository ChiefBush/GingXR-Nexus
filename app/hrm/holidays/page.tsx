import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { NewHolidayDialog } from "@/components/hrm/new-holiday-dialog";
import { HolidaysList } from "@/components/hrm/holidays-list";
import { ProtectedLayout } from "@/lib/protected-layout";
import { listHolidays } from "../actions";

export const dynamic = "force-dynamic";

export default async function HolidaysPage() {
  return (
    <ProtectedLayout>
      <HolidaysContent />
    </ProtectedLayout>
  );
}

async function HolidaysContent() {
  const res = await listHolidays();
  const holidays = res.success ? res.data : [];
  return (
    <>
      <PageHeader
        title="Holidays"
        description={`${holidays.length} holidays`}
        actions={<NewHolidayDialog />}
      />
      {holidays.length === 0 ? (
        <Card className="p-12 text-center text-sm text-muted-foreground">
          No holidays scheduled. Add one to start building the calendar.
        </Card>
      ) : (
        <HolidaysList holidays={holidays} />
      )}
    </>
  );
}
