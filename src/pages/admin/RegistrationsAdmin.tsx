import { useQuery, useQueryClient } from "@tanstack/react-query";
import { registrationsApi, semestersApi } from "@/lib/api";

const STATUSES = ["new", "contacted", "enrolled", "rejected"] as const;

export default function RegistrationsAdmin() {
  const qc = useQueryClient();
  const { data: regs = [] } = useQuery({ queryKey: ["registrations"], queryFn: () => registrationsApi.list() });
  const { data: semesters = [] } = useQuery({ queryKey: ["semesters"], queryFn: () => semestersApi.list() });
  async function update(id: string, s: any) {
    await registrationsApi.updateStatus(id, s);
    qc.invalidateQueries({ queryKey: ["registrations"] });
  }
  return (
    <div>
      <h1 className="text-3xl mb-8 text-primary">درخواست‌های ثبت‌نام</h1>
      <div className="bg-card rounded-3xl border border-primary/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-right">
            <tr><th className="p-3">نام</th><th className="p-3">تلفن</th><th className="p-3">دوره</th><th className="p-3">یادداشت</th><th className="p-3">وضعیت</th></tr>
          </thead>
          <tbody>
            {regs.map(r => (
              <tr key={r.id} className="border-t border-primary/5">
                <td className="p-3 font-bold text-primary">{r.fullName}</td>
                <td className="p-3">{r.phone}</td>
                <td className="p-3 text-muted-foreground">{semesters.find(s => s.id === r.semesterId)?.titleFa ?? (r.levelInterest ?? "—")}</td>
                <td className="p-3 text-xs text-muted-foreground max-w-xs">{r.note || "—"}</td>
                <td className="p-3">
                  <select value={r.status} onChange={e => update(r.id, e.target.value)} className="rounded-lg bg-parchment border border-primary/15 px-2 py-1 text-sm">
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {regs.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">هنوز درخواستی وجود ندارد.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
