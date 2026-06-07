import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createDesignationSchema,
  updateDesignationSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeListQuerySchema,
  createLeaveRequestSchema,
  updateLeaveRequestSchema,
  decideLeaveRequestSchema,
  recordAttendanceSchema,
  updateAttendanceSchema,
  createHolidaySchema,
  updateHolidaySchema,
} from "@/lib/validations/hrm";

const UUID = "550e8400-e29b-41d4-a716-446655440000";
const UUID2 = "550e8400-e29b-41d4-a716-446655440001";

describe("hrm validations", () => {
  describe("createDepartmentSchema", () => {
    it("accepts a name-only department", () => {
      const r = createDepartmentSchema.parse({ name: "Engineering" });
      expect(r.name).toBe("Engineering");
      expect(r.description).toBeUndefined();
    });

    it("rejects empty name", () => {
      expect(() => createDepartmentSchema.parse({ name: "" })).toThrow();
    });
  });

  describe("updateDepartmentSchema", () => {
    it("requires id and allows partial fields", () => {
      const r = updateDepartmentSchema.parse({ id: UUID, name: "Sales" });
      expect(r.id).toBe(UUID);
      expect(r.name).toBe("Sales");
    });
  });

  describe("createDesignationSchema", () => {
    it("accepts a title-only designation", () => {
      const r = createDesignationSchema.parse({ title: "Backend Engineer" });
      expect(r.title).toBe("Backend Engineer");
    });

    it("rejects empty title", () => {
      expect(() => createDesignationSchema.parse({ title: "" })).toThrow();
    });
  });

  describe("updateDesignationSchema", () => {
    it("requires id", () => {
      const r = updateDesignationSchema.parse({
        id: UUID,
        description: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.description).toBe("Updated");
    });
  });

  describe("createEmployeeSchema", () => {
    it("accepts a minimal employee", () => {
      const r = createEmployeeSchema.parse({
        name: "Sky Patel",
        email: "sky@example.com",
        joiningDate: "2026-01-15",
      });
      expect(r.name).toBe("Sky Patel");
      expect(r.email).toBe("sky@example.com");
      expect(r.joiningDate).toBeInstanceOf(Date);
      expect(r.employmentType).toBe("FULL_TIME");
      expect(r.status).toBe("ACTIVE");
    });

    it("rejects bad email", () => {
      expect(() =>
        createEmployeeSchema.parse({
          name: "X",
          email: "not-an-email",
          joiningDate: "2026-01-15",
        }),
      ).toThrow();
    });

    it("rejects empty name", () => {
      expect(() =>
        createEmployeeSchema.parse({
          name: "",
          email: "a@b.com",
          joiningDate: "2026-01-15",
        }),
      ).toThrow();
    });

    it("accepts all employment types", () => {
      for (const t of ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERN"]) {
        const r = createEmployeeSchema.parse({
          name: "X",
          email: "a@b.com",
          joiningDate: "2026-01-15",
          employmentType: t,
        });
        expect(r.employmentType).toBe(t);
      }
    });

    it("accepts all statuses", () => {
      for (const s of ["ACTIVE", "ON_LEAVE", "TERMINATED", "RESIGNED"]) {
        const r = createEmployeeSchema.parse({
          name: "X",
          email: "a@b.com",
          joiningDate: "2026-01-15",
          status: s,
        });
        expect(r.status).toBe(s);
      }
    });

    it("coerces salary to number and rejects negative", () => {
      const r = createEmployeeSchema.parse({
        name: "X",
        email: "a@b.com",
        joiningDate: "2026-01-15",
        salary: "100000",
      });
      expect(r.salary).toBe(100000);

      expect(() =>
        createEmployeeSchema.parse({
          name: "X",
          email: "a@b.com",
          joiningDate: "2026-01-15",
          salary: -1,
        }),
      ).toThrow();
    });
  });

  describe("updateEmployeeSchema", () => {
    it("requires id and allows partial fields", () => {
      const r = updateEmployeeSchema.parse({
        id: UUID,
        name: "Updated",
        status: "ON_LEAVE",
      });
      expect(r.id).toBe(UUID);
      expect(r.name).toBe("Updated");
      expect(r.status).toBe("ON_LEAVE");
    });
  });

  describe("employeeListQuerySchema", () => {
    it("applies defaults", () => {
      const r = employeeListQuerySchema.parse({});
      expect(r.page).toBe(1);
      expect(r.limit).toBe(50);
    });

    it("rejects limit above 50", () => {
      expect(() => employeeListQuerySchema.parse({ limit: 100 })).toThrow();
    });

    it("accepts status filter", () => {
      const r = employeeListQuerySchema.parse({ status: "ACTIVE" });
      expect(r.status).toBe("ACTIVE");
    });
  });

  describe("createLeaveRequestSchema", () => {
    it("accepts a valid range", () => {
      const r = createLeaveRequestSchema.parse({
        employeeId: UUID,
        leaveType: "CASUAL",
        startDate: "2026-03-01",
        endDate: "2026-03-05",
        reason: "Family trip",
      });
      expect(r.leaveType).toBe("CASUAL");
      expect(r.startDate).toBeInstanceOf(Date);
      expect(r.endDate).toBeInstanceOf(Date);
    });

    it("rejects endDate before startDate", () => {
      expect(() =>
        createLeaveRequestSchema.parse({
          employeeId: UUID,
          leaveType: "SICK",
          startDate: "2026-03-10",
          endDate: "2026-03-05",
        }),
      ).toThrow(/endDate/);
    });

    it("allows same-day range", () => {
      const r = createLeaveRequestSchema.parse({
        employeeId: UUID,
        leaveType: "EARNED",
        startDate: "2026-04-01",
        endDate: "2026-04-01",
      });
      expect(r.startDate).toEqual(r.endDate);
    });

    it("rejects unknown leaveType", () => {
      expect(() =>
        createLeaveRequestSchema.parse({
          employeeId: UUID,
          leaveType: "VACATION",
          startDate: "2026-03-01",
          endDate: "2026-03-05",
        }),
      ).toThrow();
    });
  });

  describe("updateLeaveRequestSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateLeaveRequestSchema.parse({
        id: UUID,
        reason: "Edited",
      });
      expect(r.id).toBe(UUID);
      expect(r.reason).toBe("Edited");
    });
  });

  describe("decideLeaveRequestSchema", () => {
    it("accepts APPROVED", () => {
      const r = decideLeaveRequestSchema.parse({ id: UUID, status: "APPROVED" });
      expect(r.status).toBe("APPROVED");
    });

    it("accepts REJECTED", () => {
      const r = decideLeaveRequestSchema.parse({ id: UUID, status: "REJECTED" });
      expect(r.status).toBe("REJECTED");
    });

    it("rejects PENDING (decisions must be final)", () => {
      expect(() =>
        decideLeaveRequestSchema.parse({ id: UUID, status: "PENDING" }),
      ).toThrow();
    });
  });

  describe("recordAttendanceSchema", () => {
    it("accepts date + status", () => {
      const r = recordAttendanceSchema.parse({
        employeeId: UUID,
        date: "2026-05-10",
        status: "PRESENT",
      });
      expect(r.status).toBe("PRESENT");
      expect(r.checkIn).toBeUndefined();
    });

    it("accepts checkIn + checkOut", () => {
      const r = recordAttendanceSchema.parse({
        employeeId: UUID,
        date: "2026-05-10",
        status: "PRESENT",
        checkIn: "2026-05-10T09:00:00Z",
        checkOut: "2026-05-10T18:00:00Z",
      });
      expect(r.checkIn).toBeInstanceOf(Date);
      expect(r.checkOut).toBeInstanceOf(Date);
    });

    it("rejects checkOut before checkIn", () => {
      expect(() =>
        recordAttendanceSchema.parse({
          employeeId: UUID,
          date: "2026-05-10",
          status: "PRESENT",
          checkIn: "2026-05-10T18:00:00Z",
          checkOut: "2026-05-10T09:00:00Z",
        }),
      ).toThrow(/checkOut/);
    });

    it("allows either checkIn or checkOut alone", () => {
      const r1 = recordAttendanceSchema.parse({
        employeeId: UUID,
        date: "2026-05-10",
        status: "WORK_FROM_HOME",
        checkIn: "2026-05-10T10:00:00Z",
      });
      expect(r1.checkOut).toBeUndefined();

      const r2 = recordAttendanceSchema.parse({
        employeeId: UUID,
        date: "2026-05-10",
        status: "WORK_FROM_HOME",
        checkOut: "2026-05-10T15:00:00Z",
      });
      expect(r2.checkIn).toBeUndefined();
    });

    it("accepts all statuses", () => {
      for (const s of [
        "PRESENT",
        "ABSENT",
        "HALF_DAY",
        "WORK_FROM_HOME",
      ]) {
        const r = recordAttendanceSchema.parse({
          employeeId: UUID,
          date: "2026-05-10",
          status: s,
        });
        expect(r.status).toBe(s);
      }
    });
  });

  describe("updateAttendanceSchema", () => {
    it("requires id and allows partial", () => {
      const r = updateAttendanceSchema.parse({
        id: UUID,
        status: "ABSENT",
      });
      expect(r.id).toBe(UUID);
      expect(r.status).toBe("ABSENT");
    });
  });

  describe("createHolidaySchema", () => {
    it("accepts name + date", () => {
      const r = createHolidaySchema.parse({
        name: "Diwali",
        date: "2026-11-08",
      });
      expect(r.name).toBe("Diwali");
      expect(r.date).toBeInstanceOf(Date);
      expect(r.recurring).toBe(false);
    });

    it("accepts recurring flag", () => {
      const r = createHolidaySchema.parse({
        name: "Republic Day",
        date: "2026-01-26",
        recurring: true,
      });
      expect(r.recurring).toBe(true);
    });

    it("rejects empty name", () => {
      expect(() =>
        createHolidaySchema.parse({ name: "", date: "2026-11-08" }),
      ).toThrow();
    });
  });

  describe("updateHolidaySchema", () => {
    it("requires id and allows partial", () => {
      const r = updateHolidaySchema.parse({
        id: UUID,
        description: "Updated",
      });
      expect(r.id).toBe(UUID);
      expect(r.description).toBe("Updated");
    });
  });
});
