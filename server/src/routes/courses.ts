import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerCrud } from "./_crud.js";

const Create = z.object({
  code: z.string().min(1).max(30),
  titleFa: z.string().min(1).max(200),
  level: z.string().min(1).max(60),
  category: z.string().min(1).max(60),
  descriptionFa: z.string().max(2000).default(""),
  active: z.boolean().default(true),
});
const Update = Create.partial();

export async function registerCoursesRoutes(app: FastifyInstance) {
  registerCrud(app, { path: "/courses", model: "course", create: Create, update: Update, publicList: true });
}
