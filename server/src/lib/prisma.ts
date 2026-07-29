import { PrismaClient } from "@prisma/client";

// Single Prisma instance for the whole process.
// Production logs errors only — query logging retains strings and costs RAM.
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error", "warn"],
});
