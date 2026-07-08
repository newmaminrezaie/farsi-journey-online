// Small helper to reduce boilerplate for basic authenticated CRUD.
import type { FastifyInstance } from "fastify";
import { requireStaff } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

export function registerCrud<TCreate extends z.ZodTypeAny, TUpdate extends z.ZodTypeAny>(
  app: FastifyInstance,
  opts: {
    path: string;                // e.g. "/teachers"
    model: keyof typeof prisma;  // e.g. "teacher"
    create: TCreate;
    update: TUpdate;
    orderBy?: any;
    publicList?: boolean;        // if true, GET / is unauthenticated (public site)
  },
) {
  const model = (prisma as any)[opts.model];

  const listHandler = async () => model.findMany({ orderBy: opts.orderBy ?? { createdAt: "desc" } });
  if (opts.publicList) {
    app.get(opts.path, listHandler);
  } else {
    app.get(opts.path, { preHandler: requireStaff }, listHandler);
  }

  app.get(`${opts.path}/:id`, async (req, reply) => {
    const id = (req.params as any).id as string;
    const row = await model.findUnique({ where: { id } });
    if (!row) return reply.code(404).send({ error: "not_found" });
    return row;
  });

  app.post(opts.path, { preHandler: requireStaff }, async (req, reply) => {
    const parsed = opts.create.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return model.create({ data: parsed.data });
  });

  app.patch(`${opts.path}/:id`, { preHandler: requireStaff }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = opts.update.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    return model.update({ where: { id }, data: parsed.data });
  });

  app.delete(`${opts.path}/:id`, { preHandler: requireStaff }, async (req) => {
    const id = (req.params as any).id as string;
    await model.delete({ where: { id } });
    return { ok: true };
  });
}
