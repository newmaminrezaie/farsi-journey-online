// Spreadsheet import: institute class list (xls / xlsx / csv) -> Semester rows.
// Two steps: /import/classes/preview parses and reports, /import/classes commits.

import type { FastifyInstance } from "fastify";
import { z } from "zod";
import * as XLSX from "xlsx";
import { prisma } from "../lib/prisma.js";
import { parseJalaliDate } from "../lib/jalali.js";
import { requireStaff } from "../middleware/auth.js";

const DAY_KEYS: Array<{ key: string; fa: string; match: RegExp }> = [
  { key: "saturday", fa: "شنبه", match: /^sat/i },
  { key: "sunday", fa: "یکشنبه", match: /^sun/i },
  { key: "monday", fa: "دوشنبه", match: /^mon/i },
  { key: "tuesday", fa: "سه‌شنبه", match: /^tue/i },
  { key: "wednesday", fa: "چهارشنبه", match: /^wed/i },
  { key: "thursday", fa: "پنجشنبه", match: /^thu/i },
  { key: "friday", fa: "جمعه", match: /^fri/i },
];

/** Institute code (pre A, A1, Pre B3, F4, B7, C3, D1, E2, T1, Passages1A) -> site level. */
export function mapLevel(raw: string): string {
  const s = String(raw || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!s) return "pre-a";
  if (s.startsWith("pre a") || s.startsWith("pre-a")) return "pre-a";
  if (s.startsWith("pre b") || s.startsWith("pre-b")) return "pre-b";
  if (/^t\d/.test(s)) return "pre-a";               // Tiny
  if (/^a\d/.test(s) || s === "a") return "a";
  if (/^(b|f)\d/.test(s) || s === "b") return "b";  // Family & Friends / Beehive
  if (/^c\d/.test(s) || s === "c") return "c";
  if (/^d\d/.test(s) || s === "d") return "d";
  if (/^e\d/.test(s) || s === "e") return "e";
  if (s.includes("passage")) return "e";
  if (s.includes("touch")) return "c";
  if (s.includes("viewpoint")) return "d";
  if (s.includes("evolve")) return "e";
  return "pre-a";
}

function cell(row: any[], idx: number): string {
  if (idx < 0) return "";
  const v = row?.[idx];
  if (v === undefined || v === null) return "";
  return String(v).trim();
}

function normalizeTime(raw: string): string {
  const s = raw.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).trim();
  if (!s || /^-+$/.test(s)) return "";
  const m = s.match(/^(\d{1,2})[:.](\d{2})/);
  if (!m) return "";
  return `${m[1].padStart(2, "0")}:${m[2]}`;
}

export interface ParsedClassRow {
  classCode: string;
  levelRaw: string;
  level: string;
  textbook: string;
  teacherName: string;
  days: string[];
  startTime: string;
  room: string;
  startsOn: string;
  endsOn: string;
  scheduleFa: string;
  titleFa: string;
}

/** Parses the workbook/csv buffer into class rows. */
export function parseClassSheet(buf: Buffer): { rows: ParsedClassRow[]; skipped: number } {
  const wb = XLSX.read(buf, { type: "buffer", raw: false });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const grid: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, blankrows: true, defval: "" });

  // Find the header row: contains both a "Code" and a "Teacher" column.
  let headerIdx = -1;
  for (let i = 0; i < Math.min(grid.length, 30); i++) {
    const cells = (grid[i] || []).map((c) => String(c ?? "").trim().toLowerCase());
    if (cells.some((c) => c === "code") && cells.some((c) => c.startsWith("teacher"))) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx < 0) throw Object.assign(new Error("header_not_found"), { statusCode: 400 });

  const header = (grid[headerIdx] || []).map((c) => String(c ?? "").trim());
  const find = (pred: (c: string) => boolean) => header.findIndex((c) => c && pred(c));
  const iCode = find((c) => c.toLowerCase() === "code");
  const iLevel = find((c) => c.toLowerCase() === "level");
  const iBook = find((c) => /^text ?book/i.test(c) || /^book/i.test(c));
  const iTeacher = find((c) => /^teacher/i.test(c));
  const iRoom = find((c) => /^room/i.test(c));
  const iStart = find((c) => /^start/i.test(c));
  const iEnd = find((c) => /^(final|end)/i.test(c));
  const dayIdx = DAY_KEYS.map((d) => ({ ...d, idx: find((c) => d.match.test(c)) }));

  const rows: ParsedClassRow[] = [];
  let skipped = 0;

  for (let r = headerIdx + 1; r < grid.length; r++) {
    const row = grid[r] || [];
    const classCode = cell(row, iCode);
    const teacherName = cell(row, iTeacher);
    if (!classCode || !teacherName) { if (row.some((c) => String(c ?? "").trim())) skipped++; continue; }

    const days: string[] = [];
    let startTime = "";
    for (const d of dayIdx) {
      const t = normalizeTime(cell(row, d.idx));
      if (!t) continue;
      days.push(d.key);
      if (!startTime) startTime = t;
    }

    const levelRaw = cell(row, iLevel);
    const textbook = cell(row, iBook);
    const room = cell(row, iRoom);
    const startsOn = parseJalaliDate(cell(row, iStart));
    const endsOn = parseJalaliDate(cell(row, iEnd));
    const dayNames = dayIdx.filter((d) => days.includes(d.key)).map((d) => d.fa).join(" و ");
    const scheduleFa = [
      dayNames ? `${dayNames}` : "",
      startTime ? `ساعت ${startTime}` : "",
      room ? `کلاس ${room}` : "",
    ].filter(Boolean).join(" — ");

    rows.push({
      classCode,
      levelRaw,
      level: mapLevel(levelRaw),
      textbook,
      teacherName,
      days,
      startTime,
      room,
      startsOn,
      endsOn,
      scheduleFa,
      titleFa: [textbook || levelRaw || "کلاس", `(${classCode})`].join(" "),
    });
  }

  return { rows, skipped };
}

/** Loose Persian/Latin normalization for name matching. */
function norm(s: string): string {
  return String(s || "")
    .replace(/[\u200c\u200f\u200e]/g, "")
    .replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/[ۀة]/g, "ه")
    .replace(/[^\p{L}\p{N}]/gu, "")
    .toLowerCase();
}

/** Returns the id of the best loose match, or "" when nothing is close enough. */
function bestMatch(needle: string, items: Array<{ id: string; labels: string[] }>): string {
  const n = norm(needle);
  if (!n) return "";
  let exact = "", partial = "";
  for (const it of items) {
    for (const raw of it.labels) {
      const l = norm(raw);
      if (!l) continue;
      if (l === n) return it.id;
      if (!exact && (l.includes(n) || n.includes(l)) && Math.min(l.length, n.length) >= 3) {
        if (!partial) partial = it.id;
      }
    }
  }
  return exact || partial;
}

const CommitBody = z.object({
  rows: z.array(z.object({
    classCode: z.string().min(1).max(60),
    level: z.string().max(40).default("pre-a"),
    titleFa: z.string().min(1).max(200),
    teacherName: z.string().max(120).default(""),
    teacherId: z.string().max(60).default(""),
    bookIds: z.array(z.string().max(60)).default([]),
    days: z.array(z.string().max(20)).default([]),
    startTime: z.string().max(10).default(""),
    scheduleFa: z.string().max(500).default(""),
    startsOn: z.string().max(20).default(""),
    endsOn: z.string().max(20).default(""),
  })).min(1).max(500),
  priceToman: z.number().int().min(0).default(0),
  capacity: z.number().int().min(0).default(0),
  mode: z.enum(["in-person", "online", "hybrid"]).default("in-person"),
  status: z.enum(["open", "closed", "archived"]).default("open"),
  createTeachers: z.boolean().default(true),
  updateExisting: z.boolean().default(true),
  fallbackStartsOn: z.string().max(20).default(""),
  fallbackEndsOn: z.string().max(20).default(""),
});

export async function registerImportRoutes(app: FastifyInstance) {
  // Step 1 — parse the uploaded file and report what will happen.
  app.post("/import/classes/preview", { preHandler: requireStaff }, async (req, reply) => {
    const file = await (req as any).file();
    if (!file) return reply.code(400).send({ error: "no_file" });
    const name = String(file.filename || "").toLowerCase();
    if (!/\.(xls|xlsx|csv)$/.test(name)) return reply.code(400).send({ error: "bad_type" });

    const buf = await file.toBuffer();
    let parsed;
    try { parsed = parseClassSheet(buf); }
    catch (e: any) {
      if (e?.message === "header_not_found") return reply.code(400).send({ error: "header_not_found" });
      return reply.code(400).send({ error: "parse_failed", message: String(e?.message || e) });
    }

    const teacherNames = Array.from(new Set(parsed.rows.map((r) => r.teacherName).filter(Boolean)));
    const allTeachers = await prisma.teacher.findMany({ select: { id: true, nameFa: true, nameEn: true } });
    const allBooks = await prisma.book.findMany({ select: { id: true, titleFa: true, titleEn: true } });

    const teacherCandidates = allTeachers.map((t) => ({ id: t.id, labels: [t.nameFa, (t as any).nameEn || ""] }));
    const bookCandidates = allBooks.map((b) => ({ id: b.id, labels: [b.titleFa, b.titleEn || ""] }));

    const teacherSuggest: Record<string, string> = {};
    for (const n of teacherNames) teacherSuggest[n] = bestMatch(n, teacherCandidates);

    const textbooks = Array.from(new Set(parsed.rows.map((r) => r.textbook).filter(Boolean)));
    const bookSuggest: Record<string, string> = {};
    for (const t of textbooks) bookSuggest[t] = bestMatch(t, bookCandidates);

    const codes = parsed.rows.map((r) => r.classCode);
    const existingSemesters = await prisma.semester.findMany({ where: { classCode: { in: codes } }, select: { classCode: true } });
    const existingCodes = new Set(existingSemesters.map((s) => s.classCode));

    return {
      rows: parsed.rows.map((r) => ({
        ...r,
        teacherExists: !!teacherSuggest[r.teacherName],
        classExists: existingCodes.has(r.classCode),
      })),
      skipped: parsed.skipped,
      newTeachers: teacherNames.filter((n) => !teacherSuggest[n]),
      existingCount: existingCodes.size,
      teacherNames,
      textbooks,
      teacherSuggest,
      bookSuggest,
      teachers: allTeachers.map((t) => ({ id: t.id, nameFa: t.nameFa })),
      books: allBooks.map((b) => ({ id: b.id, titleFa: b.titleFa, titleEn: b.titleEn || "" })),
    };
  });

  // Step 2 — write the confirmed rows into the database.
  app.post("/import/classes", { preHandler: requireStaff }, async (req, reply) => {
    const parsed = CommitBody.safeParse(req.body);
    if (!parsed.success) return reply.code(400).send({ error: parsed.error.flatten() });
    const b = parsed.data;

    // Resolve / create teachers once. Rows that carry an explicit teacherId (chosen
    // in the preview) skip name matching entirely.
    const names = Array.from(new Set(
      b.rows.filter((r) => !r.teacherId).map((r) => r.teacherName.trim()).filter(Boolean),
    ));
    const teacherIdByName = new Map<string, string>();
    const found = await prisma.teacher.findMany({ where: { nameFa: { in: names } }, select: { id: true, nameFa: true } });
    for (const t of found) teacherIdByName.set(t.nameFa, t.id);
    let createdTeachers = 0;
    if (b.createTeachers) {
      for (const n of names) {
        if (teacherIdByName.has(n)) continue;
        const t = await prisma.teacher.create({ data: { nameFa: n } });
        teacherIdByName.set(n, t.id);
        createdTeachers++;
      }
    }

    let created = 0, updated = 0, skipped = 0;
    const errors: Array<{ classCode: string; message: string }> = [];

    for (const r of b.rows) {
      const startsOn = r.startsOn || b.fallbackStartsOn;
      const endsOn = r.endsOn || b.fallbackEndsOn;
      if (!startsOn || !endsOn) { skipped++; errors.push({ classCode: r.classCode, message: "تاریخ شروع/پایان نامعتبر است" }); continue; }
      const teacherId = r.teacherId || teacherIdByName.get(r.teacherName.trim());
      const data: any = {
        classCode: r.classCode,
        titleFa: r.titleFa,
        level: r.level,
        bookIds: r.bookIds ?? [],
        teacherIds: teacherId ? [teacherId] : [],
        groups: teacherId ? [{ teacherId, classCode: r.classCode, capacity: b.capacity }] : [],
        scheduleFa: r.scheduleFa,
        days: r.days,
        startTime: r.startTime,
        startsOn: new Date(`${startsOn}T00:00:00Z`),
        endsOn: new Date(`${endsOn}T00:00:00Z`),
        capacity: b.capacity,
        priceToman: b.priceToman,
        mode: b.mode,
        status: b.status,
      };
      try {
        const existing = await prisma.semester.findUnique({ where: { classCode: r.classCode }, select: { id: true } });
        if (existing) {
          if (!b.updateExisting) { skipped++; continue; }
          await prisma.semester.update({ where: { id: existing.id }, data });
          updated++;
        } else {
          await prisma.semester.create({ data: { ...data, seatsTaken: 0 } });
          created++;
        }
      } catch (e: any) {
        skipped++;
        errors.push({ classCode: r.classCode, message: String(e?.message || e).slice(0, 200) });
      }
    }

    return { created, updated, skipped, createdTeachers, errors: errors.slice(0, 30) };
  });
}
