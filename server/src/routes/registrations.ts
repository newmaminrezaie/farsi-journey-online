import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireStaff } from "../middleware/auth.js";

const Create = z.object({
  semesterId: z.string().nullable().optional(),
  fullName: z.string().min(1).max(200),
  fatherName: z.string().max(200).default(""),
  birthCertNo: z.string().max(50).default(""),
  nationalId: z.string().max(50).default(""),
  issuedFrom: z.string().max(120).default(""),
  birthPlace: z.string().max(200).default(""),
  schoolDegree: z.string().max(200).default(""),
  universityDegree: z.string().max(200).default(""),
  address: z.string().max(1000).default(""),
  phone: z.string().min(3).max(30),
  landline: z.string().max(30).default(""),
  termInterest: z.string().max(200).default(""),
  levelInterest: z.string().max(200).default(""),
  selectedTeacherId: z.string().max(50).default(""),
  selectedBookId: z.string().max(50).default(""),
  note: z.string().max(2000).default(""),
  agreedToTerms: z.boolean().default(false),
});

const StatusUpdate = z.object({
  status: z.enum(["new", "contacted", "enrolled", "rejected"]),
});

const PaymentUpdate = z.object({
  paidToman: z.number().int().nonnegative(),
  paymentRef: z.string().max(64).default(""),
});

// Strip C0/C1 controls (keep \t \n \r), BOM and zero-width chars. ZWNJ (\u200C) is kept.
function cleanString(val: unknown): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u200B\u200D\uFEFF]/g, "")
    .trim();
}
function digitsOnly(val: unknown): string {
  if (typeof val !== "string") return "";
  return val
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[^\d]/g, "");
}

export async function registerRegistrationsRoutes(app: FastifyInstance) {
  // Public: create a registration from the site's forms.
  app.post("/registrations", async (req, reply) => {
    const parsed = Create.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const p = parsed.data;
    const data = {
      ...p,
      semesterId: p.semesterId ? cleanString(p.semesterId) || null : null,
      fullName: cleanString(p.fullName),
      fatherName: cleanString(p.fatherName),
      birthCertNo: digitsOnly(p.birthCertNo),
      nationalId: digitsOnly(p.nationalId),
      issuedFrom: cleanString(p.issuedFrom),
      birthPlace: cleanString(p.birthPlace),
      schoolDegree: cleanString(p.schoolDegree),
      universityDegree: cleanString(p.universityDegree),
      address: cleanString(p.address),
      phone: digitsOnly(p.phone),
      landline: digitsOnly(p.landline),
      termInterest: cleanString(p.termInterest),
      levelInterest: cleanString(p.levelInterest),
      selectedTeacherId: cleanString(p.selectedTeacherId),
      selectedBookId: cleanString(p.selectedBookId),
      note: cleanString(p.note),
    };
    if (!data.fullName) {
      return reply.code(400).send({ error: "invalid_input", field: "fullName", message: "نام و نام خانوادگی معتبر وارد کنید." });
    }
    if (data.phone.length < 3) {
      return reply.code(400).send({ error: "invalid_input", field: "phone", message: "شماره تماس معتبر وارد کنید." });
    }

    try {
    const reg = await prisma.$transaction(async (tx) => {
      const created = await tx.registration.create({ data });
      if (created.semesterId) {
        await tx.semester.updateMany({
          where: { id: created.semesterId },
          data: { seatsTaken: { increment: 1 } },
        });
      }
      return created;
    });
    return reg;
    } catch (err: any) {
      const m = String(err?.message || "");
      if (err?.code === "22021" || m.includes("22021") || m.includes("invalid byte sequence")) {
        return reply.code(400).send({ error: "invalid_characters", message: "کاراکترهای نامعتبر در اطلاعات ارسالی وجود دارد." });
      }
      throw err;
    }
  });

  // Staff-only management endpoints below.
  app.get("/registrations", { preHandler: requireStaff }, async () => {
    return prisma.registration.findMany({ orderBy: { createdAt: "desc" } });
  });

  app.patch("/registrations/:id", { preHandler: requireStaff }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = StatusUpdate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return prisma.registration.update({ where: { id }, data: { status: parsed.data.status } });
  });

  // Public: mark a registration as paid (called from the Zarinpal callback / mock).
  app.post("/registrations/:id/payment", async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = PaymentUpdate.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return prisma.registration.update({
      where: { id },
      data: {
        paidToman: parsed.data.paidToman,
        paymentRef: parsed.data.paymentRef,
        paidAt: new Date(),
        status: "enrolled",
      },
    });
  });

  app.delete("/registrations/:id", { preHandler: requireStaff }, async (req) => {
    const id = (req.params as any).id as string;
    await prisma.registration.delete({ where: { id } });
    return { ok: true };
  });
}
