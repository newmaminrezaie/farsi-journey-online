// Bootstrap or reset the first admin user from env vars. Safe to re-run.
import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";

async function main() {
  const username = process.env.BOOTSTRAP_ADMIN_USERNAME ?? "admin";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  const fullName = process.env.BOOTSTRAP_ADMIN_NAME ?? "مدیر گویا";
  if (!password) throw new Error("BOOTSTRAP_ADMIN_PASSWORD is required");

  const existing = await prisma.staffUser.findUnique({ where: { username } });
  if (existing) {
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    await prisma.staffUser.update({
      where: { username },
      data: { passwordHash, fullName, role: "admin", active: true },
    });
    console.log(`reset admin '${username}' password and activated account`);
    return;
  }

  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
  const user = await prisma.staffUser.create({
    data: { username, passwordHash, fullName, role: "admin" },
  });
  console.log(`created admin '${user.username}' (${user.id})`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
