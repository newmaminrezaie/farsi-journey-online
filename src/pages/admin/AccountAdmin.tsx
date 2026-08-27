import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api";

export default function AccountAdmin() {
  const nav = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (next.length < 8) return toast.error("رمز جدید باید حداقل ۸ نویسه باشد.");
    if (next !== confirm) return toast.error("تکرار رمز جدید مطابقت ندارد.");
    setSaving(true);
    try {
      await authApi.changePassword(current, next);
      toast.success("رمز عبور با موفقیت تغییر کرد. لطفاً دوباره وارد شوید.");
      setTimeout(() => nav("/admin/login", { replace: true }), 900);
    } catch (err: any) {
      toast.error(err?.message || "تغییر رمز عبور انجام نشد.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground grid place-items-center">
          <KeyRound className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-primary">تغییر رمز عبور</h1>
          <p className="text-sm text-muted-foreground">رمز عبور حساب مدیریتی خود را به‌روزرسانی کنید.</p>
        </div>
      </div>

      <form onSubmit={submit} className="hg-card p-6 space-y-4 bg-card rounded-2xl border-2 border-border shadow-soft">
        <div>
          <label className="block text-sm font-bold mb-1.5">رمز عبور فعلی</label>
          <input type={show ? "text" : "password"} className="hg-input w-full" value={current}
                 onChange={e => setCurrent(e.target.value)} autoComplete="current-password" required />
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5">رمز عبور جدید</label>
          <input type={show ? "text" : "password"} className="hg-input w-full" value={next}
                 onChange={e => setNext(e.target.value)} autoComplete="new-password" minLength={8} required />
          <p className="text-xs text-muted-foreground mt-1">حداقل ۸ نویسه؛ ترکیبی از حروف، عدد و نماد پیشنهاد می‌شود.</p>
        </div>
        <div>
          <label className="block text-sm font-bold mb-1.5">تکرار رمز عبور جدید</label>
          <input type={show ? "text" : "password"} className="hg-input w-full" value={confirm}
                 onChange={e => setConfirm(e.target.value)} autoComplete="new-password" minLength={8} required />
        </div>

        <button type="button" onClick={() => setShow(s => !s)}
                className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-gold">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {show ? "پنهان کردن رمزها" : "نمایش رمزها"}
        </button>

        <div className="flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />
          پس از تغییر رمز، نشست فعلی بسته می‌شود و باید با رمز جدید دوباره وارد شوید.
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full justify-center inline-flex items-center gap-2">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره رمز جدید
        </button>
      </form>
    </div>
  );
}
