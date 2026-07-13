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

export async function registerRegistrationsRoutes(app: FastifyInstance) {
  // Public: create a registration from the site's forms.
  app.post("/registrations", async (req, reply) => {
    const parsed = Create.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const data = { ...parsed.data, semesterId: parsed.data.semesterId ?? null };

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
  });

  // Staff-only management endpoints below.
  app.get("/registrations", { preHandler: requireStaff }, async () => {
    return prisma.registration.findMany({ orderBy: { createdAt: "desc" }, take: 500 });
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
