import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationsApi, semestersApi, teachersApi, booksApi } from "@/lib/api";
import { formatJalali } from "@/lib/jalali";
import type { Registration, Semester } from "@/lib/types";
import { Search, Download, Printer, X, ClipboardList, GraduationCap, Users, TrendingUp, Wallet, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { formatToman } from "@/lib/api";

const STATUSES = ["new", "contacted", "enrolled", "rejected"] as const;
const STATUS_FA: Record<string, string> = {
  new: "جدید", contacted: "تماس گرفته شد", enrolled: "ثبت‌نام قطعی", rejected: "رد شده",
};

function csvEscape(v: any): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows: Record<string, any>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const body = rows.map(r => headers.map(h => csvEscape(r[h])).join(",")).join("\n");
  return "\uFEFF" + headers.join(",") + "\n" + body;
}

function download(name: string, mime: string, content: BlobPart) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

export default function RegistrationsAdmin() {
  const qc = useQueryClient();
  const { data: regs = [] } = useQuery({ queryKey: ["registrations"], queryFn: () => registrationsApi.list() });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: () => semestersApi.list() });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });
  const { data: books = [] } = useQuery({ queryKey: ["books"], queryFn: () => booksApi.list() });

  const [q, setQ] = useState("");
  const [semesterId, setSemesterId] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [payFilter, setPayFilter] = useState<"" | "paid" | "unpaid">("");
  const [classCode, setClassCode] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "name" | "semester">("date-desc");
  const [selected, setSelected] = useState<Registration | null>(null);

  const semById = useMemo(() => new Map(semesters.map(s => [s.id, s])), [semesters]);

  const filtered = useMemo(() => {
    let out = regs.filter(r => {
      if (semesterId && r.semesterId !== semesterId) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (payFilter === "paid" && !(r.paidToman && r.paidToman > 0)) return false;
      if (payFilter === "unpaid" && r.paidToman && r.paidToman > 0) return false;
      if (classCode) {
        const s = r.semesterId ? semById.get(r.semesterId) : null;
        if (!s?.classCode?.toLowerCase().includes(classCode.toLowerCase())) return false;
      }
      if (from && r.createdAt.slice(0, 10) < from) return false;
      if (to && r.createdAt.slice(0, 10) > to) return false;
      if (q) {
        const hay = `${r.fullName} ${r.phone} ${r.nationalId ?? ""} ${r.landline ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
    switch (sortBy) {
      case "date-asc": out = [...out].sort((a, b) => a.createdAt.localeCompare(b.createdAt)); break;
      case "date-desc": out = [...out].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); break;
      case "name": out = [...out].sort((a, b) => a.fullName.localeCompare(b.fullName, "fa")); break;
      case "semester": out = [...out].sort((a, b) => {
        const ac = (a.semesterId && semById.get(a.semesterId)?.classCode) || "";
        const bc = (b.semesterId && semById.get(b.semesterId)?.classCode) || "";
        return ac.localeCompare(bc);
      }); break;
    }
    return out;
  }, [regs, q, semesterId, statusFilter, payFilter, classCode, from, to, sortBy, semById]);

  // Metrics
  const total = regs.length;
  const enrolled = regs.filter(r => r.status === "enrolled").length;
  const unpaid = regs.filter(r => !r.paidToman || r.paidToman === 0).length;
  const uniqueClasses = new Set(regs.map(r => r.semesterId).filter(Boolean)).size;
  const totalPaid = regs.reduce((s, r) => s + (r.paidToman || 0), 0);

  async function update(id: string, s: any) {
    await registrationsApi.updateStatus(id, s);
    qc.invalidateQueries({ queryKey: ["registrations"] });
  }

  async function remove(id: string) {
    if (!confirm("حذف این ثبت‌نام؟")) return;
    try {
      await registrationsApi.remove(id);
      qc.invalidateQueries({ queryKey: ["registrations"] });
      setSelected(null);
      toast.success("ثبت‌نام حذف شد");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "حذف انجام نشد");
    }
  }

  function exportCSV(rows: Registration[]) {
    const mapped = rows.map(r => {
      const s = r.semesterId ? semById.get(r.semesterId) : null;
      return {
        "کد کلاس": s?.classCode ?? "",
        "دوره": s?.titleFa ?? r.levelInterest ?? "",
        "نام و نام خانوادگی": r.fullName,
        "نام پدر": r.fatherName ?? "",
        "کد ملی": r.nationalId ?? "",
        "شماره شناسنامه": r.birthCertNo ?? "",
        "محل تولد": r.birthPlace ?? "",
        "سال تولد": r.issuedFrom ?? "",
        "همراه": r.phone,
        "تلفن ثابت": r.landline ?? "",
        "آدرس": r.address ?? "",
        "مدرک مدرسه": r.schoolDegree ?? "",
        "مدرک دانشگاه": r.universityDegree ?? "",
        "استاد انتخابی": teachers.find(t => t.id === r.selectedTeacherId)?.nameFa ?? "",
        "کتاب انتخابی": books.find(b => b.id === r.selectedBookId)?.titleFa ?? "",
        "یادداشت": r.note ?? "",
        "مبلغ پرداختی (تومان)": r.paidToman ?? 0,
        "کد پیگیری پرداخت": r.paymentRef ?? "",
        "وضعیت": STATUS_FA[r.status] ?? r.status,
        "تاریخ ثبت": formatJalali(r.createdAt.slice(0, 10)),
      };
    });
    download(`registrations-${new Date().toISOString().slice(0, 10)}.csv`, "text/csv;charset=utf-8", toCSV(mapped));
    toast.success(`${mapped.length} رکورد صادر شد`);
  }

  function printOne(r: Registration) {
    openPrint(renderPrintHTML([r], semById, teachers, books));
  }

  function printAll() {
    openPrint(renderPrintHTML(filtered, semById, teachers, books));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl text-primary">درخواست‌های ثبت‌نام</h1>
        <div className="flex gap-2">
          <button onClick={() => exportCSV(filtered)} className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold hover:bg-primary/90">
            <Download className="h-4 w-4" /> خروجی CSV
          </button>
          <button onClick={printAll} className="inline-flex items-center gap-2 rounded-lg bg-gold text-gold-foreground px-4 py-2 text-sm font-bold hover:bg-gold/90">
            <Printer className="h-4 w-4" /> چاپ گروهی
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid md:grid-cols-5 gap-4 mb-6">
        <Metric icon={<ClipboardList />} label="کل ثبت‌نام‌ها" value={total} />
        <Metric icon={<AlertCircle />} label="پرداخت‌نشده (پیگیری)" value={unpaid} accent />
        <Metric icon={<Users />} label="قطعی (پرداخت‌شده)" value={enrolled} />
        <Metric icon={<GraduationCap />} label="کلاس‌های فعال" value={uniqueClasses} />
        <Metric icon={<Wallet />} label="مجموع پرداختی (تومان)" value={totalPaid} />
      </div>

      {/* Filters */}
      <div className="bg-card rounded-2xl p-4 border border-primary/10 mb-4 grid md:grid-cols-6 gap-3">
        <div className="relative md:col-span-2">
          <Search className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="جستجو نام، تلفن، کد ملی…" className="w-full rounded-lg bg-parchment border border-primary/15 pr-9 pl-3 py-2 text-sm" />
        </div>
        <select value={semesterId} onChange={e => setSemesterId(e.target.value)} className="rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm">
          <option value="">همه کلاس‌ها</option>
          {semesters.map(s => <option key={s.id} value={s.id}>{s.titleFa}{s.classCode ? ` (${s.classCode})` : ""}</option>)}
        </select>
        <input value={classCode} onChange={e => setClassCode(e.target.value)} placeholder="کد کلاس" className="rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm" />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm">
          <option value="">همه وضعیت‌ها</option>
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_FA[s]}</option>)}
        </select>
        <select value={payFilter} onChange={e => setPayFilter(e.target.value as any)} className="rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm">
          <option value="">پرداخت — همه</option>
          <option value="unpaid">فقط پرداخت‌نشده</option>
          <option value="paid">فقط پرداخت‌شده</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm">
          <option value="date-desc">جدیدترین</option>
          <option value="date-asc">قدیمی‌ترین</option>
          <option value="name">نام</option>
          <option value="semester">کد کلاس</option>
        </select>
        <div className="flex gap-2 md:col-span-3">
          <label className="text-xs text-muted-foreground self-center">از</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="rounded-lg bg-parchment border border-primary/15 px-2 py-2 text-sm flex-1" />
          <label className="text-xs text-muted-foreground self-center">تا</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="rounded-lg bg-parchment border border-primary/15 px-2 py-2 text-sm flex-1" />
        </div>
        <div className="md:col-span-3 text-sm text-muted-foreground self-center">
          نمایش <b className="text-primary">{filtered.length.toLocaleString("fa-IR")}</b> از {total.toLocaleString("fa-IR")} رکورد
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-primary/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary/5 text-right">
              <tr>
                <th className="p-3">تاریخ</th>
                <th className="p-3">کد کلاس</th>
                <th className="p-3">نام</th>
                <th className="p-3">تلفن</th>
                <th className="p-3">دوره</th>
                <th className="p-3">پرداختی</th>
                <th className="p-3">وضعیت</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const s = r.semesterId ? semById.get(r.semesterId) : null;
                const paid = r.paidToman || 0;
                return (
                  <tr key={r.id} className={`border-t border-primary/5 hover:bg-parchment/50 ${paid === 0 ? "bg-destructive/[0.04]" : ""}`}>
                    <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">{formatJalali(r.createdAt.slice(0, 10))}</td>
                    <td className="p-3 font-mono text-xs text-turquoise font-bold">{s?.classCode || "—"}</td>
                    <td className="p-3 font-bold text-primary">{r.fullName}</td>
                    <td className="p-3" dir="ltr">{r.phone}</td>
                    <td className="p-3 text-muted-foreground">{s?.titleFa ?? r.levelInterest ?? "—"}</td>
                    <td className="p-3 whitespace-nowrap">
                      {paid > 0
                        ? <span className="inline-flex items-center gap-1 rounded-md bg-turquoise/15 text-turquoise font-bold px-2 py-0.5 text-xs">{formatToman(paid)}</span>
                        : <span className="inline-flex items-center gap-1 rounded-md bg-destructive/15 text-destructive font-bold px-2 py-0.5 text-xs"><AlertCircle className="h-3 w-3" /> پرداخت‌نشده</span>}
                    </td>
                    <td className="p-3">
                      <select value={r.status} onChange={e => update(r.id, e.target.value)} className="rounded-lg bg-parchment border border-primary/15 px-2 py-1 text-xs">
                        {STATUSES.map(s2 => <option key={s2} value={s2}>{STATUS_FA[s2]}</option>)}
                      </select>
                    </td>
                    <td className="p-3 text-left whitespace-nowrap">
                      <button onClick={() => setSelected(r)} className="text-xs font-bold text-primary hover:text-gold px-2">مشاهده</button>
                      <button onClick={() => printOne(r)} className="text-xs font-bold text-primary hover:text-gold px-2">چاپ</button>
                      <button onClick={() => remove(r.id)} className="inline-flex items-center gap-1 text-xs font-bold text-destructive hover:text-destructive/80 px-2" title="حذف ثبت‌نام">
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">رکوردی مطابق فیلترها یافت نشد.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <DetailDrawer
          reg={selected}
          semester={selected.semesterId ? semById.get(selected.semesterId) ?? null : null}
          teacherName={teachers.find(t => t.id === selected.selectedTeacherId)?.nameFa ?? ""}
          bookTitle={books.find(b => b.id === selected.selectedBookId)?.titleFa ?? ""}
          onClose={() => setSelected(null)}
          onPrint={() => printOne(selected)}
          onDelete={() => remove(selected.id)}
        />
      )}
    </div>
  );
}

function Metric({ icon, label, value, accent }: any) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-gold/15 border-gold/40" : "bg-card border-primary/10"}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${accent ? "bg-gold text-gold-foreground" : "bg-primary/10 text-primary"}`}>{icon}</div>
      <div className="text-3xl font-black text-primary">{Number(value).toLocaleString("fa-IR")}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function DetailDrawer({ reg, semester, teacherName, bookTitle, onClose, onPrint, onDelete }: {
  reg: Registration; semester: Semester | null; teacherName: string; bookTitle: string;
  onClose: () => void; onPrint: () => void; onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-primary/40 backdrop-blur-sm" />
      <aside className="relative ms-auto w-full max-w-2xl bg-parchment h-full overflow-y-auto shadow-navy" onClick={e => e.stopPropagation()}>
        <header className="sticky top-0 bg-primary text-primary-foreground p-5 flex items-center justify-between z-10">
          <div>
            <div className="text-xs text-primary-foreground/70">جزئیات ثبت‌نام</div>
            <h2 className="text-xl font-black">{reg.fullName}</h2>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrint} className="inline-flex items-center gap-1 bg-gold text-gold-foreground px-3 py-2 rounded-lg text-xs font-bold"><Printer className="h-4 w-4" /> چاپ</button>
            <button onClick={onDelete} className="text-xs bg-destructive/20 text-primary-foreground hover:bg-destructive/40 px-3 py-2 rounded-lg">حذف</button>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg"><X className="h-5 w-5" /></button>
          </div>
        </header>
        <div className="p-6 space-y-6">
          {semester && (
            <div className="bg-card rounded-2xl p-4 border border-gold/30">
              <div className="flex items-baseline justify-between mb-2">
                <h3 className="font-black text-primary">{semester.titleFa}</h3>
                <span className="font-mono text-turquoise font-bold text-sm">{semester.classCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>شروع: {formatJalali(semester.startsOn)}</div>
                <div>پایان: {formatJalali(semester.endsOn)}</div>
                <div>برنامه: {semester.scheduleFa || "—"}</div>
                <div>حالت: {semester.mode}</div>
              </div>
            </div>
          )}
          <Section title="اطلاعات فردی">
            <Row k="نام و نام خانوادگی" v={reg.fullName} />
            <Row k="نام پدر" v={reg.fatherName} />
            <Row k="کد ملی / شماره شناسنامه" v={reg.nationalId || reg.birthCertNo} dir="ltr" />
            <Row k="محل تولد" v={reg.birthPlace} />
            <Row k="سال تولد" v={reg.issuedFrom} dir="ltr" />
            <Row k="پایه تحصیلی" v={reg.schoolDegree || reg.universityDegree} />
          </Section>
          <Section title="اطلاعات تماس">
            <Row k="همراه" v={reg.phone} dir="ltr" />
            <Row k="تلفن ثابت" v={reg.landline} dir="ltr" />
            <Row k="آدرس" v={reg.address} />
          </Section>
          <Section title="ثبت‌نام">
            <Row k="استاد انتخابی" v={teacherName} />
            <Row k="کتاب انتخابی" v={bookTitle} />
            <Row k="کلاس مورد نظر" v={reg.termInterest} />
            <Row k="سطح" v={reg.levelInterest} />
            <Row k="یادداشت" v={reg.note} />
            <Row k="تاریخ ثبت" v={formatJalali(reg.createdAt.slice(0, 10))} />
            <Row k="وضعیت" v={STATUS_FA[reg.status]} />
          </Section>
          <Section title="پرداخت">
            <Row k="مبلغ پرداختی" v={reg.paidToman ? formatToman(reg.paidToman) : "پرداخت‌نشده"} />
            <Row k="کد پیگیری پرداخت" v={reg.paymentRef} dir="ltr" />
            <Row k="تاریخ پرداخت" v={reg.paidAt ? formatJalali(reg.paidAt.slice(0, 10)) : "—"} />
          </Section>
        </div>
      </aside>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-primary/10">
      <h3 className="font-black text-primary mb-3 pb-2 border-b border-primary/10">{title}</h3>
      <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">{children}</dl>
    </div>
  );
}

function Row({ k, v, dir }: { k: string; v?: string; dir?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="font-bold text-primary" dir={dir}>{v || "—"}</dd>
    </div>
  );
}

// ---- Print ----
function openPrint(html: string) {
  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) return toast.error("پنجره چاپ باز نشد. لطفاً pop-up را اجازه دهید.");
  w.document.open(); w.document.write(html); w.document.close();
  w.onload = () => { w.focus(); w.print(); };
}

function renderPrintHTML(rows: Registration[], semById: Map<string, Semester>, teachers: any[], books: any[]): string {
  const style = `
    <style>
      @media print { @page { size: A4; margin: 12mm; } }
      body { font-family: Vazirmatn, Tahoma, sans-serif; direction: rtl; color: #0F2350; margin: 0; padding: 16px; }
      .rec { border: 1.5px solid #0F2350; border-radius: 12px; padding: 16px; margin-bottom: 14px; page-break-inside: avoid; }
      .head { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 2px solid #D4A017; padding-bottom: 8px; margin-bottom: 12px; }
      .head h2 { margin: 0; font-size: 18px; }
      .code { font-family: monospace; color: #2AA6A0; font-weight: 900; }
      .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; font-size: 12px; }
      .k { color: #666; font-size: 10px; display: block; }
      .v { font-weight: 700; }
      h3 { font-size: 12px; color: #D4A017; margin: 10px 0 6px; border-bottom: 1px dashed #ccc; padding-bottom: 4px; }
      .title { text-align: center; font-size: 20px; font-weight: 900; margin-bottom: 20px; }
      .subtitle { text-align: center; color: #666; font-size: 11px; margin-bottom: 20px; }
    </style>
  `;
  const items = rows.map(r => {
    const s = r.semesterId ? semById.get(r.semesterId) : null;
    const t = teachers.find(x => x.id === r.selectedTeacherId)?.nameFa ?? "";
    const b = books.find(x => x.id === r.selectedBookId)?.titleFa ?? "";
    const row = (k: string, v?: string) => `<div><span class="k">${k}</span><span class="v">${v || "—"}</span></div>`;
    return `
      <div class="rec">
        <div class="head">
          <h2>${r.fullName}</h2>
          <span class="code">${s?.classCode || ""}</span>
        </div>
        <h3>دوره</h3>
        <div class="grid">
          ${row("عنوان دوره", s?.titleFa ?? r.levelInterest)}
          ${row("تاریخ ثبت", formatJalali(r.createdAt.slice(0, 10)))}
          ${row("استاد انتخابی", t)}
          ${row("کتاب انتخابی", b)}
        </div>
        <h3>اطلاعات فردی</h3>
        <div class="grid">
          ${row("نام پدر", r.fatherName)}
          ${row("کد ملی / شناسنامه", r.nationalId || r.birthCertNo)}
          ${row("محل تولد", r.birthPlace)}
          ${row("سال تولد", r.issuedFrom)}
          ${row("پایه تحصیلی", r.schoolDegree || r.universityDegree)}
        </div>
        <h3>تماس</h3>
        <div class="grid">
          ${row("همراه", r.phone)}
          ${row("تلفن ثابت", r.landline)}
          <div style="grid-column:1/-1">${row("آدرس", r.address)}</div>
          <div style="grid-column:1/-1">${row("یادداشت", r.note)}</div>
        </div>
        <h3>پرداخت</h3>
        <div class="grid">
          ${row("مبلغ پرداختی", r.paidToman ? formatToman(r.paidToman) : "پرداخت‌نشده")}
          ${row("کد پیگیری", r.paymentRef)}
          ${row("تاریخ پرداخت", r.paidAt ? formatJalali(r.paidAt.slice(0, 10)) : "—")}
        </div>
      </div>`;
  }).join("");
  return `<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>ثبت‌نام‌ها — HiGooya</title>${style}</head>
    <body>
      <div class="title">آموزشگاه زبان گویا — فرم ثبت‌نام</div>
      <div class="subtitle">تعداد: ${rows.length.toLocaleString("fa-IR")} — تاریخ چاپ: ${formatJalali(new Date().toISOString().slice(0, 10))}</div>
      ${items}
    </body></html>`;
}
