import {
  createBugSchema,
  updateBugSchema,
  moveBugSchema,
  createCommentSchema,
  updateCommentSchema,
  bugListQuerySchema,
} from "@/lib/validations/bug";

describe("bug validations", () => {
  describe("createBugSchema", () => {
    it("accepts a minimal valid bug", () => {
      const result = createBugSchema.parse({ title: "Login button broken" });
      expect(result.title).toBe("Login button broken");
      expect(result.severity).toBe("MINOR");
      expect(result.priority).toBe("MEDIUM");
      expect(result.status).toBe("OPEN");
    });

    it("rejects empty title", () => {
      expect(() => createBugSchema.parse({ title: "" })).toThrow();
    });

    it("rejects unknown severity", () => {
      expect(() =>
        createBugSchema.parse({ title: "X", severity: "FATAL" }),
      ).toThrow();
    });

    it("accepts all valid severities", () => {
      for (const s of ["CRITICAL", "MAJOR", "MINOR", "TRIVIAL"]) {
        const r = createBugSchema.parse({ title: "X", severity: s });
        expect(r.severity).toBe(s);
      }
    });

    it("accepts all valid statuses", () => {
      for (const s of [
        "OPEN",
        "INVESTIGATING",
        "IN_PROGRESS",
        "TESTING",
        "RESOLVED",
        "CLOSED",
      ]) {
        const r = createBugSchema.parse({ title: "X", status: s });
        expect(r.status).toBe(s);
      }
    });
  });

  describe("updateBugSchema", () => {
    it("requires id and allows partial fields", () => {
      const result = updateBugSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Updated",
        status: "RESOLVED",
      });
      expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.title).toBe("Updated");
      expect(result.status).toBe("RESOLVED");
    });
  });

  describe("moveBugSchema", () => {
    it("requires id and status", () => {
      const result = moveBugSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "IN_PROGRESS",
      });
      expect(result.status).toBe("IN_PROGRESS");
    });
  });

  describe("createCommentSchema", () => {
    it("accepts a comment", () => {
      const result = createCommentSchema.parse({
        entityType: "bug",
        entityId: "550e8400-e29b-41d4-a716-446655440000",
        content: "I can reproduce this on iOS 17.",
      });
      expect(result.entityType).toBe("bug");
    });

    it("rejects non-bug entityType", () => {
      expect(() =>
        createCommentSchema.parse({
          entityType: "task",
          entityId: "550e8400-e29b-41d4-a716-446655440000",
          content: "X",
        }),
      ).toThrow();
    });

    it("rejects empty content", () => {
      expect(() =>
        createCommentSchema.parse({
          entityType: "bug",
          entityId: "550e8400-e29b-41d4-a716-446655440000",
          content: "",
        }),
      ).toThrow();
    });
  });

  describe("updateCommentSchema", () => {
    it("requires id and content", () => {
      const result = updateCommentSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        content: "Edited",
      });
      expect(result.content).toBe("Edited");
    });
  });

  describe("bugListQuerySchema", () => {
    it("applies defaults", () => {
      const result = bugListQuerySchema.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("rejects limit above 50", () => {
      expect(() => bugListQuerySchema.parse({ limit: 100 })).toThrow();
    });
  });
});
