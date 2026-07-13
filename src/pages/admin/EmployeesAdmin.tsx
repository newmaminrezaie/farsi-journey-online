import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { employeesApi } from "@/lib/api";
import type { Employee } from "@/lib/types";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ImageInput from "@/components/ImageInput";

const empty = { nameFa: "", nameEn: "", roleFa: "", bioFa: "", photoUrl: "", active: true };

export default function EmployeesAdmin() {
  const qc = useQueryClient();
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: () => employeesApi.list() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<any>(empty);

  function openModal(e?: Employee) {
    if (e) { setEditing(e); setForm({ ...e }); } else { setEditing(null); setForm(empty); }
    setOpen(true);
  }
  async function save() {
    if (!form.nameFa) return toast.error("نام الزامی است");
    if (editing) await employeesApi.update(editing.id, form);
    else await employeesApi.create(form);
    qc.invalidateQueries({ queryKey: ["employees"] });
    setOpen(false); toast.success("ذخیره شد");
  }
  async function del(id: string) {
    if (!confirm("حذف شود؟")) return;
    await employeesApi.remove(id); qc.invalidateQueries({ queryKey: ["employees"] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-primary">کارکنان</h1>
        <button onClick={() => openModal()} className="btn-primary"><Plus className="h-4 w-4" /> افزودن کارمند</button>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {employees.map(e => (
          <div key={e.id} className="bg-card rounded-2xl p-5 border border-primary/10 flex gap-4">
            <img src={e.photoUrl || "/placeholder.svg"} alt={e.nameFa} className="w-20 h-20 rounded-xl object-cover" />
            <div className="flex-1">
              <div className="font-bold text-primary">{e.nameFa}</div>
              <div className="text-xs text-muted-foreground mb-1">{e.nameEn}</div>
              <div className="text-xs text-turquoise">{e.roleFa}</div>
              <div className="flex gap-1 mt-3">
                <button onClick={() => openModal(e)} className="p-1.5 hover:bg-gold/15 rounded-lg text-primary"><Pencil className="h-3 w-3" /></button>
                <button onClick={() => del(e.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></button>
              </div>
            </div>
          </div>
        ))}
        {employees.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">هنوز کارمندی ثبت نشده است.</div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-primary/40 flex items-center justify-center p-4 z-50" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl text-primary">{editing ? "ویرایش کارمند" : "کارمند جدید"}</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <div className="space-y-3">
              <F label="نام فارسی"><input value={form.nameFa} onChange={e => setForm({ ...form, nameFa: e.target.value })} className={ic} /></F>
              <F label="نام انگلیسی"><input value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })} className={ic} /></F>
              <F label="سِمَت / نقش (مثلاً منشی، مسئول ثبت‌نام)">
                <input value={form.roleFa} onChange={e => setForm({ ...form, roleFa: e.target.value })} className={ic} />
              </F>
              <F label="توضیحات کوتاه"><textarea value={form.bioFa} onChange={e => setForm({ ...form, bioFa: e.target.value })} className={ic + " min-h-24"} /></F>
              <F label="تصویر"><ImageInput value={form.photoUrl} onChange={url => setForm({ ...form, photoUrl: url })} /></F>
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
