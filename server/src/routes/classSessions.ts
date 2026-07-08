import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerCrud } from "./_crud.js";

const Create = z.object({
  courseId: z.string().cuid(),
  teacherId: z.string().cuid(),
  semesterId: z.string().cuid(),
  scheduleFa: z.string().min(1).max(200),
  mode: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  capacity: z.number().int().min(1).max(500),
  priceToman: z.number().int().min(0),
  status: z.enum(["open", "full", "closed"]).default("open"),
  notes: z.string().max(1000).default(""),
});
const Update = Create.partial();

export async function registerClassSessionsRoutes(app: FastifyInstance) {
  registerCrud(app, { path: "/class-sessions", model: "classSession", create: Create, update: Update, publicList: true });
}
