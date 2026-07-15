import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireStaff } from "../middleware/auth.js";

function normalizeSemesterInput(input: unknown) {
  if (!input || typeof input !== "object") return input;
  const data = { ...(input as Record<string, unknown>) };
  const legacyTeacherId = typeof data.teacherId === "string" ? data.teacherId : "";
  if ((!Array.isArray(data.teacherIds) || data.teacherIds.length === 0) && legacyTeacherId) {
    data.teacherIds = [legacyTeacherId];
  }
  delete data.teacherId;
  delete data.jalaliYear;
  delete data.season;
  return data;
}

const SemesterShape = z.object({
  classCode: z.string().max(60).optional().default(""),
  titleFa: z.string().min(1).max(200),
  level: z.string().max(60).default("beginner"),
  
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
const Create = z.preprocess(normalizeSemesterInput, SemesterShape);
const Update = z.preprocess(normalizeSemesterInput, SemesterShape.partial());

function toJalali(gy: number, gm: number, gd: number): [number, number, number] {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4)
    - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400)
    + gd + gdm[gm - 1];
  let jy = -1595 + 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return [jy, jm, jd];
}

function legacyMeta(startsOn: Date) {
  const [jalaliYear, jalaliMonth] = toJalali(startsOn.getUTCFullYear(), startsOn.getUTCMonth() + 1, startsOn.getUTCDate());
  const season = jalaliMonth <= 3 ? "spring" : jalaliMonth <= 6 ? "summer" : jalaliMonth <= 9 ? "fall" : "winter";
  return { jalaliYear, season };
}

function levelPrefix(level: string): string {
  const map: Record<string, string> = {
    beginner: "BG", elementary: "EL", "pre-intermediate": "PI",
    intermediate: "IN", "upper-intermediate": "UI", advanced: "AD", ielts: "IE",
  };
  return map[level] ?? "GN";
}

async function generateClassCode(level: string, startsOn: Date): Promise<string> {
  const [jy, jm] = toJalali(startsOn.getUTCFullYear(), startsOn.getUTCMonth() + 1, startsOn.getUTCDate());
  const jyy = String(jy).slice(-2);
  const jmm = String(jm).padStart(2, "0");
  const prefix = `${levelPrefix(level)}-${jyy}${jmm}`;
  // Try a few random suffixes to guarantee uniqueness.
  for (let i = 0; i < 8; i++) {
    const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
    const code = `${prefix}-${suffix}`;
    const exists = await prisma.semester.findUnique({ where: { classCode: code } }).catch(() => null);
    if (!exists) return code;
  }
  return `${prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

async function createSemester(data: z.infer<typeof SemesterShape>) {
  const classCode = await generateClassCode(data.level, data.startsOn);
  const withCode: any = { ...data, classCode };
  try {
    return await prisma.semester.create({ data: withCode });
  } catch (e: any) {
    const message = String(e?.message || "");
    if (message.includes("Argument `jalaliYear` is missing") || message.includes("Argument `season` is missing")) {
      return prisma.semester.create({ data: { ...withCode, ...legacyMeta(data.startsOn) } as any });
    }
    throw e;
  }
}

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
    // Backfill classCode for any legacy row missing it.
    for (const r of rows as any[]) {
      if (!r.classCode) {
        const code = await generateClassCode(r.level, r.startsOn);
        await prisma.semester.update({ where: { id: r.id }, data: { classCode: code } as any });
        r.classCode = code;
      }
    }
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
    const row = await createSemester(parsed.data);
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
