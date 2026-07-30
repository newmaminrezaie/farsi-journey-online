// کدهای تخفیف — discount codes stored in a small JSON file (no DB migration, low RAM).
// Used by both course registration payments and book shop orders.
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { requireStaff } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const FILE = path.join(DATA_DIR, "discounts.json");
const HOLD_FILE = path.join(DATA_DIR, "discount-holds.json");

export const DiscountScope = z.enum(["all", "registration", "shop"]);

const Discount = z.object({
  id: z.string(),
  code: z.string().min(2).max(40),
  percent: z.number().int().min(1).max(100),
  scope: DiscountScope.default("all"),
  expiresAt: z.string().default(""),        // ISO date "yyyy-mm-dd" or "" = بدون انقضا
  maxUses: z.number().int().min(0).default(0), // 0 = نامحدود
  usedCount: z.number().int().min(0).default(0),
  maxDiscountToman: z.number().int().min(0).default(0), // 0 = بدون سقف
  minAmountToman: z.number().int().min(0).default(0),
  active: z.boolean().default(true),
  note: z.string().max(300).default(""),
  createdAt: z.string(),
});
export type DiscountT = z.infer<typeof Discount>;

const Input = Discount.omit({ id: true, createdAt: true, usedCount: true }).partial({
  scope: true, expiresAt: true, maxUses: true, maxDiscountToman: true,
  minAmountToman: true, active: true, note: true,
});

async function readAll(): Promise<DiscountT[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const arr = z.array(Discount).safeParse(JSON.parse(raw));
    return arr.success ? arr.data : [];
  } catch {
    return [];
  }
}
async function writeAll(rows: DiscountT[]) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2), "utf8");
}

async function readHolds(): Promise<Record<string, string>> {
  try { return JSON.parse(await fs.readFile(HOLD_FILE, "utf8")) as Record<string, string>; }
  catch { return {}; }
}
async function writeHolds(map: Record<string, string>) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(HOLD_FILE, JSON.stringify(map, null, 2), "utf8");
}

export const normalizeCode = (s: string) => s.trim().toUpperCase().replace(/\s+/g, "");

export type DiscountResult =
  | { ok: true; code: string; percent: number; discountToman: number; finalToman: number; id: string }
  | { ok: false; reason: string; messageFa: string };

/** Validate a code against a scope + amount. Pure read — does not consume a use. */
export async function evaluateDiscount(
  rawCode: string,
  scope: "registration" | "shop",
  amountToman: number,
): Promise<DiscountResult> {
  const code = normalizeCode(rawCode || "");
  if (!code) return { ok: false, reason: "empty", messageFa: "کد تخفیف را وارد کنید." };

  const rows = await readAll();
  const d = rows.find(r => normalizeCode(r.code) === code);
  if (!d) return { ok: false, reason: "not_found", messageFa: "کد تخفیف نامعتبر است." };
  if (!d.active) return { ok: false, reason: "inactive", messageFa: "این کد تخفیف غیرفعال شده است." };
  if (d.scope !== "all" && d.scope !== scope) {
    return {
      ok: false, reason: "scope",
      messageFa: d.scope === "registration"
        ? "این کد فقط برای ثبت‌نام کلاس‌ها معتبر است."
        : "این کد فقط برای خرید کتاب معتبر است.",
    };
  }
  if (d.expiresAt) {
    const end = new Date(`${d.expiresAt}T23:59:59`);
    if (!Number.isNaN(end.getTime()) && Date.now() > end.getTime()) {
      return { ok: false, reason: "expired", messageFa: "مهلت استفاده از این کد تخفیف به پایان رسیده است." };
    }
  }
  if (d.maxUses > 0 && d.usedCount >= d.maxUses) {
    return { ok: false, reason: "exhausted", messageFa: "ظرفیت استفاده از این کد تخفیف تکمیل شده است." };
  }
  if (d.minAmountToman > 0 && amountToman < d.minAmountToman) {
    return {
      ok: false, reason: "min_amount",
      messageFa: `این کد برای مبالغ بالای ${d.minAmountToman.toLocaleString("fa-IR")} تومان قابل استفاده است.`,
    };
  }

  let discount = Math.round((amountToman * d.percent) / 100);
  if (d.maxDiscountToman > 0) discount = Math.min(discount, d.maxDiscountToman);
  discount = Math.max(0, Math.min(discount, amountToman));

  return {
    ok: true,
    id: d.id,
    code: normalizeCode(d.code),
    percent: d.percent,
    discountToman: discount,
    finalToman: amountToman - discount,
  };
}

/** Remember which code backs a payment authority, so we can consume it after verification. */
export async function holdDiscountForAuthority(authority: string, code: string) {
  const map = await readHolds();
  map[authority] = normalizeCode(code);
  await writeHolds(map);
}

/** Consume the code tied to an authority (called after a successful Zarinpal verify). */
export async function consumeDiscountForAuthority(authority: string): Promise<string> {
  const map = await readHolds();
  const code = map[authority];
  if (!code) return "";
  delete map[authority];
  await writeHolds(map);

  const rows = await readAll();
  const idx = rows.findIndex(r => normalizeCode(r.code) === code);
  if (idx >= 0) {
    rows[idx] = { ...rows[idx], usedCount: rows[idx].usedCount + 1 };
    await writeAll(rows);
  }
  return code;
}

export async function registerDiscountsRoutes(app: FastifyInstance) {
  // Public: validate a code before paying.
  app.post("/discounts/validate", async (req, reply) => {
    const parsed = z.object({
      code: z.string().max(40),
      scope: z.enum(["registration", "shop"]),
      amountToman: z.number().int().min(0),
    }).safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const res = await evaluateDiscount(parsed.data.code, parsed.data.scope, parsed.data.amountToman);
    if (!res.ok) return reply.code(200).send({ valid: false, messageFa: res.messageFa, reason: res.reason });
    return {
      valid: true,
      code: res.code,
      percent: res.percent,
      discountToman: res.discountToman,
      finalToman: res.finalToman,
    };
  });

  // ---- Admin CRUD ----
  app.get("/admin/discounts", { preHandler: requireStaff }, async () => {
    const rows = await readAll();
    return [...rows].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  app.post("/admin/discounts", { preHandler: requireStaff }, async (req, reply) => {
    const parsed = Input.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const rows = await readAll();
    const code = normalizeCode(parsed.data.code);
    if (rows.some(r => normalizeCode(r.code) === code)) {
      return reply.code(400).send({ error: "duplicate_code" });
    }
    const row = Discount.parse({
      ...parsed.data,
      code,
      usedCount: 0,
      id: randomUUID(),
      createdAt: new Date().toISOString(),
    });
    rows.push(row);
    await writeAll(rows);
    return row;
  });

  app.patch("/admin/discounts/:id", { preHandler: requireStaff }, async (req, reply) => {
    const id = (req.params as any).id as string;
    const parsed = Input.partial().extend({ usedCount: z.number().int().min(0).optional() })
      .safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const rows = await readAll();
    const idx = rows.findIndex(r => r.id === id);
    if (idx < 0) return reply.code(404).send({ error: "not_found" });
    const next = { ...rows[idx], ...parsed.data };
    if (parsed.data.code) next.code = normalizeCode(parsed.data.code);
    if (rows.some((r, i) => i !== idx && normalizeCode(r.code) === normalizeCode(next.code))) {
      return reply.code(400).send({ error: "duplicate_code" });
    }
    rows[idx] = Discount.parse(next);
    await writeAll(rows);
    return rows[idx];
  });

  app.delete("/admin/discounts/:id", { preHandler: requireStaff }, async (req) => {
    const id = (req.params as any).id as string;
    await writeAll((await readAll()).filter(r => r.id !== id));
    return { ok: true };
  });
}
