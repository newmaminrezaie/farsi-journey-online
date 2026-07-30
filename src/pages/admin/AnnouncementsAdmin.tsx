import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Loader2, Plus, Trash2, Pencil, Pin, Eye, EyeOff, X } from "lucide-react";
import { announcementsApi } from "@/lib/api";
import type { Announcement } from "@/lib/types";
import { formatJalali } from "@/lib/jalali";

type Draft = {
  title: string;
  body: string;
  kind: Announcement["kind"];
  pinned: boolean;
  published: boolean;
  linkHref: string;
  linkLabel: string;
};

const EMPTY: Draft = {
  title: "", body: "", kind: "news", pinned: false, published: true, linkHref: "", linkLabel: "",
};

const KINDS: { value: Announcement["kind"]; label: string }[] = [
  { value: "news", label: "خبر" },
  { value: "important", label: "مهم" },
  { value: "event", label: "رویداد" },
];

export default function AnnouncementsAdmin() {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);

  async function load() {
    setLoading(true);
    try {
      setRows(await announcementsApi.listAll());
    } catch {
      toast.error("دریافت اطلاعیه‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditId(null); setDraft(EMPTY); setOpen(true); }
  function startEdit(a: Announcement) {
    setEditId(a.id);
    setDraft({
      title: a.title, body: a.body, kind: a.kind, pinned: a.pinned,
      published: a.published, linkHref: a.linkHref, linkLabel: a.linkLabel,
    });
    setOpen(true);
  }

  async function save() {
    if (!draft.title.trim()) { toast.error("عنوان اطلاعیه را وارد کنید"); return; }
    setSaving(true);
    try {
      if (editId) await announcementsApi.update(editId, draft);
      else await announcementsApi.create(draft);
      toast.success("اطلاعیه ذخیره شد");
      setOpen(false);
      await load();
    } catch {
      toast.error("ذخیره ناموفق بود");
    } finally { setSaving(false); }
  }

  async function toggle(a: Announcement, patch: Partial<Announcement>) {
    try {
      await announcementsApi.update(a.id, patch);
      await load();
    } catch { toast.error("به‌روزرسانی ناموفق بود"); }
  }

  async function remove(a: Announcement) {
    if (!confirm(`اطلاعیه «${a.title}» حذف شود؟`)) return;
    try {
      await announcementsApi.remove(a.id);
      toast.success("حذف شد");
      await load();
    } catch { toast.error("حذف ناموفق بود"); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-primary text-primary-foreground"><Bell className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl text-primary">اطلاعیه‌ها</h1>
            <p className="text-sm text-muted-foreground mt-1">اطلاعیه‌های منتشرشده در بخش «اطلاعیه‌ها» صفحه اصلی نمایش داده می‌شوند.</p>
          </div>
        </div>
        <button className="btn-gold" onClick={startNew}><Plus className="h-4 w-4" /> اطلاعیه جدید</button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری…</div>
      ) : rows.length === 0 ? (
        <div className="hg-card p-10 text-center text-muted-foreground">هنوز اطلاعیه‌ای ثبت نشده است.</div>
      ) : (
        <div className="grid gap-4">
          {rows.map(a => (
            <div key={a.id} className="hg-card p-5 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={a.kind === "important" ? "chip-gold" : "chip"}>
                    {KINDS.find(k => k.value === a.kind)?.label}
                  </span>
                  {a.pinned && <span className="chip">سنجاق‌شده</span>}
                  {!a.published && <span className="chip">پیش‌نویس</span>}
                  <span className="text-xs text-muted-foreground">{formatJalali(a.createdAt)}</span>
                </div>
                <h3 className="text-lg text-primary mb-1">{a.title}</h3>
                {a.body && <p className="text-sm text-muted-foreground leading-8 whitespace-pre-line line-clamp-3">{a.body}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button className="btn-ghost" title={a.published ? "پنهان کردن" : "انتشار"} onClick={() => toggle(a, { published: !a.published })}>
                  {a.published ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button className="btn-ghost" title="سنجاق" onClick={() => toggle(a, { pinned: !a.pinned })}>
                  <Pin className={a.pinned ? "h-4 w-4 text-gold" : "h-4 w-4"} />
                </button>
                <button className="btn-ghost" title="ویرایش" onClick={() => startEdit(a)}><Pencil className="h-4 w-4" /></button>
                <button className="btn-ghost text-destructive" title="حذف" onClick={() => remove(a)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-primary">{editId ? "ویرایش اطلاعیه" : "اطلاعیه جدید"}</h2>
              <button className="btn-ghost" onClick={() => setOpen(false)}><X className="h-4 w-4" /></button>
            </div>

            <div className="grid gap-4">
              <label className="block">
                <span className="text-sm text-primary">عنوان اطلاعیه *</span>
                <input className="hg-input mt-1" value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} placeholder="مثلاً: شروع ثبت‌نام ترم پاییز" />
              </label>

              <label className="block">
                <span className="text-sm text-primary">متن اطلاعیه</span>
                <textarea className="hg-input mt-1 min-h-32 leading-8" value={draft.body} onChange={e => setDraft({ ...draft, body: e.target.value })} placeholder="متن کامل اطلاعیه به فارسی…" />
              </label>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-primary">نوع</span>
                  <select className="hg-input mt-1" value={draft.kind} onChange={e => setDraft({ ...draft, kind: e.target.value as Announcement["kind"] })}>
                    {KINDS.map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                  </select>
                </label>
                <div className="flex items-end gap-6 pb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={draft.published} onChange={e => setDraft({ ...draft, published: e.target.checked })} />
                    منتشر شود
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={draft.pinned} onChange={e => setDraft({ ...draft, pinned: e.target.checked })} />
                    سنجاق در بالا
                  </label>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-primary">لینک (اختیاری)</span>
                  <input className="hg-input mt-1" value={draft.linkHref} onChange={e => setDraft({ ...draft, linkHref: e.target.value })} placeholder="/semesters" />
                </label>
                <label className="block">
                  <span className="text-sm text-primary">متن دکمه لینک</span>
                  <input className="hg-input mt-1" value={draft.linkLabel} onChange={e => setDraft({ ...draft, linkLabel: e.target.value })} placeholder="مشاهده کلاس‌ها" />
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button className="btn-ghost" onClick={() => setOpen(false)}>انصراف</button>
              <button className="btn-primary" onClick={save} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
