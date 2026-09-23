import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { FileSpreadsheet, Upload, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { importApi, type ImportClassRow, type ImportPreview, type ImportResult } from "@/lib/api";
import { levelLabel } from "@/lib/levels";
import { formatJalali } from "@/lib/jalali";
import JalaliDateInput from "@/components/JalaliDateInput";

const DAY_FA: Record<string, string> = {
  saturday: "شنبه", sunday: "یکشنبه", monday: "دوشنبه", tuesday: "سه‌شنبه",
  wednesday: "چهارشنبه", thursday: "پنجشنبه", friday: "جمعه",
};

export default function ImportAdmin() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const [priceToman, setPriceToman] = useState(0);
  const [capacity, setCapacity] = useState(12);
  const [mode, setMode] = useState<"in-person" | "online" | "hybrid">("in-person");
  const [status, setStatus] = useState<"open" | "closed" | "archived">("open");
  const [createTeachers, setCreateTeachers] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [fallbackStartsOn, setFallbackStartsOn] = useState("");
  const [fallbackEndsOn, setFallbackEndsOn] = useState("");

  // name in the file -> chosen teacher id ("" = create/keep by name, "-" = none)
  const [teacherMap, setTeacherMap] = useState<Record<string, string>>({});
  // textbook name in the file -> chosen book id ("" = none)
  const [bookMap, setBookMap] = useState<Record<string, string>>({});

  const missingDates = useMemo(
    () => (preview?.rows ?? []).filter(r => !r.startsOn || !r.endsOn).length,
    [preview],
  );

  async function onPick(file: File | undefined) {
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setPreview(null);
    setLoading(true);
    try {
      const p = await importApi.previewClasses(file);
      setPreview(p);
      setTeacherMap({ ...(p.teacherSuggest ?? {}) });
      setBookMap({ ...(p.bookSuggest ?? {}) });
      if (!p.rows.length) toast.error("هیچ ردیف معتبری در فایل پیدا نشد.");
      else toast.success(`${p.rows.length.toLocaleString("fa-IR")} کلاس در فایل شناسایی شد.`);
    } catch (e: any) {
      toast.error(e?.message || "خواندن فایل ناموفق بود.");
    } finally {
      setLoading(false);
    }
  }

  async function commit() {
    if (!preview?.rows.length) return;
    setCommitting(true);
    try {
      const res = await importApi.commitClasses({
        rows: preview.rows.map(r => {
          const t = teacherMap[r.teacherName] ?? "";
          const bookId = bookMap[r.textbook] ?? "";
          return {
            ...r,
            teacherId: t === "-" ? "" : t,
            teacherName: t === "-" ? "" : r.teacherName,
            bookIds: bookId ? [bookId] : [],
          };
        }),
        priceToman, capacity, mode, status,
        createTeachers, updateExisting,
        fallbackStartsOn, fallbackEndsOn,
      });
      setResult(res);
      toast.success(`${res.created.toLocaleString("fa-IR")} کلاس جدید و ${res.updated.toLocaleString("fa-IR")} به‌روزرسانی شد.`);
    } catch (e: any) {
      toast.error(e?.message || "ثبت اطلاعات ناموفق بود.");
    } finally {
      setCommitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-black text-primary">ورود اطلاعات از فایل</h1>
        <p className="text-sm text-foreground/70 mt-1">
          فایل لیست کلاس‌های ترم (xls، xlsx یا csv) را بارگذاری کنید. ستون‌های Code، Level، Textbook،
          Teacher، روزهای هفته، Room، Start و Final به‌صورت خودکار خوانده می‌شوند.
        </p>
      </header>

      {/* Upload */}
      <div className="hg-card p-6">
        <input
          ref={fileRef}
          type="file"
          accept=".xls,.xlsx,.csv"
          className="hidden"
          onChange={e => onPick(e.target.files?.[0])}
        />
        <div className="flex flex-wrap items-center gap-4">
          <button className="btn-primary" onClick={() => fileRef.current?.click()} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            انتخاب فایل
          </button>
          {fileName && (
            <span className="flex items-center gap-2 text-sm text-foreground/75">
              <FileSpreadsheet className="h-4 w-4 text-gold" /> {fileName}
            </span>
          )}
        </div>
      </div>

      {preview && (
        <>
          {/* Summary + options */}
          <div className="hg-card p-6 space-y-5">
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label="کلاس‌های فایل" value={preview.rows.length} />
              <Stat label="از قبل موجود" value={preview.existingCount} />
              <Stat label="اساتید جدید" value={preview.newTeachers.length} />
              <Stat label="ردیف‌های نامعتبر" value={preview.skipped} />
            </div>

            {preview.newTeachers.length > 0 && (
              <p className="text-sm text-foreground/75 leading-relaxed">
                اساتید تازه در فایل: <strong>{preview.newTeachers.join("، ")}</strong>
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="شهریه هر کلاس (تومان)">
                <input type="number" min={0} className="hg-input" value={priceToman}
                       onChange={e => setPriceToman(Math.max(0, +e.target.value))} />
              </Field>
              <Field label="ظرفیت هر کلاس">
                <input type="number" min={0} className="hg-input" value={capacity}
                       onChange={e => setCapacity(Math.max(0, +e.target.value))} />
              </Field>
              <Field label="نحوهٔ برگزاری">
                <select className="hg-input" value={mode} onChange={e => setMode(e.target.value as any)}>
                  <option value="in-person">حضوری</option>
                  <option value="online">آنلاین</option>
                  <option value="hybrid">ترکیبی</option>
                </select>
              </Field>
              <Field label="وضعیت">
                <select className="hg-input" value={status} onChange={e => setStatus(e.target.value as any)}>
                  <option value="open">باز</option>
                  <option value="closed">بسته</option>
                  <option value="archived">بایگانی</option>
                </select>
              </Field>
            </div>

            {missingDates > 0 && (
              <div className="rounded-xl border-2 border-gold/40 bg-gold/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-primary">
                  <AlertTriangle className="h-4 w-4 text-gold" />
                  {missingDates.toLocaleString("fa-IR")} ردیف تاریخ معتبر ندارد — تاریخ جایگزین را مشخص کنید.
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="تاریخ شروع جایگزین">
                    <JalaliDateInput value={fallbackStartsOn} onChange={setFallbackStartsOn} />
                  </Field>
                  <Field label="تاریخ پایان جایگزین">
                    <JalaliDateInput value={fallbackEndsOn} onChange={setFallbackEndsOn} />
                  </Field>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-6">
              <Check label="ساخت خودکار استادهای جدید" checked={createTeachers} onChange={setCreateTeachers} />
              <Check label="به‌روزرسانی کلاس‌هایی که کدشان از قبل هست" checked={updateExisting} onChange={setUpdateExisting} />
            </div>

            <button className="btn-gold" onClick={commit} disabled={committing || !preview.rows.length}>
              {committing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              ثبت {preview.rows.length.toLocaleString("fa-IR")} کلاس در سایت
            </button>
          </div>

          {/* Preview table */}
          <div className="hg-card p-0 overflow-hidden">
            <div className="overflow-x-auto max-h-[28rem]">
              <table className="w-full text-sm">
                <thead className="bg-primary text-primary-foreground sticky top-0">
                  <tr>
                    {["کد کلاس", "سطح", "کتاب", "استاد", "روزها", "ساعت", "کلاس", "شروع", "پایان", "وضعیت"].map(h => (
                      <th key={h} className="px-3 py-2 text-start font-bold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => <Row key={`${r.classCode}-${i}`} r={r} />)}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {result && (
        <div className="hg-card p-6 space-y-3">
          <h2 className="font-display text-xl font-black text-primary">نتیجهٔ ثبت</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            <Stat label="کلاس جدید" value={result.created} />
            <Stat label="به‌روزرسانی" value={result.updated} />
            <Stat label="رد شده" value={result.skipped} />
            <Stat label="استاد جدید" value={result.createdTeachers} />
          </div>
          {result.errors.length > 0 && (
            <ul className="text-sm text-destructive space-y-1">
              {result.errors.map((e, i) => <li key={i}>{e.classCode}: {e.message}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ r }: { r: ImportClassRow }) {
  return (
    <tr className="border-b border-primary/10">
      <td className="px-3 py-2 font-bold whitespace-nowrap">{r.classCode}</td>
      <td className="px-3 py-2 whitespace-nowrap">{levelLabel(r.level)} <span className="text-foreground/50">({r.levelRaw})</span></td>
      <td className="px-3 py-2 whitespace-nowrap">{r.textbook || "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">
        {r.teacherName}
        {!r.teacherExists && <span className="chip-gold ms-2 text-[10px]">جدید</span>}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">{r.days.map(d => DAY_FA[d] ?? d).join("، ") || "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">{r.startTime || "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">{r.room || "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">{r.startsOn ? formatJalali(r.startsOn) : "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">{r.endsOn ? formatJalali(r.endsOn) : "—"}</td>
      <td className="px-3 py-2 whitespace-nowrap">
        {r.classExists ? <span className="chip text-[10px]">به‌روزرسانی</span> : <span className="chip-gold text-[10px]">جدید</span>}
      </td>
    </tr>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-parchment border border-primary/10 p-4">
      <div className="text-xs text-foreground/60">{label}</div>
      <div className="font-display text-2xl font-black text-primary">{value.toLocaleString("fa-IR")}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-foreground/70 mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold text-foreground/80">
      <input type="checkbox" className="h-4 w-4 accent-[hsl(var(--gold))]" checked={checked}
             onChange={e => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
