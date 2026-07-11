import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { booksApi, cartApi, formatToman } from "@/lib/api";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";

export default function Cart() {
  const { data: books = [] } = useQuery({ queryKey: ["books"], queryFn: () => booksApi.list() });
  const [items, setItems] = useState(cartApi.read());
  useEffect(() => { setItems(cartApi.read()); }, []);

  function refresh() { setItems(cartApi.read()); }
  const rows = items.map(i => {
    const b = books.find(bk => bk.id === i.bookId);
    return b ? { ...i, book: b, line: i.qty * b.priceToman } : null;
  }).filter(Boolean) as any[];
  const total = rows.reduce((s, r) => s + r.line, 0);

  return (
    <section className="container py-16 max-w-4xl">
      <h1 className="text-4xl mb-8 text-primary">سبد خرید</h1>
      {rows.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-3xl border border-primary/10">
          <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground mb-6">سبد خرید شما خالی است.</p>
          <Link to="/shop" className="btn-primary">رفتن به فروشگاه کتاب</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.bookId} className="bg-card rounded-2xl p-4 border border-primary/10 flex items-center gap-4">
                <img src={r.book.coverUrl} alt="" className="w-20 h-24 rounded-lg object-cover" />
                <div className="flex-1">
                  <Link to={`/shop/${r.book.id}`} className="text-primary font-bold hover:text-gold">{r.book.titleFa}</Link>
                  <div className="text-sm text-muted-foreground mt-1">{formatToman(r.book.priceToman)}</div>
                </div>
                <div className="flex items-center gap-2 bg-parchment rounded-full border border-primary/10 p-1">
                  <button onClick={() => { cartApi.setQty(r.bookId, r.qty + 1); refresh(); }} className="p-1.5 hover:bg-gold/20 rounded-full"><Plus className="h-3 w-3" /></button>
                  <span className="w-6 text-center font-bold">{r.qty.toLocaleString("fa-IR")}</span>
                  <button onClick={() => { cartApi.setQty(r.bookId, r.qty - 1); refresh(); }} className="p-1.5 hover:bg-gold/20 rounded-full"><Minus className="h-3 w-3" /></button>
                </div>
                <div className="text-primary font-black w-32 text-left">{formatToman(r.line)}</div>
                <button onClick={() => { cartApi.remove(r.bookId); refresh(); }} className="p-2 text-destructive hover:bg-destructive/10 rounded-full"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <aside className="bg-primary text-primary-foreground rounded-3xl p-6 h-fit sticky top-24 relative overflow-hidden">
            <div className="absolute inset-0 tile-bg-navy opacity-40" />
            <div className="relative">
              <div className="text-sm text-primary-foreground/70 mb-1">مبلغ نهایی</div>
              <div className="text-3xl font-black text-gold mb-6">{formatToman(total)}</div>
              <Link to="/checkout" className="btn-gold w-full">ادامه فرآیند پرداخت</Link>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
