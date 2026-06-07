import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding users…");

  const admin = await prisma.user.upsert({
    where: { email: "admin@gingxr.com" },
    update: {},
    create: {
      email: "admin@gingxr.com",
      name: "Admin",
      role: "ADMIN",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  const sky = await prisma.user.upsert({
    where: { email: "sky@gingxr.com" },
    update: {},
    create: {
      email: "sky@gingxr.com",
      name: "Sky",
      role: "SALES",
      status: "ACTIVE",
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Users seeded: ${admin.email} (${admin.role}), ${sky.email} (${sky.role})`);

  const leadCount = await prisma.lead.count();
  if (leadCount === 0) {
    const statuses = [
      "NEW",
      "QUALIFIED",
      "MEETING_SCHEDULED",
      "PROPOSAL_SENT",
      "NEGOTIATION",
      "WON",
      "LOST",
    ] as const;
    const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
    const companies = [
      "Acme Corp",
      "Globex",
      "Initech",
      "Umbrella",
      "Hooli",
      "Stark Industries",
      "Wayne Enterprises",
      "Pied Piper",
      "Massive Dynamic",
      "Vandelay Industries",
    ];
    const seedLeads = Array.from({ length: 12 }, (_, i) => ({
      companyName: companies[i % companies.length],
      contactName: ["Alex Patel", "Riya Sharma", "Jordan Lee", "Sam Rivera"][i % 4],
      email: `contact${i + 1}@${companies[i % companies.length].toLowerCase().replace(/\s+/g, "")}.com`,
      phone: `+91 98${String(10000000 + i).slice(-8)}`,
      industry: ["SaaS", "Fintech", "Healthtech", "Edtech"][i % 4],
      source: ["Website", "Referral", "LinkedIn", "Cold Outreach"][i % 4],
      value: 10000 + i * 5000,
      priority: priorities[i % priorities.length],
      status: statuses[i % statuses.length],
      notes: "Seeded demo lead.",
      createdById: sky.id,
      updatedById: sky.id,
      assignedToId: i % 2 === 0 ? sky.id : admin.id,
    }));
    await prisma.lead.createMany({ data: seedLeads });
    console.log(`✅ Seeded ${seedLeads.length} demo leads`);
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
