import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { semestersApi, teachersApi, booksApi, formatToman } from "@/lib/api";
import type { Semester } from "@/lib/types";
import { formatJalali, jalaliTupleToIso } from "@/lib/jalali";
import DatePicker, { DateObject } from "react-multi-date-picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const empty = {
  titleFa: "", level: "beginner" as any, teacherId: "", teacherIds: [] as string[],
  bookIds: [] as string[],
  scheduleFa: "", startsOn: "", endsOn: "",
  capacity: 12, priceToman: 0, mode: "in-person" as any, status: "open" as any,
};

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
      const ids = s.teacherIds && s.teacherIds.length ? s.teacherIds : (s.teacherId ? [s.teacherId] : []);
      setForm({ ...s, teacherIds: ids, bookIds: s.bookIds ?? [] });
    } else { setEditing(null); setForm(empty); }
    setOpen(true);
  }
  async function save() {
    if (!form.titleFa || !form.startsOn || !form.endsOn) return toast.error("عنوان و تاریخ‌ها الزامی است");
    const payload = { ...form, teacherId: form.teacherIds?.[0] || form.teacherId || "", bookIds: form.bookIds || [] };
    if (editing) await semestersApi.update(editing.id, payload);
    else await semestersApi.create(payload);
    qc.invalidateQueries({ queryKey: ["semesters"] });
    setOpen(false);
    toast.success("ذخیره شد");
  }
  async function del(id: string) {
    if (!confirm("حذف شود؟")) return;
    await semestersApi.remove(id);
    qc.invalidateQueries({ queryKey: ["semesters"] });
  }
  function pickDate(field: "startsOn" | "endsOn", v: DateObject | null) {
    if (!v) return setForm({ ...form, [field]: "" });
    setForm({ ...form, [field]: jalaliTupleToIso(v.year, v.month.number, v.day) });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-primary">ترم‌ها</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="h-4 w-4" /> افزودن ترم</button>
      </div>
      <div className="bg-card rounded-3xl border border-primary/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-right">
            <tr>
              <th className="p-3">عنوان</th><th className="p-3">استاد</th>
              <th className="p-3">شروع</th><th className="p-3">قیمت</th>
              <th className="p-3">ظرفیت</th><th className="p-3">وضعیت</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {semesters.map(s => (
              <tr key={s.id} className="border-t border-primary/5">
                <td className="p-3 font-bold text-primary">{s.titleFa}</td>
                <td className="p-3 text-muted-foreground">{teachers.find(t => t.id === s.teacherId)?.nameFa ?? "—"}</td>
                <td className="p-3">{formatJalali(s.startsOn)}</td>
                <td className="p-3">{formatToman(s.priceToman)}</td>
                <td className="p-3">{s.seatsTaken.toLocaleString("fa-IR")}/{s.capacity.toLocaleString("fa-IR")}</td>
                <td className="p-3"><span className="chip">{s.status}</span></td>
                <td className="p-3 text-left">
                  <button onClick={() => openModal(s)} className="p-2 hover:bg-gold/15 rounded-lg text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(s.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-primary/40 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-primary">{editing ? "ویرایش ترم" : "ترم جدید"}</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2"><F label="عنوان"><input value={form.titleFa} onChange={e => setForm({ ...form, titleFa: e.target.value })} className={ic} /></F></div>
              <F label="سطح">
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className={ic}>
                  {["beginner","elementary","pre-intermediate","intermediate","upper-intermediate","advanced","ielts"].map(l => <option key={l}>{l}</option>)}
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
                              setForm({ ...form, teacherIds: next });
                            }} />
                          <span>{t.nameFa}</span>
                        </label>
                      );
                    })}
                  </div>
                </F>
              </div>
              <div className="sm:col-span-2">
                <F label="کتاب‌های این ترم (اختیاری — به دانش‌آموز پیشنهاد داده می‌شود)">
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
                <DatePicker calendar={persian} locale={persian_fa} calendarPosition="bottom-right" portal
                  zIndex={1000} className="rmdp-mobile"
                  value={form.startsOn ? new Date(form.startsOn) : undefined}
                  onChange={(v: any) => pickDate("startsOn", v)} inputClass={ic} />
              </F>
              <F label="تاریخ پایان (شمسی)">
                <DatePicker calendar={persian} locale={persian_fa} calendarPosition="bottom-right" portal
                  zIndex={1000} className="rmdp-mobile"
                  value={form.endsOn ? new Date(form.endsOn) : undefined}
                  onChange={(v: any) => pickDate("endsOn", v)} inputClass={ic} />
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
              <div className="sm:col-span-2"><F label="برنامه (متن آزاد)"><input value={form.scheduleFa} onChange={e => setForm({ ...form, scheduleFa: e.target.value })} className={ic} /></F></div>
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
