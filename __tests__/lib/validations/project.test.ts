import {
  createProjectSchema,
  updateProjectSchema,
  createSprintSchema,
  updateSprintSchema,
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  addDependencySchema,
} from "@/lib/validations/project";

describe("project validations", () => {
  describe("createProjectSchema", () => {
    it("accepts a minimal valid project", () => {
      const result = createProjectSchema.parse({ name: "Mobile App v2" });
      expect(result.name).toBe("Mobile App v2");
      expect(result.status).toBe("PLANNING");
      expect(result.priority).toBe("MEDIUM");
    });

    it("rejects empty name", () => {
      expect(() => createProjectSchema.parse({ name: "" })).toThrow();
    });

    it("coerces date strings", () => {
      const result = createProjectSchema.parse({
        name: "P",
        startDate: "2026-01-01",
        deadline: "2026-12-31",
      });
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.deadline).toBeInstanceOf(Date);
    });

    it("rejects invalid status", () => {
      expect(() =>
        createProjectSchema.parse({ name: "P", status: "FOO" }),
      ).toThrow();
    });
  });

  describe("updateProjectSchema", () => {
    it("requires id and allows partial fields", () => {
      const result = updateProjectSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "X",
      });
      expect(result.id).toBe("550e8400-e29b-41d4-a716-446655440000");
      expect(result.name).toBe("X");
    });

    it("rejects non-uuid id", () => {
      expect(() => updateProjectSchema.parse({ id: "nope" })).toThrow();
    });
  });

  describe("createSprintSchema", () => {
    it("accepts valid sprint with required dates", () => {
      const result = createSprintSchema.parse({
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Sprint 1",
        startDate: "2026-01-01",
        endDate: "2026-01-14",
      });
      expect(result.name).toBe("Sprint 1");
      expect(result.status).toBe("PLANNING");
    });

    it("rejects missing startDate", () => {
      expect(() =>
        createSprintSchema.parse({
          projectId: "550e8400-e29b-41d4-a716-446655440000",
          name: "S",
          endDate: "2026-01-14",
        }),
      ).toThrow();
    });
  });

  describe("updateSprintSchema", () => {
    it("rejects endDate before startDate", () => {
      expect(() =>
        updateSprintSchema.parse({
          id: "550e8400-e29b-41d4-a716-446655440000",
          startDate: "2026-02-01",
          endDate: "2026-01-01",
        }),
      ).toThrow();
    });

    it("accepts endDate on or after startDate", () => {
      expect(() =>
        updateSprintSchema.parse({
          id: "550e8400-e29b-41d4-a716-446655440000",
          startDate: "2026-01-01",
          endDate: "2026-01-01",
        }),
      ).not.toThrow();
    });
  });

  describe("createTaskSchema", () => {
    it("accepts minimal task", () => {
      const result = createTaskSchema.parse({
        projectId: "550e8400-e29b-41d4-a716-446655440000",
        title: "Wire up auth",
      });
      expect(result.title).toBe("Wire up auth");
      expect(result.priority).toBe("MEDIUM");
      expect(result.status).toBe("BACKLOG");
    });

    it("rejects empty title", () => {
      expect(() =>
        createTaskSchema.parse({
          projectId: "550e8400-e29b-41d4-a716-446655440000",
          title: "",
        }),
      ).toThrow();
    });
  });

  describe("moveTaskSchema", () => {
    it("requires id and status", () => {
      const result = moveTaskSchema.parse({
        id: "550e8400-e29b-41d4-a716-446655440000",
        status: "DONE",
      });
      expect(result.status).toBe("DONE");
    });
  });

  describe("addDependencySchema", () => {
    it("rejects self-dependency at semantic level (server enforces)", () => {
      const result = addDependencySchema.parse({
        taskId: "550e8400-e29b-41d4-a716-446655440000",
        dependsOnId: "550e8400-e29b-41d4-a716-446655440001",
        type: "BLOCKS",
      });
      expect(result.type).toBe("BLOCKS");
    });

    it("defaults type to BLOCKS", () => {
      const result = addDependencySchema.parse({
        taskId: "550e8400-e29b-41d4-a716-446655440000",
        dependsOnId: "550e8400-e29b-41d4-a716-446655440001",
      });
      expect(result.type).toBe("BLOCKS");
    });
  });
});
