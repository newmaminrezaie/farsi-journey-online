import type { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma.js";
import type { StaffRole } from "@prisma/client";

// Attach the current staff user to req.staffUser, or 401.
export async function requireStaff(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify({ onlyCookie: true });
  } catch {
    return reply.code(401).send({ error: "unauthorized" });
  }
  const payload = req.user as { sub?: string } | undefined;
  if (!payload?.sub) return reply.code(401).send({ error: "unauthorized" });
  const user = await prisma.staffUser.findUnique({ where: { id: payload.sub } });
  if (!user || !user.active) return reply.code(401).send({ error: "unauthorized" });
  (req as any).staffUser = user;
}

export function requireRole(...roles: StaffRole[]) {
  return async function (req: FastifyRequest, reply: FastifyReply) {
    const user = (req as any).staffUser;
    if (!user) return reply.code(401).send({ error: "unauthorized" });
    if (!roles.includes(user.role)) return reply.code(403).send({ error: "forbidden" });
  };
}
