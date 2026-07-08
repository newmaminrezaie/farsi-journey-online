import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireStaff } from "../middleware/auth.js";

// Student number generator: <jalaliYear><4-digit sequence per year>.
// Uses a Postgres sequence per Jalali year. Sequences are created lazily.
async function nextStudentNumber(jalaliYear: number): Promise<string> {
  const seq = `student_seq_${jalaliYear}`;
  // Create if missing (idempotent). Prisma doesn't parametrize DDL.
  await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS ${seq} START 1`);
  const rows = await prisma.$queryRawUnsafe<{ nextval: bigint }[]>(`SELECT nextval('${seq}')`);
  const n = Number(rows[0].nextval);
  return `${jalaliYear}${String(n).padStart(4, "0")}`;
}

const Create = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  fatherName: z.string().max(80).default(""),
  phone: z.string().min(5).max(20),
  nationalId: z.string().max(20).optional().nullable(),
  birthDate: z.coerce.date().optional().nullable(),
  address: z.string().max(500).default(""),
  note: z.string().max(1000).default(""),
  jalaliYear: z.number().int().min(1300).max(1500),
});

const Update = Create.partial().omit({ jalaliYear: true });

const LookupBody = z.object({
  phone: z.string().max(20).optional(),
  nationalId: z.string().max(20).optional(),
});

export async function registerStudentsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", requireStaff);

  app.get("/students", async (req) => {
    const q = ((req.query as any).q ?? "").toString().trim();
    const where = q
      ? {
          OR: [
            { studentNumber: { contains: q } },
            { phone: { contains: q } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
            { nationalId: { contains: q } },
          ],
        }
      : {};
    return prisma.student.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  });

  app.get("/students/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            classSession: { include: { course: true, teacher: true } },
            semester: true,
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    });
    if (!student) return reply.code(404).send({ error: "not_found" });
    const totalPaid = student.enrollments.reduce((s, e) => s + e.amountPaidToman, 0);
    return { ...student, totalPaidToman: totalPaid };
  });

  // Returning-student lookup — used by the public registration form.
  app.post("/students/lookup", async (req, reply) => {
    const parsed = LookupBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { phone, nationalId } = parsed.data;
    if (!phone && !nationalId) return { student: null };
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          nationalId ? { nationalId } : undefined,
          phone ? { phone } : undefined,
        ].filter(Boolean) as any,
      },
    });
    return { student };
  });

  app.post("/students", async (req, reply) => {
    const parsed = Create.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const { jalaliYear, ...rest } = parsed.data;
    const studentNumber = await nextStudentNumber(jalaliYear);
    try {
      return await prisma.student.create({ data: { ...rest, studentNumber } });
    } catch (e: any) {
      if (e?.code === "P2002") return reply.code(409).send({ error: "duplicate", meta: e.meta });
      throw e;
    }
  });

  app.patch("/students/:id", async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = Update.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return prisma.student.update({ where: { id }, data: parsed.data });
  });
}
