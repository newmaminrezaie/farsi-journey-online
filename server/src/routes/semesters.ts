import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireStaff } from "../middleware/auth.js";

const Create = z.object({
  titleFa: z.string().min(1).max(200),
  level: z.string().max(60).default("beginner"),
  teacherId: z.string().max(50).default(""),
  teacherIds: z.array(z.string()).default([]),
  bookIds: z.array(z.string()).default([]),
  scheduleFa: z.string().max(500).default(""),
  startsOn: z.coerce.date(),
  endsOn: z.coerce.date(),
  capacity: z.number().int().min(0).default(0),
  seatsTaken: z.number().int().min(0).default(0),
  priceToman: z.number().int().min(0).default(0),
  mode: z.enum(["in-person", "online", "hybrid"]).default("in-person"),
  status: z.enum(["open", "closed", "archived"]).default("open"),
});
const Update = Create.partial();

// Serialize dates to ISO yyyy-mm-dd for the frontend.
function serialize(s: any) {
  if (!s) return s;
  return {
    ...s,
    startsOn: s.startsOn instanceof Date ? s.startsOn.toISOString().slice(0, 10) : s.startsOn,
    endsOn: s.endsOn instanceof Date ? s.endsOn.toISOString().slice(0, 10) : s.endsOn,
  };
}

export async function registerSemestersRoutes(app: FastifyInstance) {
  app.get("/semesters", async () => {
    const rows = await prisma.semester.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(serialize);
  });

  app.get("/semesters/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const row = await prisma.semester.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ error: "not_found" });
    return serialize(row);
  });

  app.post("/semesters", { preHandler: requireStaff }, async (req, reply) => {
    const parsed = Create.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const row = await prisma.semester.create({ data: parsed.data });
    return serialize(row);
  });

  app.patch("/semesters/:id", { preHandler: requireStaff }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = Update.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const row = await prisma.semester.update({ where: { id }, data: parsed.data });
    return serialize(row);
  });

  app.delete("/semesters/:id", { preHandler: requireStaff }, async (req) => {
    const id = (req.params as any).id as string;
    await prisma.semester.delete({ where: { id } });
    return { ok: true };
  });
}
