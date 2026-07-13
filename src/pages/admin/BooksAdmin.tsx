import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { booksApi, formatToman } from "@/lib/api";
import type { Book } from "@/lib/types";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import ImageInput from "@/components/ImageInput";

const empty: Omit<Book, "id" | "createdAt"> = {
  titleFa: "", titleEn: "", author: "", level: "beginner", category: "grammar",
  descriptionFa: "", coverUrl: "", priceToman: 0, stock: 0, active: true,
};

export default function BooksAdmin() {
  const qc = useQueryClient();
  const { data: books = [] } = useQuery({ queryKey: ["books"], queryFn: () => booksApi.list() });
  const [editing, setEditing] = useState<Book | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [isOpen, setIsOpen] = useState(false);

  function open(b?: Book) {
    if (b) { setEditing(b); setForm({ ...b }); }
    else { setEditing(null); setForm({ ...empty }); }
    setIsOpen(true);
  }
  function close() {
    setIsOpen(false); setEditing(null); setForm({ ...empty });
  }
  async function save() {
    if (!form.titleFa || !form.priceToman) return toast.error("عنوان و قیمت الزامی است");
    if (editing) await booksApi.update(editing.id, form);
    else await booksApi.create(form);
    qc.invalidateQueries({ queryKey: ["books"] });
    close();
    toast.success("ذخیره شد");
  }
  async function del(id: string) {
    if (!confirm("حذف شود؟")) return;
    await booksApi.remove(id);
    qc.invalidateQueries({ queryKey: ["books"] });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl text-primary">کتاب‌ها</h1>
        <button onClick={() => open()} className="btn-primary"><Plus className="h-4 w-4" /> افزودن کتاب</button>
      </div>

      <div className="bg-card rounded-3xl border border-primary/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-right">
            <tr>
              <th className="p-3">عنوان</th><th className="p-3">مؤلف</th>
              <th className="p-3">قیمت</th><th className="p-3">موجودی</th>
              <th className="p-3">وضعیت</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {books.map(b => (
              <tr key={b.id} className="border-t border-primary/5">
                <td className="p-3 font-bold text-primary">{b.titleFa}</td>
                <td className="p-3 text-muted-foreground">{b.author}</td>
                <td className="p-3">{formatToman(b.priceToman)}</td>
                <td className="p-3">{b.stock.toLocaleString("fa-IR")}</td>
                <td className="p-3">
                  <span className={`chip ${b.active ? "" : "opacity-40"}`}>{b.active ? "فعال" : "غیرفعال"}</span>
                </td>
                <td className="p-3 text-left">
                  <button onClick={() => open(b)} className="p-2 hover:bg-gold/15 rounded-lg text-primary"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => del(b.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-primary/40 flex items-center justify-center p-4 z-50" onClick={close}>
          <div className="bg-card rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-primary">{editing ? "ویرایش کتاب" : "کتاب جدید"}</h2>
              <button onClick={close} className="p-2"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="عنوان (فارسی)"><input value={form.titleFa} onChange={e => setForm({ ...form, titleFa: e.target.value })} className={ic} /></Field>
              <Field label="عنوان (انگلیسی)"><input value={form.titleEn} onChange={e => setForm({ ...form, titleEn: e.target.value })} className={ic} /></Field>
              <Field label="مؤلف"><input value={form.author} onChange={e => setForm({ ...form, author: e.target.value })} className={ic} /></Field>
              <Field label="سطح">
                <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value as any })} className={ic}>
                  {["beginner","elementary","pre-intermediate","intermediate","upper-intermediate","advanced","ielts"].map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="دسته‌بندی">
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value as any })} className={ic}>
                  {["grammar","vocabulary","ielts","story","kids","reference"].map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>
              <Field label="قیمت (تومان)"><input type="number" value={form.priceToman} onChange={e => setForm({ ...form, priceToman: +e.target.value })} className={ic} /></Field>
              <Field label="موجودی"><input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: +e.target.value })} className={ic} /></Field>
              <Field label="فعال؟">
                <select value={String(form.active)} onChange={e => setForm({ ...form, active: e.target.value === "true" })} className={ic}>
                  <option value="true">فعال</option><option value="false">غیرفعال</option>
                </select>
              </Field>
              <div className="sm:col-span-2"><Field label="تصویر جلد"><ImageInput value={form.coverUrl} onChange={url => setForm({ ...form, coverUrl: url })} /></Field></div>
              <div className="sm:col-span-2"><Field label="توضیحات"><textarea value={form.descriptionFa} onChange={e => setForm({ ...form, descriptionFa: e.target.value })} className={ic + " min-h-24"} /></Field></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={save} className="btn-primary flex-1">ذخیره</button>
              <button onClick={close} className="btn-ghost">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const ic = "w-full rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm";
function Field({ label, children }: any) {
  return <label className="block"><span className="block text-xs font-bold text-primary mb-1">{label}</span>{children}</label>;
}
