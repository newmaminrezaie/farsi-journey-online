import type { FastifyInstance } from "fastify";
import { z } from "zod";
import argon2 from "argon2";
import { prisma } from "../lib/prisma.js";
import { requireStaff, requireRole } from "../middleware/auth.js";

const NOTIFY_EVENTS = ["enrollment_paid", "registration_new", "book_order_paid", "book_order_new"] as const;

const CreateBody = z.object({
  username: z.string().min(3).max(64),
  password: z.string().min(8).max(200),
  fullName: z.string().min(1).max(120),
  role: z.enum(["admin", "staff"]).default("staff"),
});

const UpdateBody = z.object({
  fullName: z.string().min(1).max(120).optional(),
  role: z.enum(["admin", "staff"]).optional(),
  active: z.boolean().optional(),
  baleChatId: z.string().max(64).nullable().optional(),
  telegramChatId: z.string().max(64).nullable().optional(),
  notifyOn: z.array(z.enum(NOTIFY_EVENTS)).optional(),
  password: z.string().min(8).max(200).optional(),
});

export async function registerStaffRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireStaff);

  app.get("/", async () => {
    return prisma.staffUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true, username: true, fullName: true, role: true, active: true,
        baleChatId: true, telegramChatId: true, notifyOn: true, createdAt: true,
      },
    });
  });

  app.post("/", { preHandler: requireRole("admin") }, async (req, reply) => {
    const parsed = CreateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { username, password, fullName, role } = parsed.data;
    const passwordHash = await argon2.hash(password, { type: argon2.argon2id });
    try {
      const u = await prisma.staffUser.create({ data: { username, passwordHash, fullName, role } });
      return { id: u.id, username: u.username, fullName: u.fullName, role: u.role };
    } catch (e: any) {
      if (e?.code === "P2002") return reply.code(409).send({ error: "username_taken" });
      throw e;
    }
  });

  app.patch("/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const actor = (req as any).staffUser;
    if (actor.role !== "admin" && actor.id !== id) return reply.code(403).send({ error: "forbidden" });

    const parsed = UpdateBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { password, ...rest } = parsed.data;

    // non-admins can't change role/active
    if (actor.role !== "admin") {
      delete (rest as any).role;
      delete (rest as any).active;
    }

    const data: any = { ...rest };
    if (password) data.passwordHash = await argon2.hash(password, { type: argon2.argon2id });

    const u = await prisma.staffUser.update({ where: { id }, data });
    return { id: u.id };
  });

  app.delete("/:id", { preHandler: requireRole("admin") }, async (req) => {
    const id = (req.params as any).id as string;
    await prisma.staffUser.update({ where: { id }, data: { active: false } });
    return { ok: true };
  });
}
