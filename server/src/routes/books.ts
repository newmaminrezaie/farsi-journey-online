import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerCrud } from "./_crud.js";

const Create = z.object({
  titleFa: z.string().min(1).max(200),
  author: z.string().max(120).default(""),
  level: z.string().max(60).default(""),
  category: z.string().max(60).default(""),
  descriptionFa: z.string().max(2000).default(""),
  coverUrl: z.string().max(500).default(""),
  priceToman: z.number().int().min(0),
  stock: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
});
const Update = Create.partial();

export async function registerBooksRoutes(app: FastifyInstance) {
  registerCrud(app, { path: "/books", model: "book", create: Create, update: Update, publicList: true });
}
