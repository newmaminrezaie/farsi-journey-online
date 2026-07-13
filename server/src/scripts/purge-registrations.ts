// Removes ALL existing registrations and resets seatsTaken on every semester.
// Usage inside the api container:
//   docker-compose exec api node --loader tsx server/src/scripts/purge-registrations.ts
// or if built: node dist/scripts/purge-registrations.js
import { prisma } from "../lib/prisma.js";

async function main() {
  const del = await prisma.registration.deleteMany({});
  const reset = await prisma.semester.updateMany({ data: { seatsTaken: 0 } });
  console.log(`deleted ${del.count} registrations, reset ${reset.count} semesters.`);
}
main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
