import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ordersApi, formatToman } from "@/lib/api";

const STATUSES = ["pending", "paid", "shipped", "cancelled"] as const;

export default function OrdersAdmin() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({ queryKey: ["orders"], queryFn: () => ordersApi.list() });
  async function update(id: string, status: any) {
    await ordersApi.updateStatus(id, status);
    qc.invalidateQueries({ queryKey: ["orders"] });
  }
  return (
    <div>
      <h1 className="text-3xl mb-8 text-primary">سفارش‌ها</h1>
      <div className="bg-card rounded-3xl border border-primary/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-right">
            <tr><th className="p-3">کد</th><th className="p-3">مشتری</th><th className="p-3">تلفن</th><th className="p-3">مبلغ</th><th className="p-3">وضعیت</th></tr>
          </thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t border-primary/5 align-top">
                <td className="p-3 font-bold text-primary">{o.refCode}</td>
                <td className="p-3">
                  <div>{o.customerName}</div>
                  <div className="text-xs text-muted-foreground mt-1 max-w-xs">{o.address}</div>
                  <div className="mt-2 space-y-1">
                    {o.items.map(i => <div key={i.bookId} className="text-xs text-muted-foreground">• {i.titleFa} × {i.qty}</div>)}
                  </div>
                </td>
                <td className="p-3">{o.phone}</td>
                <td className="p-3">{formatToman(o.subtotalToman)}</td>
                <td className="p-3">
                  <select value={o.status} onChange={e => update(o.id, e.target.value)} className="rounded-lg bg-parchment border border-primary/15 px-2 py-1 text-sm">
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
            {orders.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-muted-foreground">هنوز سفارشی ثبت نشده.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
