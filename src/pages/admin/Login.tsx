import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import logo from "@/assets/logo-fa.png";
import { LogIn } from "lucide-react";

export default function AdminLogin() {
  const nav = useNavigate();
  const [u, setU] = useState("admin");
  const [p, setP] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await authApi.login(u, p);
    if (ok) { toast.success("خوش آمدید"); nav("/admin/dashboard"); }
    else toast.error("نام کاربری یا رمز عبور اشتباه است");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 tile-bg-navy opacity-50" />
      <form onSubmit={submit} className="relative bg-parchment text-primary rounded-3xl p-10 w-full max-w-md shadow-navy">
        <img src={logo} alt="" className="h-16 mx-auto mb-6" />
        <h1 className="text-2xl text-center mb-2">ورود به پنل مدیریت</h1>
        <p className="text-center text-sm text-muted-foreground mb-6">پیش‌فرض: admin / higooya1403</p>
        <div className="space-y-3">
          <input value={u} onChange={e => setU(e.target.value)} placeholder="نام کاربری" className="w-full rounded-xl bg-card border border-primary/15 px-4 py-3" />
          <input value={p} onChange={e => setP(e.target.value)} placeholder="رمز عبور" type="password" className="w-full rounded-xl bg-card border border-primary/15 px-4 py-3" />
        </div>
        <button className="btn-primary w-full mt-6"><LogIn className="h-4 w-4" /> ورود</button>
      </form>
    </div>
  );
}
