import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { semestersApi, teachersApi, booksApi, formatToman } from "@/lib/api";
import type { Semester } from "@/lib/types";
import { formatJalali } from "@/lib/jalali";
import JalaliDateInput from "@/components/JalaliDateInput";
import { WEEKDAYS } from "@/lib/terms";
import { LEVELS, levelLabel } from "@/lib/levels";

import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const empty = {
  classCode: "",
  titleFa: "", level: "pre-a" as any, teacherIds: [] as string[],
  groups: [] as Array<{ teacherId: string; classCode: string; capacity: number }>,
  bookIds: [] as string[],
  scheduleFa: "", days: [] as string[], startTime: "", startsOn: "", endsOn: "",
  capacity: 12, priceToman: 0, mode: "in-person" as any, status: "open" as any,
};

// Keep one group (class code + capacity) per selected teacher.
function syncGroups(teacherIds: string[], groups: any[] = [], form: any) {
  const base = (form?.classCode || "").trim();
  return teacherIds.map((tid, i) => {
    const cur = (groups || []).find((g: any) => g.teacherId === tid);
    if (cur) return cur;
    return {
      teacherId: tid,
      classCode: base ? `${base}-${i + 1}` : "",
      capacity: Number(form?.capacity) || 0,
    };
  });
}


export default function SemestersAdmin() {
  const qc = useQueryClient();
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: () => semestersApi.list() });
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });
  const { data: books = [] } = useQuery({ queryKey: ["books"], queryFn: () => booksApi.list() });
  const [editing, setEditing] = useState<Semester | null>(null);
  const [form, setForm] = useState<any>(empty);
  const [open, setOpen] = useState(false);

  function openModal(s?: Semester) {
    if (s) {
      setEditing(s);
      const legacyTeacherId = (s as any).teacherId;
      const ids = s.teacherIds && s.teacherIds.length ? s.teacherIds : (legacyTeacherId ? [legacyTeacherId] : []);
      setForm({
        ...s,
        teacherIds: ids,
        groups: syncGroups(ids, (s as any).groups ?? [], s),
        bookIds: s.bookIds ?? [],
        days: s.days ?? [],
        startTime: s.startTime ?? "",
      });
    } else { setEditing(null); setForm(empty); }
    setOpen(true);
  }
  async function save() {
    if (!form.titleFa || !form.startsOn || !form.endsOn) return toast.error("عنوان و تاریخ‌ها الزامی است");
    const { id, createdAt, seatsTaken, jalaliYear, season, teacherId, ...rest } = form as any;
    const groups = syncGroups(form.teacherIds || [], form.groups || [], form).map((g: any) => ({
      teacherId: g.teacherId,
      classCode: String(g.classCode || "").trim(),
      capacity: Number(g.capacity) || 0,
    }));
    const payload = {
      ...rest,
      classCode: (form.classCode || "").trim(),
      teacherIds: form.teacherIds || [],
      groups,
      bookIds: form.bookIds || [],

      capacity: Number(form.capacity) || 0,
      priceToman: Number(form.priceToman) || 0,
    };
    try {
      if (editing) await semestersApi.update(editing.id, payload);
      else await semestersApi.create(payload);
      qc.invalidateQueries({ queryKey: ["semesters"] });
      setOpen(false);
      toast.success("ذخیره شد");
    } catch (e: any) {
      console.error("save semester failed", e);
      toast.error(e?.message || "ذخیره ناموفق بود");
    }
  }
  async function del(id: string) {
    if (!confirm("حذف شود؟")) return;
    await semestersApi.remove(id);
    qc.invalidateQueries({ queryKey: ["semesters"] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-primary">کلاس‌ها</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="h-4 w-4" /> افزودن کلاس</button>
      </div>
      <div className="bg-card rounded-3xl border border-primary/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-right">
            <tr>
              <th className="p-3">کد کلاس</th>
              <th className="p-3">عنوان</th><th className="p-3">استاد</th>
              <th className="p-3">شروع</th><th className="p-3">قیمت</th>
              <th className="p-3">ظرفیت</th><th className="p-3">وضعیت</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {semesters.map(s => {
              const teacherIds = s.teacherIds?.length ? s.teacherIds : ((s as any).teacherId ? [(s as any).teacherId] : []);
              const teacherNames = teacherIds.map(id => teachers.find(t => t.id === id)?.nameFa).filter(Boolean).join("، ");
              return (
              <tr key={s.id} className="border-t border-primary/5">
                <td className="p-3 font-mono text-xs text-turquoise font-bold">
                  {(s as any).groups?.length
                    ? (s as any).groups.map((g: any) => (
                        <div key={g.teacherId}>{g.classCode || s.classCode || "—"}</div>
                      ))
                    : (s.classCode || "—")}
                </td>
                <td className="p-3 font-bold text-primary">{s.titleFa}<div className="text-[11px] font-normal text-muted-foreground">{levelLabel(s.level)}</div></td>
                <td className="p-3 text-muted-foreground">
                  {(s as any).groups?.length
                    ? (s as any).groups.map((g: any) => (
                        <div key={g.teacherId}>{teachers.find(t => t.id === g.teacherId)?.nameFa ?? "—"}</div>
                      ))
                    : (teacherNames || "—")}
                </td>
                <td className="p-3">{formatJalali(s.startsOn)}</td>
                <td className="p-3">{formatToman(s.priceToman ?? 0)}</td>
                <td className="p-3">
                  {(s as any).groups?.length
                    ? (s as any).groups.map((g: any) => (
                        <div key={g.teacherId}>{(Number(g.capacity) || 0).toLocaleString("fa-IR")} نفر</div>
                      ))
                    : `${(s.seatsTaken ?? 0).toLocaleString("fa-IR")}/${(s.capacity ?? 0).toLocaleString("fa-IR")}`}
                </td>

                <td className="p-3"><span className="chip">{s.status ?? "—"}</span></td>
                <td className="p-3 text-left">
                  <button onClick={() => openModal(s)} className="p-2 hover:bg-gold/15 rounded-lg text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(s.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-primary/40 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-primary">{editing ? "ویرایش کلاس" : "کلاس جدید"}</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><F label="عنوان"><input value={form.titleFa} onChange={e => setForm({ ...form, titleFa: e.target.value })} className={ic} /></F></div>
              <F label="کد کلاس (اختیاری — مثلاً 100-2)">
                <input value={form.classCode || ""} onChange={e => setForm({ ...form, classCode: e.target.value })} placeholder="در صورت خالی بودن، خودکار ساخته می‌شود" className={ic + " font-mono"} />
              </F>
              <F label="سطح">
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className={ic}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label} — {l.books}</option>)}
                </select>
              </F>
              <div className="sm:col-span-2">
                <F label="اساتید (چند انتخابی)">
                  <div className="rounded-lg bg-parchment border border-primary/15 p-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {teachers.length === 0 && <span className="text-xs text-muted-foreground">ابتدا استاد اضافه کنید</span>}
                    {teachers.map(t => {
                      const checked = (form.teacherIds || []).includes(t.id);
                      return (
                        <label key={t.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={checked} className="accent-[hsl(var(--gold))]"
                            onChange={e => {
                              const cur: string[] = form.teacherIds || [];
                              const next = e.target.checked ? [...cur, t.id] : cur.filter(x => x !== t.id);
                              setForm({ ...form, teacherIds: next, groups: syncGroups(next, form.groups, form) });
                            }} />
                          <span>{t.nameFa}</span>
                        </label>
                      );
                    })}
                  </div>
                </F>
              </div>
              {(form.teacherIds || []).length > 0 && (
                <div className="sm:col-span-2">
                  <F label="کد کلاس و ظرفیت به تفکیک هر استاد">
                    <div className="rounded-lg bg-parchment border border-primary/15 p-3 space-y-2">
                      <p className="text-[11px] text-muted-foreground leading-5">
                        هر استاد گروه مستقل خود را دارد؛ ظرفیت هر گروه جداگانه پر می‌شود و کد کلاس مخصوص همان استاد است.
                      </p>
                      {(form.teacherIds || []).map((tid: string) => {
                        const g = (form.groups || []).find((x: any) => x.teacherId === tid) || { teacherId: tid, classCode: "", capacity: 0 };
                        const name = teachers.find(t => t.id === tid)?.nameFa ?? tid;
                        const patch = (p: any) => setForm({
                          ...form,
                          groups: (form.teacherIds || []).map((id: string) => {
                            const cur = (form.groups || []).find((x: any) => x.teacherId === id) || { teacherId: id, classCode: "", capacity: 0 };
                            return id === tid ? { ...cur, ...p } : cur;
                          }),
                        });
                        return (
                          <div key={tid} className="grid grid-cols-[1fr_1.2fr_auto] gap-2 items-center">
                            <span className="text-xs font-bold text-primary truncate">{name}</span>
                            <input
                              value={g.classCode}
                              onChange={e => patch({ classCode: e.target.value })}
                              placeholder="کد کلاس این استاد — مثلاً 100-2"
                              className={ic + " font-mono text-xs"}
                            />
                            <input
                              type="number"
                              min={0}
                              value={g.capacity}
                              onChange={e => patch({ capacity: Number(e.target.value) || 0 })}
                              placeholder="ظرفیت"
                              className={ic + " w-24 text-xs"}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </F>
                </div>
              )}

              <div className="sm:col-span-2">
                <F label="کتاب‌های این کلاس (اختیاری — به دانش‌آموز پیشنهاد داده می‌شود)">
                  <div className="rounded-lg bg-parchment border border-primary/15 p-3 grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                    {books.length === 0 && <span className="text-xs text-muted-foreground">هنوز کتابی ثبت نشده است</span>}
                    {books.map(b => {
                      const checked = (form.bookIds || []).includes(b.id);
                      return (
                        <label key={b.id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input type="checkbox" checked={checked} className="accent-[hsl(var(--gold))]"
                            onChange={e => {
                              const cur: string[] = form.bookIds || [];
                              const next = e.target.checked ? [...cur, b.id] : cur.filter(x => x !== b.id);
                              setForm({ ...form, bookIds: next });
                            }} />
                          <span className="truncate">{b.titleFa}</span>
                        </label>
                      );
                    })}
                  </div>
                </F>
              </div>
              <F label="تاریخ شروع (شمسی)">
                <JalaliDateInput value={form.startsOn} onChange={iso => setForm({ ...form, startsOn: iso })} />
              </F>
              <F label="تاریخ پایان (شمسی)">
                <JalaliDateInput value={form.endsOn} onChange={iso => setForm({ ...form, endsOn: iso })} />
              </F>
              <F label="ظرفیت"><input type="number" value={form.capacity} onChange={e => setForm({ ...form, capacity: +e.target.value })} className={ic} /></F>
              <F label="شهریه (تومان)"><input type="number" value={form.priceToman} onChange={e => setForm({ ...form, priceToman: +e.target.value })} className={ic} /></F>
              <F label="نحوه برگزاری">
                <select value={form.mode} onChange={e => setForm({ ...form, mode: e.target.value })} className={ic}>
                  <option value="in-person">حضوری</option><option value="online">آنلاین</option><option value="hybrid">ترکیبی</option>
                </select>
              </F>
              <F label="وضعیت">
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={ic}>
                  <option value="open">باز</option><option value="closed">بسته</option><option value="archived">بایگانی</option>
                </select>
              </F>
              <F label="ساعت شروع کلاس">
                <input type="time" value={form.startTime || ""} onChange={e => setForm({ ...form, startTime: e.target.value })} className={ic} dir="ltr" />
              </F>
              <div className="sm:col-span-2">
                <F label="روزهای هفته">
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map(w => {
                      const cur: string[] = form.days || [];
                      const on = cur.includes(w.value);
                      return (
                        <button
                          type="button"
                          key={w.value}
                          onClick={() => setForm({ ...form, days: on ? cur.filter(x => x !== w.value) : [...cur, w.value] })}
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold border transition-colors ${on ? "bg-primary text-primary-foreground border-primary" : "bg-parchment text-primary border-primary/15 hover:border-gold"}`}
                        >
                          {w.label}
                        </button>
                      );
                    })}
                  </div>
                </F>
              </div>
              <div className="sm:col-span-2"><F label="توضیح برنامه (متن آزاد)"><input value={form.scheduleFa} onChange={e => setForm({ ...form, scheduleFa: e.target.value })} className={ic} placeholder="مثلاً: هر جلسه ۹۰ دقیقه" /></F></div>

            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} className="btn-primary flex-1">ذخیره</button>
              <button onClick={() => setOpen(false)} className="btn-ghost">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const ic = "w-full rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm";
function F({ label, children }: any) { return <label className="block"><span className="block text-xs font-bold text-primary mb-1">{label}</span>{children}</label>; }
