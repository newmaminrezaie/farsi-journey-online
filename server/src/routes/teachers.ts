import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerCrud } from "./_crud.js";

const Create = z.object({
  nameFa: z.string().min(1).max(120),
  nameEn: z.string().min(1).max(120),
  bioFa: z.string().max(2000).default(""),
  photoUrl: z.string().max(500).default(""),
  specialties: z.array(z.string().max(60)).default([]),
  active: z.boolean().default(true),
});
const Update = Create.partial();

export async function registerTeachersRoutes(app: FastifyInstance) {
  registerCrud(app, { path: "/teachers", model: "teacher", create: Create, update: Update, publicList: true });
}
