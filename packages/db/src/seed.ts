/**
 * Seed script: ensures there's at least one Settings row for the active build,
 * and creates the data/ directory if missing.
 */
import { prisma, ensureSchema } from "./index.js";

async function main() {
  await ensureSchema();
  const _ = await prisma.settings.upsert({
    where: { key: "active_build" },
    update: {},
    create: { key: "active_build", value: "" },
  });
  await prisma.settings.upsert({
    where: { key: "focus_lock_until" },
    update: {},
    create: { key: "focus_lock_until", value: "" },
  });
  console.log("Seed complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
