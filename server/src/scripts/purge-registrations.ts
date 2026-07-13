// One-shot: delete all registrations. Run via
//   docker-compose run --rm api node dist/scripts/purge-registrations.js
import { prisma } from "../lib/prisma.js";

async function main() {
  const c = await prisma.registration.count();
  const r = await prisma.registration.deleteMany({});
  // Reset seatsTaken counters on all semesters back to 0.
  await prisma.semester.updateMany({ data: { seatsTaken: 0 } });
  console.log(`Deleted ${r.count} of ${c} registrations. Reset seatsTaken to 0 on all semesters.`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
