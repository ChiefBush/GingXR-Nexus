import {
  createAssetCategorySchema,
  updateAssetCategorySchema,
  createAssetSchema,
  updateAssetSchema,
  assetListQuerySchema,
  createAssignmentSchema,
  updateAssignmentSchema,
  returnAssignmentSchema,
} from "@/lib/validations/asset";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";

describe("asset validations", () => {
  describe("createAssetCategorySchema", () => {
    it("accepts a name-only category", () => {
      const r = createAssetCategorySchema.parse({ name: "Domains" });
      expect(r.name).toBe("Domains");
    });

    it("rejects empty name", () => {
      expect(() => createAssetCategorySchema.parse({ name: "" })).toThrow();
    });
  });

  describe("updateAssetCategorySchema", () => {
    it("requires id and allows partial", () => {
      const r = updateAssetCategorySchema.parse({
        id: UUID,
        name: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.name).toBe("Updated");
    });
  });

  describe("createAssetSchema", () => {
    it("accepts a minimal asset", () => {
      const r = createAssetSchema.parse({
        name: "MacBook Pro 16",
        type: "Hardware",
        assetCategoryId: UUID,
      });
      expect(r.status).toBe("ACTIVE");
    });

    it("rejects empty name", () => {
      expect(() =>
        createAssetSchema.parse({
          name: "",
          type: "Hardware",
          assetCategoryId: UUID,
        }),
      ).toThrow();
    });

    it("rejects empty type", () => {
      expect(() =>
        createAssetSchema.parse({
          name: "X",
          type: "",
          assetCategoryId: UUID,
        }),
      ).toThrow();
    });

    it("coerces value and rejects negative", () => {
      const r = createAssetSchema.parse({
        name: "X",
        type: "Hardware",
        assetCategoryId: UUID,
        value: "2400",
      });
      expect(r.value).toBe(2400);

      expect(() =>
        createAssetSchema.parse({
          name: "X",
          type: "Hardware",
          assetCategoryId: UUID,
          value: -50,
        }),
      ).toThrow();
    });

    it("coerces expiryDate to Date", () => {
      const r = createAssetSchema.parse({
        name: "X",
        type: "Domain",
        assetCategoryId: UUID,
        expiryDate: "2027-06-15",
      });
      expect(r.expiryDate).toBeInstanceOf(Date);
    });

    it("accepts all statuses", () => {
      for (const s of [
        "ACTIVE",
        "EXPIRED",
        "IN_MAINTENANCE",
        "DISPOSED",
      ]) {
        const r = createAssetSchema.parse({
          name: "X",
          type: "Hardware",
          assetCategoryId: UUID,
          status: s,
        });
        expect(r.status).toBe(s);
      }
    });
  });

  describe("updateAssetSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateAssetSchema.parse({
        id: UUID,
        name: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.name).toBe("Updated");
    });
  });

  describe("assetListQuerySchema", () => {
    it("applies defaults", () => {
      const r = assetListQuerySchema.parse({});
      expect(r.page).toBe(1);
      expect(r.limit).toBe(50);
    });

    it("rejects limit above 50", () => {
      expect(() => assetListQuerySchema.parse({ limit: 200 })).toThrow();
    });

    it("accepts status and category filter", () => {
      const r = assetListQuerySchema.parse({
        status: "EXPIRED",
        categoryId: UUID,
      });
      expect(r.status).toBe("EXPIRED");
      expect(r.categoryId).toBe(UUID);
    });
  });

  describe("createAssignmentSchema", () => {
    it("accepts a minimal assignment", () => {
      const r = createAssignmentSchema.parse({
        assetId: UUID,
        employeeId: UUID2,
      });
      expect(r.assetId).toBe(UUID);
      expect(r.employeeId).toBe(UUID2);
    });

    it("coerces assignedAt to Date", () => {
      const r = createAssignmentSchema.parse({
        assetId: UUID,
        employeeId: UUID2,
        assignedAt: "2026-05-01",
      });
      expect(r.assignedAt).toBeInstanceOf(Date);
    });

    it("rejects empty condition too long", () => {
      expect(() =>
        createAssignmentSchema.parse({
          assetId: UUID,
          employeeId: UUID2,
          condition: "x".repeat(501),
        }),
      ).toThrow();
    });
  });

  describe("updateAssignmentSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateAssignmentSchema.parse({
        id: UUID,
        condition: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.condition).toBe("Updated");
    });
  });

  describe("returnAssignmentSchema", () => {
    it("requires id", () => {
      const r = returnAssignmentSchema.parse({ id: UUID });
      expect(r.id).toBe(UUID);
    });

    it("accepts condition", () => {
      const r = returnAssignmentSchema.parse({
        id: UUID,
        condition: "Has minor scratches",
      });
      expect(r.condition).toBe("Has minor scratches");
    });
  });
});
