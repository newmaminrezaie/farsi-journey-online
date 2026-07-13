import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerCrud } from "./_crud.js";

const Create = z.object({
  nameFa: z.string().min(1).max(120),
  nameEn: z.string().max(120).default(""),
  roleFa: z.string().max(120).default(""),
  bioFa: z.string().max(2000).default(""),
  photoUrl: z.string().max(500).default(""),
  active: z.boolean().default(true),
});
const Update = Create.partial();

export async function registerEmployeesRoutes(app: FastifyInstance) {
  registerCrud(app, { path: "/employees", model: "employee", create: Create, update: Update, publicList: true });
}
