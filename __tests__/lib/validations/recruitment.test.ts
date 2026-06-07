import {
  createCandidateSchema,
  updateCandidateSchema,
  moveCandidateSchema,
  candidateListQuerySchema,
  createInterviewSchema,
  updateInterviewSchema,
  createScorecardSchema,
  updateScorecardSchema,
} from "@/lib/validations/recruitment";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";

describe("recruitment validations", () => {
  describe("createCandidateSchema", () => {
    it("accepts a minimal candidate", () => {
      const r = createCandidateSchema.parse({
        name: "Priya Sharma",
        email: "priya@example.com",
        positionApplied: "Backend Engineer",
      });
      expect(r.name).toBe("Priya Sharma");
      expect(r.stage).toBe("APPLIED");
    });

    it("rejects empty name", () => {
      expect(() =>
        createCandidateSchema.parse({
          name: "",
          email: "a@b.com",
          positionApplied: "X",
        }),
      ).toThrow();
    });

    it("rejects bad email", () => {
      expect(() =>
        createCandidateSchema.parse({
          name: "X",
          email: "not-email",
          positionApplied: "X",
        }),
      ).toThrow();
    });

    it("rejects empty position", () => {
      expect(() =>
        createCandidateSchema.parse({
          name: "X",
          email: "a@b.com",
          positionApplied: "",
        }),
      ).toThrow();
    });

    it("coerces score and rejects out of range", () => {
      const r = createCandidateSchema.parse({
        name: "X",
        email: "a@b.com",
        positionApplied: "X",
        score: "85",
      });
      expect(r.score).toBe(85);

      expect(() =>
        createCandidateSchema.parse({
          name: "X",
          email: "a@b.com",
          positionApplied: "X",
          score: 150,
        }),
      ).toThrow();
    });

    it("accepts all stages", () => {
      for (const s of [
        "APPLIED",
        "SCREENING",
        "INTERVIEW",
        "TECHNICAL_ROUND",
        "ASSIGNMENT",
        "OFFER",
        "HIRED",
        "REJECTED",
      ]) {
        const r = createCandidateSchema.parse({
          name: "X",
          email: "a@b.com",
          positionApplied: "X",
          stage: s,
        });
        expect(r.stage).toBe(s);
      }
    });
  });

  describe("updateCandidateSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateCandidateSchema.parse({
        id: UUID,
        name: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.name).toBe("Updated");
    });
  });

  describe("moveCandidateSchema", () => {
    it("requires id + stage", () => {
      const r = moveCandidateSchema.parse({
        id: UUID,
        stage: "INTERVIEW",
      });
      expect(r.stage).toBe("INTERVIEW");
    });

    it("rejects unknown stage", () => {
      expect(() =>
        moveCandidateSchema.parse({ id: UUID, stage: "DONE" }),
      ).toThrow();
    });
  });

  describe("candidateListQuerySchema", () => {
    it("applies defaults", () => {
      const r = candidateListQuerySchema.parse({});
      expect(r.page).toBe(1);
      expect(r.limit).toBe(50);
    });

    it("rejects limit above 50", () => {
      expect(() => candidateListQuerySchema.parse({ limit: 100 })).toThrow();
    });

    it("accepts search and position filter", () => {
      const r = candidateListQuerySchema.parse({
        search: "frontend",
        positionApplied: "Engineer",
      });
      expect(r.search).toBe("frontend");
      expect(r.positionApplied).toBe("Engineer");
    });
  });

  describe("createInterviewSchema", () => {
    it("accepts a minimal interview", () => {
      const r = createInterviewSchema.parse({
        candidateId: UUID,
        scheduledAt: "2026-06-15T10:00:00Z",
        type: "VIDEO",
      });
      expect(r.type).toBe("VIDEO");
      expect(r.scheduledAt).toBeInstanceOf(Date);
    });

    it("rejects missing scheduledAt", () => {
      expect(() =>
        createInterviewSchema.parse({
          candidateId: UUID,
          type: "PHONE",
        }),
      ).toThrow();
    });

    it("coerces rating and rejects out of range", () => {
      const r = createInterviewSchema.parse({
        candidateId: UUID,
        scheduledAt: "2026-06-15T10:00:00Z",
        type: "PHONE",
        rating: "4",
      });
      expect(r.rating).toBe(4);

      expect(() =>
        createInterviewSchema.parse({
          candidateId: UUID,
          scheduledAt: "2026-06-15T10:00:00Z",
          type: "PHONE",
          rating: 6,
        }),
      ).toThrow();
    });

    it("accepts all interview types", () => {
      for (const t of ["PHONE", "VIDEO", "ONSITE", "PANEL"]) {
        const r = createInterviewSchema.parse({
          candidateId: UUID,
          scheduledAt: "2026-06-15T10:00:00Z",
          type: t,
        });
        expect(r.type).toBe(t);
      }
    });

    it("accepts all interview results", () => {
      for (const x of [
        "STRONG_HIRE",
        "HIRE",
        "NO_DECISION",
        "NO_HIRE",
        "STRONG_NO_HIRE",
      ]) {
        const r = createInterviewSchema.parse({
          candidateId: UUID,
          scheduledAt: "2026-06-15T10:00:00Z",
          result: x,
        });
        expect(r.result).toBe(x);
      }
    });
  });

  describe("updateInterviewSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateInterviewSchema.parse({
        id: UUID,
        notes: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.notes).toBe("Updated");
    });
  });

  describe("createScorecardSchema", () => {
    it("accepts criteria + score", () => {
      const r = createScorecardSchema.parse({
        candidateId: UUID,
        criteria: "System design",
        score: 80,
      });
      expect(r.criteria).toBe("System design");
      expect(r.score).toBe(80);
    });

    it("rejects empty criteria", () => {
      expect(() =>
        createScorecardSchema.parse({
          candidateId: UUID,
          criteria: "",
          score: 50,
        }),
      ).toThrow();
    });

    it("rejects score above 100", () => {
      expect(() =>
        createScorecardSchema.parse({
          candidateId: UUID,
          criteria: "X",
          score: 200,
        }),
      ).toThrow();
    });

    it("rejects negative score", () => {
      expect(() =>
        createScorecardSchema.parse({
          candidateId: UUID,
          criteria: "X",
          score: -1,
        }),
      ).toThrow();
    });
  });

  describe("updateScorecardSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateScorecardSchema.parse({
        id: UUID,
        score: 90,
      });
      expect(r.id).toBe(UUID);
      expect(r.score).toBe(90);
    });
  });
});
