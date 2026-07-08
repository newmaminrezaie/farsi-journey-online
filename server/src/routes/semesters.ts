import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerCrud } from "./_crud.js";

const Create = z.object({
  titleFa: z.string().min(1).max(120),
  jalaliYear: z.number().int().min(1300).max(1500),
  season: z.enum(["spring", "summer", "fall", "winter"]),
  startsOn: z.coerce.date(),
  endsOn: z.coerce.date(),
  registrationStatus: z.enum(["draft", "open", "closed", "archived"]).default("draft"),
});
const Update = Create.partial();

export async function registerSemestersRoutes(app: FastifyInstance) {
  registerCrud(app, { path: "/semesters", model: "semester", create: Create, update: Update, publicList: true, orderBy: { startsOn: "desc" } });
}
