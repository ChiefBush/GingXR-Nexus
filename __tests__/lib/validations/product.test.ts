import {
  createProductSchema,
  createFeatureSchema,
  updatePlatformStatusSchema,
  platformStatusEnum,
  featurePriorityEnum,
} from "@/lib/validations/product";

describe("product validations", () => {
  describe("createProductSchema", () => {
    it("accepts a valid product", () => {
      const r = createProductSchema.safeParse({
        name: "RoomantAR",
        description: "AR home staging",
      });
      expect(r.success).toBe(true);
    });

    it("rejects empty name", () => {
      const r = createProductSchema.safeParse({ name: "" });
      expect(r.success).toBe(false);
    });

    it("rejects name over 100 chars", () => {
      const r = createProductSchema.safeParse({ name: "x".repeat(101) });
      expect(r.success).toBe(false);
    });
  });

  describe("createFeatureSchema", () => {
    it("defaults priority to MEDIUM", () => {
      const r = createFeatureSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        name: "Login",
      });
      expect(r.success).toBe(true);
      if (r.success) expect(r.data.priority).toBe("MEDIUM");
    });

    it("rejects unknown priority", () => {
      const r = createFeatureSchema.safeParse({
        productId: "11111111-1111-1111-1111-111111111111",
        name: "Login",
        priority: "BANANA",
      });
      expect(r.success).toBe(false);
    });

    it("requires a valid uuid for productId", () => {
      const r = createFeatureSchema.safeParse({
        productId: "not-a-uuid",
        name: "Login",
      });
      expect(r.success).toBe(false);
    });
  });

  describe("updatePlatformStatusSchema", () => {
    it("accepts valid status", () => {
      const r = updatePlatformStatusSchema.safeParse({
        featureId: "11111111-1111-1111-1111-111111111111",
        platformId: "22222222-2222-2222-2222-222222222222",
        status: "IN_PROGRESS",
      });
      expect(r.success).toBe(true);
    });

    it("enforces enum values", () => {
      const r = updatePlatformStatusSchema.safeParse({
        featureId: "11111111-1111-1111-1111-111111111111",
        platformId: "22222222-2222-2222-2222-222222222222",
        status: "FLYING",
      });
      expect(r.success).toBe(false);
    });
  });

  describe("enum exports", () => {
    it("platformStatusEnum has the 6 statuses", () => {
      expect(platformStatusEnum.options).toHaveLength(6);
    });

    it("featurePriorityEnum has 4 priorities", () => {
      expect(featurePriorityEnum.options).toHaveLength(4);
    });
  });
});
