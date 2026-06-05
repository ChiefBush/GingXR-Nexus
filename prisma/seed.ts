import { prisma } from "../lib/prisma";

async function main() {
  console.log("🌱 Seeding database...");

  // TODO: Add seed data for all modules
  // - 50 Leads
  // - 25 Employees
  // - 100 Candidates
  // - 20 Investors
  // - 15 Vendors
  // - 10 Projects
  // - 100 Tasks
  // - 200 Features
  // - 75 Bugs
  // - 20 Releases
  // - 50 Knowledge Base Articles

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
