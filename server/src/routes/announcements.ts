// اطلاعیه‌ها — announcements stored in a small JSON file (no DB migration, low RAM).
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { requireStaff } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const FILE = path.join(DATA_DIR, "announcements.json");

const Announcement = z.object({
  id: z.string(),
  title: z.string().min(1).max(160),
  body: z.string().max(4000).default(""),
  kind: z.enum(["news", "important", "event"]).default("news"),
  pinned: z.boolean().default(false),
  published: z.boolean().default(true),
  linkHref: z.string().max(300).default(""),
  linkLabel: z.string().max(60).default(""),
  createdAt: z.string(),
});
export type AnnouncementT = z.infer<typeof Announcement>;

const Input = Announcement.omit({ id: true, createdAt: true }).partial({
  body: true, kind: true, pinned: true, published: true, linkHref: true, linkLabel: true,
});

async function readAll(): Promise<AnnouncementT[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const arr = z.array(Announcement).safeParse(JSON.parse(raw));
    return arr.success ? arr.data : [];
  } catch {
    return [];
  }
}
async function writeAll(rows: AnnouncementT[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

function sortRows(rows: AnnouncementT[]) {
  return [...rows].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export async function registerAnnouncementsRoutes(app: FastifyInstance) {
  // Public: published announcements
  app.get("/announcements", async () => sortRows(await readAll()).filter(a => a.published));

  // Admin: full list
  app.get("/admin/announcements", { preHandler: requireStaff }, async () => sortRows(await readAll()));

  app.post("/admin/announcements", { preHandler: requireStaff }, async (req, reply) => {
    const parsed = Input.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const row = Announcement.parse({
      ...parsed.data,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    const rows = await readAll();
    rows.push(row);
    await writeAll(rows);
    return row;
  });

  app.patch("/admin/announcements/:id", { preHandler: requireStaff }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = Input.partial().safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const rows = await readAll();
    const idx = rows.findIndex(r => r.id === id);
    if (idx < 0) return reply.code(404).send({ error: "not_found" });
    rows[idx] = Announcement.parse({ ...rows[idx], ...parsed.data });
    await writeAll(rows);
    return rows[idx];
  });

  app.delete("/admin/announcements/:id", { preHandler: requireStaff }, async (req) => {
    const id = (req.params as any).id as string;
    await writeAll((await readAll()).filter(r => r.id !== id));
    return { ok: true };
  });
}
