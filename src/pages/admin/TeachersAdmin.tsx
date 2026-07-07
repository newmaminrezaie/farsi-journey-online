import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { teachersApi } from "@/lib/api";
import type { Teacher } from "@/lib/types";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";

const empty = { nameFa: "", nameEn: "", bioFa: "", specialties: [] as string[], photoUrl: "" };

export default function TeachersAdmin() {
  const qc = useQueryClient();
  const { data: teachers = [] } = useQuery({ queryKey: ["teachers"], queryFn: () => teachersApi.list() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Teacher | null>(null);
  const [form, setForm] = useState<any>(empty);

  function openModal(t?: Teacher) {
    if (t) { setEditing(t); setForm({ ...t }); } else { setEditing(null); setForm(empty); }
    setOpen(true);
  }
  async function save() {
    if (!form.nameFa) return toast.error("نام الزامی است");
    if (editing) await teachersApi.update(editing.id, form);
    else await teachersApi.create(form);
    qc.invalidateQueries({ queryKey: ["teachers"] });
    setOpen(false); toast.success("ذخیره شد");
  }
  async function del(id: string) {
    if (!confirm("حذف شود؟")) return;
    await teachersApi.remove(id); qc.invalidateQueries({ queryKey: ["teachers"] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-primary">اساتید</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="h-4 w-4" /> افزودن استاد</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {teachers.map(t => (
          <div key={t.id} className="bg-card rounded-2xl p-5 border border-primary/10 flex gap-4">
            <img src={t.photoUrl} alt={t.nameFa} className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="font-bold text-primary">{t.nameFa}</div>
              <div className="text-xs text-muted-foreground mb-1">{t.nameEn}</div>
              <div className="text-xs text-turquoise">{t.specialties.join(" • ")}</div>
              <div className="flex gap-1 mt-3">
                <button onClick={() => openModal(t)} className="p-1.5 hover:bg-gold/15 rounded-lg text-primary"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => del(t.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-primary/40 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl text-primary">{editing ? "ویرایش استاد" : "استاد جدید"}</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <F label="نام فارسی"><input value={form.nameFa} onChange={e => setForm({ ...form, nameFa: e.target.value })} className={ic} /></F>
              <F label="نام انگلیسی"><input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className={ic} /></F>
              <F label="بیوگرافی"><textarea value={form.bioFa} onChange={e => setForm({ ...form, bioFa: e.target.value })} className={ic + " min-h-24"} /></F>
              <F label="تخصص‌ها (با کاما)">
                <input value={form.specialties.join(",")} onChange={e => setForm({ ...form, specialties: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean) })} className={ic} />
              </F>
              <F label="آدرس تصویر"><input value={form.photoUrl} onChange={e => setForm({ ...form, photoUrl: e.target.value })} className={ic} placeholder="https://…" /></F>
            </div>
            <div className="flex gap-3 mt-6"><button onClick={save} className="btn-primary flex-1">ذخیره</button><button onClick={() => setOpen(false)} className="btn-ghost">انصراف</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
const ic = "w-full rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm";
function F({ label, children }: any) { return <label className="block"><span className="block text-xs font-bold text-primary mb-1">{label}</span>{children}</label>; }
