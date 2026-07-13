import type { FastifyInstance } from "fastify";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { requireStaff } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.resolve(__dirname, "../../uploads");

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function registerUploadsRoutes(app: FastifyInstance) {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });

  app.post("/uploads", { preHandler: requireStaff }, async (req, reply) => {
    const file = await (req as any).file();
    if (!file) return reply.code(400).send({ error: "no_file" });
    if (!ALLOWED.has(file.mimetype)) return reply.code(400).send({ error: "bad_type" });
    const ext = (file.mimetype.split("/")[1] || "bin").replace("jpeg", "jpg");
    const name = `${Date.now()}-${randomBytes(6).toString("hex")}.${ext}`;
    const full = path.join(UPLOADS_DIR, name);
    const buf = await file.toBuffer();
    if (buf.length > 5 * 1024 * 1024) return reply.code(400).send({ error: "too_large" });
    await fs.writeFile(full, buf);
    return { url: `/uploads/${name}` };
  });
}
