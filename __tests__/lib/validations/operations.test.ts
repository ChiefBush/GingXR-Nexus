import {
  createInvestorSchema,
  updateInvestorSchema,
  createGrantSchema,
  updateGrantSchema,
  createPartnershipSchema,
  updatePartnershipSchema,
  createVendorSchema,
  updateVendorSchema,
} from "@/lib/validations/operations";

const UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("operations validations", () => {
  describe("createInvestorSchema", () => {
    it("accepts a minimal investor", () => {
      const r = createInvestorSchema.parse({ name: "Acme Ventures" });
      expect(r.name).toBe("Acme Ventures");
      expect(r.status).toBe("ACTIVE");
    });

    it("rejects empty name", () => {
      expect(() => createInvestorSchema.parse({ name: "" })).toThrow();
    });

    it("rejects bad email", () => {
      expect(() =>
        createInvestorSchema.parse({ name: "X", email: "nope" }),
      ).toThrow();
    });

    it("coerces nextFollowUp to Date", () => {
      const r = createInvestorSchema.parse({
        name: "X",
        nextFollowUp: "2026-09-15",
      });
      expect(r.nextFollowUp).toBeInstanceOf(Date);
    });

    it("accepts all investor statuses", () => {
      for (const s of [
        "ACTIVE",
        "PASS",
        "COMMITTED",
        "PASSED",
        "ON_HOLD",
      ]) {
        const r = createInvestorSchema.parse({ name: "X", status: s });
        expect(r.status).toBe(s);
      }
    });
  });

  describe("updateInvestorSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateInvestorSchema.parse({
        id: UUID,
        name: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.name).toBe("Updated");
    });
  });

  describe("createGrantSchema", () => {
    it("accepts a minimal grant", () => {
      const r = createGrantSchema.parse({
        program: "SBIR Phase I",
        organization: "NSF",
      });
      expect(r.status).toBe("APPLIED");
    });

    it("rejects empty program", () => {
      expect(() =>
        createGrantSchema.parse({ program: "", organization: "X" }),
      ).toThrow();
    });

    it("rejects empty organization", () => {
      expect(() =>
        createGrantSchema.parse({ program: "X", organization: "" }),
      ).toThrow();
    });

    it("coerces amount to number and rejects negative", () => {
      const r = createGrantSchema.parse({
        program: "X",
        organization: "Y",
        amount: "50000",
      });
      expect(r.amount).toBe(50000);

      expect(() =>
        createGrantSchema.parse({
          program: "X",
          organization: "Y",
          amount: -100,
        }),
      ).toThrow();
    });

    it("accepts all grant statuses", () => {
      for (const s of [
        "RESEARCHING",
        "APPLIED",
        "IN_REVIEW",
        "AWARDED",
        "REJECTED",
        "WITHDRAWN",
      ]) {
        const r = createGrantSchema.parse({
          program: "X",
          organization: "Y",
          status: s,
        });
        expect(r.status).toBe(s);
      }
    });
  });

  describe("updateGrantSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateGrantSchema.parse({
        id: UUID,
        status: "AWARDED",
      });
      expect(r.id).toBe(UUID);
      expect(r.status).toBe("AWARDED");
    });
  });

  describe("createPartnershipSchema", () => {
    it("accepts a minimal partnership", () => {
      const r = createPartnershipSchema.parse({ organization: "Acme Corp" });
      expect(r.status).toBe("DISCUSSION");
    });

    it("rejects empty organization", () => {
      expect(() =>
        createPartnershipSchema.parse({ organization: "" }),
      ).toThrow();
    });

    it("rejects bad contact email", () => {
      expect(() =>
        createPartnershipSchema.parse({
          organization: "X",
          contactEmail: "nope",
        }),
      ).toThrow();
    });

    it("accepts all partnership statuses", () => {
      for (const s of [
        "PROSPECTING",
        "DISCUSSION",
        "AGREEMENT",
        "ACTIVE",
        "PAUSED",
        "ENDED",
      ]) {
        const r = createPartnershipSchema.parse({
          organization: "X",
          status: s,
        });
        expect(r.status).toBe(s);
      }
    });

    it("accepts all partnership types", () => {
      for (const t of [
        "RESELLER",
        "TECHNOLOGY",
        "MARKETING",
        "INTEGRATION",
        "STRATEGIC",
        "OTHER",
      ]) {
        const r = createPartnershipSchema.parse({
          organization: "X",
          type: t,
        });
        expect(r.type).toBe(t);
      }
    });
  });

  describe("updatePartnershipSchema", () => {
    it("requires id and allows partial", () => {
      const r = updatePartnershipSchema.parse({
        id: UUID,
        organization: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.organization).toBe("Updated");
    });
  });

  describe("createVendorSchema", () => {
    it("accepts a minimal vendor", () => {
      const r = createVendorSchema.parse({ name: "AWS" });
      expect(r.status).toBe("ACTIVE");
    });

    it("rejects empty name", () => {
      expect(() => createVendorSchema.parse({ name: "" })).toThrow();
    });

    it("coerces renewalDate to Date", () => {
      const r = createVendorSchema.parse({
        name: "X",
        renewalDate: "2026-12-31",
      });
      expect(r.renewalDate).toBeInstanceOf(Date);
    });

    it("rejects bad contractUrl", () => {
      expect(() =>
        createVendorSchema.parse({
          name: "X",
          contractUrl: "not-a-url",
        }),
      ).toThrow();
    });

    it("accepts all vendor statuses", () => {
      for (const s of ["ACTIVE", "ON_HOLD", "ENDED"]) {
        const r = createVendorSchema.parse({ name: "X", status: s });
        expect(r.status).toBe(s);
      }
    });
  });

  describe("updateVendorSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateVendorSchema.parse({
        id: UUID,
        name: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.name).toBe("Updated");
    });
  });
});
