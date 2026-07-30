import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BadgePercent, Loader2, Plus, Trash2, Pencil, Power, X } from "lucide-react";
import { discountsApi, formatToman } from "@/lib/api";
import type { Discount } from "@/lib/types";
import { formatJalali } from "@/lib/jalali";
import JalaliDateInput from "@/components/JalaliDateInput";

type Draft = {
  code: string;
  percent: number;
  scope: Discount["scope"];
  expiresAt: string;
  maxUses: number;
  maxDiscountToman: number;
  minAmountToman: number;
  active: boolean;
  note: string;
};

const EMPTY: Draft = {
  code: "", percent: 10, scope: "all", expiresAt: "",
  maxUses: 0, maxDiscountToman: 0, minAmountToman: 0, active: true, note: "",
};

const SCOPES: { value: Discount["scope"]; label: string }[] = [
  { value: "all", label: "همه (ثبت‌نام و کتاب)" },
  { value: "registration", label: "فقط ثبت‌نام کلاس" },
  { value: "shop", label: "فقط خرید کتاب" },
];

function isExpired(d: Discount) {
  if (!d.expiresAt) return false;
  return Date.now() > new Date(`${d.expiresAt}T23:59:59`).getTime();
}

export default function DiscountsAdmin() {
  const [rows, setRows] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [hasExpiry, setHasExpiry] = useState(false);

  async function load() {
    setLoading(true);
    try { setRows(await discountsApi.listAll()); }
    catch { toast.error("دریافت کدهای تخفیف ناموفق بود"); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  function startNew() { setEditId(null); setDraft(EMPTY); setHasExpiry(false); setOpen(true); }
  function startEdit(d: Discount) {
    setEditId(d.id);
    setDraft({
      code: d.code, percent: d.percent, scope: d.scope, expiresAt: d.expiresAt,
      maxUses: d.maxUses, maxDiscountToman: d.maxDiscountToman,
      minAmountToman: d.minAmountToman, active: d.active, note: d.note,
    });
    setHasExpiry(Boolean(d.expiresAt));
    setOpen(true);
  }

  async function save() {
    const code = draft.code.trim().toUpperCase();
    if (code.length < 2) { toast.error("کد تخفیف را وارد کنید (حداقل ۲ نویسه)"); return; }
    if (draft.percent < 1 || draft.percent > 100) { toast.error("درصد تخفیف باید بین ۱ تا ۱۰۰ باشد"); return; }
    const payload = { ...draft, code, expiresAt: hasExpiry ? draft.expiresAt : "" };
    setSaving(true);
    try {
      if (editId) await discountsApi.update(editId, payload);
      else await discountsApi.create(payload);
      toast.success("کد تخفیف ذخیره شد");
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(String(e?.message || "").includes("duplicate_code") ? "این کد قبلاً ثبت شده است" : "ذخیره ناموفق بود");
    } finally { setSaving(false); }
  }

  async function toggleActive(d: Discount) {
    try { await discountsApi.update(d.id, { active: !d.active }); await load(); }
    catch { toast.error("به‌روزرسانی ناموفق بود"); }
  }

  async function remove(d: Discount) {
    if (!confirm(`کد تخفیف «${d.code}» حذف شود؟`)) return;
    try { await discountsApi.remove(d.id); toast.success("حذف شد"); await load(); }
    catch { toast.error("حذف ناموفق بود"); }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <span className="p-3 rounded-2xl bg-primary text-primary-foreground"><BadgePercent className="h-5 w-5" /></span>
          <div>
            <h1 className="text-2xl text-primary">کدهای تخفیف</h1>
            <p className="text-sm text-muted-foreground mt-1">
              کدها هنگام پرداخت ثبت‌نام کلاس و خرید کتاب قابل استفاده‌اند و پس از پرداخت موفق شمارش می‌شوند.
            </p>
          </div>
        </div>
        <button className="btn-gold" onClick={startNew}><Plus className="h-4 w-4" /> کد تخفیف جدید</button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> در حال بارگذاری…</div>
      ) : rows.length === 0 ? (
        <div className="hg-card p-10 text-center text-muted-foreground">هنوز کد تخفیفی ثبت نشده است.</div>
      ) : (
        <div className="grid gap-4">
          {rows.map(d => {
            const expired = isExpired(d);
            const exhausted = d.maxUses > 0 && d.usedCount >= d.maxUses;
            return (
              <div key={d.id} className="hg-card p-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="chip-gold font-mono tracking-widest" dir="ltr">{d.code}</span>
                    <span className="chip">{d.percent.toLocaleString("fa-IR")}٪</span>
                    <span className="chip">{SCOPES.find(s => s.value === d.scope)?.label}</span>
                    {!d.active && <span className="chip">غیرفعال</span>}
                    {expired && <span className="chip">منقضی‌شده</span>}
                    {exhausted && <span className="chip">ظرفیت تکمیل</span>}
                  </div>
                  <div className="text-sm text-muted-foreground leading-8">
                    <span>انقضا: {d.expiresAt ? formatJalali(d.expiresAt) : "بدون انقضا"}</span>
                    <span className="mx-3">•</span>
                    <span>
                      استفاده‌شده: {d.usedCount.toLocaleString("fa-IR")}
                      {d.maxUses > 0 ? ` از ${d.maxUses.toLocaleString("fa-IR")}` : " (نامحدود)"}
                    </span>
                    {d.maxDiscountToman > 0 && <><span className="mx-3">•</span><span>سقف تخفیف: {formatToman(d.maxDiscountToman)}</span></>}
                    {d.minAmountToman > 0 && <><span className="mx-3">•</span><span>حداقل خرید: {formatToman(d.minAmountToman)}</span></>}
                  </div>
                  {d.note && <p className="text-sm text-muted-foreground mt-1">{d.note}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => toggleActive(d)} title={d.active ? "غیرفعال کردن" : "فعال کردن"}
                          className={`p-2 rounded-lg hover:bg-primary/5 ${d.active ? "text-turquoise" : "text-muted-foreground"}`}>
                    <Power className="h-4 w-4" />
                  </button>
                  <button onClick={() => startEdit(d)} title="ویرایش" className="p-2 rounded-lg text-primary hover:bg-primary/5">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(d)} title="حذف" className="p-2 rounded-lg text-destructive hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto p-6">
          <div className="bg-card rounded-3xl w-full max-w-2xl p-6 md:p-8 my-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl text-primary">{editId ? "ویرایش کد تخفیف" : "کد تخفیف جدید"}</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-destructive"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <Field label="کد تخفیف *">
                <input value={draft.code} dir="ltr"
                       onChange={e => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                       placeholder="NOWRUZ1405" className="hg-input tracking-widest" />
              </Field>
              <Field label="درصد تخفیف *">
                <input type="number" min={1} max={100} value={draft.percent}
                       onChange={e => setDraft({ ...draft, percent: Number(e.target.value) })} className="hg-input" />
              </Field>

              <Field label="حوزه استفاده">
                <select value={draft.scope} onChange={e => setDraft({ ...draft, scope: e.target.value as Discount["scope"] })} className="hg-input">
                  {SCOPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="حداکثر دفعات استفاده (۰ = نامحدود)">
                <input type="number" min={0} value={draft.maxUses}
                       onChange={e => setDraft({ ...draft, maxUses: Number(e.target.value) })} className="hg-input" />
              </Field>

              <Field label="سقف مبلغ تخفیف (تومان، ۰ = بدون سقف)">
                <input type="number" min={0} value={draft.maxDiscountToman}
                       onChange={e => setDraft({ ...draft, maxDiscountToman: Number(e.target.value) })} className="hg-input" />
              </Field>
              <Field label="حداقل مبلغ قابل پرداخت (تومان)">
                <input type="number" min={0} value={draft.minAmountToman}
                       onChange={e => setDraft({ ...draft, minAmountToman: Number(e.target.value) })} className="hg-input" />
              </Field>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-primary mb-2">
                  <input type="checkbox" checked={hasExpiry} onChange={e => setHasExpiry(e.target.checked)} />
                  تاریخ انقضا دارد
                </label>
                {hasExpiry && (
                  <JalaliDateInput value={draft.expiresAt} onChange={iso => setDraft({ ...draft, expiresAt: iso })} />
                )}
                {!hasExpiry && <p className="text-xs text-muted-foreground">این کد تا زمانی که غیرفعال نشود معتبر است.</p>}
              </div>

              <div className="md:col-span-2">
                <Field label="یادداشت داخلی">
                  <input value={draft.note} onChange={e => setDraft({ ...draft, note: e.target.value })} className="hg-input" />
                </Field>
              </div>

              <label className="md:col-span-2 flex items-center gap-2 text-sm font-bold text-primary">
                <input type="checkbox" checked={draft.active} onChange={e => setDraft({ ...draft, active: e.target.checked })} />
                فعال باشد
              </label>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={save} disabled={saving} className="btn-gold flex-1">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null} ذخیره
              </button>
              <button onClick={() => setOpen(false)} className="btn-ghost">انصراف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-bold text-primary mb-1.5">{label}</span>
      {children}
    </label>
  );
}
