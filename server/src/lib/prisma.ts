import { PrismaClient } from "@prisma/client";

// Single Prisma instance for the whole process.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["query", "error", "warn"],
});
