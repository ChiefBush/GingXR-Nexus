"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InvestorsTable } from "./investors-table";
import { GrantsTable } from "./grants-table";
import { PartnershipsTable } from "./partnerships-table";
import { VendorsTable } from "./vendors-table";

type Investor = {
  id: string;
  name: string;
  fund: string | null;
  email: string | null;
  phone: string | null;
  ticketSize: string | null;
  lastMeeting: Date | null;
  nextFollowUp: Date | null;
  notes: string | null;
  status: string;
};

type Grant = {
  id: string;
  program: string;
  organization: string;
  status: string;
  amount: string | null;
  deadline: Date | null;
  notes: string | null;
};

type Partnership = {
  id: string;
  organization: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  status: string;
  type: string | null;
  notes: string | null;
};

type Vendor = {
  id: string;
  name: string;
  service: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contractUrl: string | null;
  renewalDate: Date | null;
  status: string;
  notes: string | null;
};

export function OperationsTabs({
  investors,
  grants,
  partnerships,
  vendors,
}: {
  investors: Investor[];
  grants: Grant[];
  partnerships: Partnership[];
  vendors: Vendor[];
}) {
  return (
    <Tabs defaultValue="investors" className="w-full">
      <TabsList>
        <TabsTrigger value="investors">Investors ({investors.length})</TabsTrigger>
        <TabsTrigger value="grants">Grants ({grants.length})</TabsTrigger>
        <TabsTrigger value="partnerships">
          Partnerships ({partnerships.length})
        </TabsTrigger>
        <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="investors" className="mt-4">
        <InvestorsTable rows={investors} />
      </TabsContent>
      <TabsContent value="grants" className="mt-4">
        <GrantsTable rows={grants} />
      </TabsContent>
      <TabsContent value="partnerships" className="mt-4">
        <PartnershipsTable rows={partnerships} />
      </TabsContent>
      <TabsContent value="vendors" className="mt-4">
        <VendorsTable rows={vendors} />
      </TabsContent>
    </Tabs>
  );
}
