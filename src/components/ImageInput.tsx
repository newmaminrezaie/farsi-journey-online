import { useRef, useState } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Combined URL input + upload button. Uploads via POST /api/admin/uploads
// (staff-authenticated), sets the returned URL back into the field.
export default function ImageInput({
  value, onChange, placeholder = "https://… یا بارگذاری کنید",
}: { value: string; onChange: (url: string) => void; placeholder?: string }) {
  const [busy, setBusy] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("حجم فایل باید کمتر از ۵ مگابایت باشد");
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", f);
      const res = await fetch("/api/admin/uploads", { method: "POST", credentials: "include", body: fd });
      if (!res.ok) throw new Error("upload_failed");
      const { url } = await res.json();
      onChange(url);
      toast.success("تصویر بارگذاری شد");
    } catch {
      toast.error("بارگذاری ناموفق بود");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-lg bg-parchment border border-primary/15 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-3 py-2 text-xs font-bold hover:bg-primary/90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          بارگذاری
        </button>
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={pick} className="hidden" />
      </div>
      {value && (
        <img src={value} alt="پیش‌نمایش" className="h-24 w-24 object-cover rounded-lg border border-primary/10" />
      )}
    </div>
  );
}
