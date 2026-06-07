import {
  createReleaseSchema,
  updateReleaseSchema,
  createReleaseNoteSchema,
  updateReleaseNoteSchema,
  linkItemSchema,
  unlinkItemSchema,
  releaseListQuerySchema,
} from "@/lib/validations/release";

describe("release validations", () => {
  describe("createReleaseSchema", () => {
    it("accepts a minimal valid release", () => {
      const result = createReleaseSchema.parse({
        productId: "550e8400-e29b-41d4-a716-446655440000",
        version: "1.0.0",
        name: "Initial release",
      });
      expect(result.version).toBe("1.0.0");
      expect(result.status).toBe("PLANNING");
    });

    it("rejects invalid version characters", () => {
      expect(() =>
        createReleaseSchema.parse({
          productId: "550e8400-e29b-41d4-a716-446655440000",
          version: "v 1.0",
          name: "X",
        }),
      ).toThrow();
    });

    it("rejects empty name", () => {
      expect(() =>
        createReleaseSchema.parse({
          productId: "550e8400-e29b-41d4-a716-446655440000",
          version: "1.0.0",
          name: "",
        }),
      ).toThrow();
    });

    it("coerces releaseDate", () => {
      const result = createReleaseSchema.parse({
        productId: "550e8400-e29b-41d4-a716-446655440000",
        version: "1.0.0",
        name: "X",
        releaseDate: "2026-06-01",
      });
      expect(result.releaseDate).toBeInstanceOf(Date);
    });
  });

  describe("updateReleaseSchema", () => {
    it("requires id and allows partial fields", () => {
      const result = updateReleaseSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Updated",
      });
      expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.name).toBe("Updated");
    });
  });

  describe("createReleaseNoteSchema", () => {
    it("accepts a note", () => {
      const result = createReleaseNoteSchema.parse({
        releaseId: "550e8400-e29b-41d4-a716-446655440000",
        category: "FEATURE",
        content: "Added dark mode",
      });
      expect(result.category).toBe("FEATURE");
    });

    it("rejects unknown category", () => {
      expect(() =>
        createReleaseNoteSchema.parse({
          releaseId: "550e8400-e29b-41d4-a716-446655440000",
          category: "WHATEVER",
          content: "X",
        }),
      ).toThrow();
    });

    it("defaults category to GENERAL", () => {
      const result = createReleaseNoteSchema.parse({
        releaseId: "550e8400-e29b-41d4-a716-446655440000",
        content: "X",
      });
      expect(result.category).toBe("GENERAL");
    });
  });

  describe("updateReleaseNoteSchema", () => {
    it("requires id and allows partial fields", () => {
      const result = updateReleaseNoteSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        content: "Updated content",
      });
      expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });
  });

  describe("linkItemSchema", () => {
    it("accepts a feature link", () => {
      const result = linkItemSchema.parse({
        releaseId: "550e8400-e29b-41d4-a716-446655440000",
        itemId: "550e8400-e29b-41d4-a716-446655440001",
        itemType: "feature",
      });
      expect(result.itemType).toBe("feature");
    });

    it("rejects unknown itemType", () => {
      expect(() =>
        linkItemSchema.parse({
          releaseId: "550e8400-e29b-41d4-a716-446655440000",
          itemId: "550e8400-e29b-41d4-a716-446655440001",
          itemType: "epic",
        }),
      ).toThrow();
    });
  });

  describe("unlinkItemSchema", () => {
    it("accepts an unlink", () => {
      const result = unlinkItemSchema.parse({
        releaseId: "550e8400-e29b-41d4-a716-446655440000",
        itemId: "550e8400-e29b-41d4-a716-446655440001",
        itemType: "bug",
      });
      expect(result.itemType).toBe("bug");
    });
  });

  describe("releaseListQuerySchema", () => {
    it("applies defaults", () => {
      const result = releaseListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("rejects limit above 50", () => {
      expect(() => releaseListQuerySchema.parse({ limit: 100 })).toThrow();
    });
  });
});
