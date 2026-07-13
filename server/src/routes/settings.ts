import type { FastifyInstance } from "fastify";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { requireStaff } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const FILE = path.join(DATA_DIR, "settings.json");

const PromoBanner = z.object({
  enabled: z.boolean().default(false),
  version: z.number().int().default(1),
  delayMs: z.number().int().min(0).max(60000).default(3000),
  title: z.string().max(120).default("ثبت‌نام دوره‌های تابستانی گویا"),
  subtitle: z.string().max(400).default("کلاس‌های ویژه تابستان با تخفیف زودهنگام. ظرفیت محدود!"),
  badge: z.string().max(40).default("تابستان ۱۴۰۵"),
  ctaLabel: z.string().max(40).default("ثبت‌نام کنید"),
  ctaHref: z.string().max(300).default("/register"),
  imageUrl: z.string().max(500).default(""),
  accent: z.enum(["gold", "turquoise", "navy"]).default("gold"),
});
export type PromoBannerT = z.infer<typeof PromoBanner>;

const Settings = z.object({
  promoBanner: PromoBanner.default({} as any),
});
type SettingsT = z.infer<typeof Settings>;

async function readAll(): Promise<SettingsT> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    return Settings.parse(JSON.parse(raw));
  } catch {
    return Settings.parse({});
  }
}
async function writeAll(s: SettingsT) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(s, null, 2), "utf8");
}

export async function registerSettingsRoutes(app: FastifyInstance) {
  // Public: promo banner config
  app.get("/settings/promo-banner", async () => {
    const s = await readAll();
    return s.promoBanner;
  });

  // Admin: update promo banner
  app.put("/admin/settings/promo-banner", { preHandler: requireStaff }, async (req, reply) => {
    const parsed = PromoBanner.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const cur = await readAll();
    // Auto-bump version whenever content-affecting fields change so dismissals reset.
    const prev = cur.promoBanner;
    const changed =
      prev.title !== parsed.data.title ||
      prev.subtitle !== parsed.data.subtitle ||
      prev.imageUrl !== parsed.data.imageUrl ||
      prev.ctaHref !== parsed.data.ctaHref ||
      prev.ctaLabel !== parsed.data.ctaLabel ||
      prev.badge !== parsed.data.badge;
    const next: PromoBannerT = {
      ...parsed.data,
      version: changed ? (prev.version || 1) + 1 : parsed.data.version,
    };
    await writeAll({ ...cur, promoBanner: next });
    return next;
  });
}
