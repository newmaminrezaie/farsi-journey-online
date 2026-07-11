import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { booksApi, cartApi, formatToman } from "@/lib/api";
import { levelFa } from "./Home";
import { toast } from "sonner";
import { ShoppingBag, ArrowRight, Truck, ShieldCheck, RotateCcw } from "lucide-react";

export default function ShopDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: book } = useQuery({ queryKey: ["book", id], queryFn: () => booksApi.get(id!), enabled: !!id });

  if (!book) return <div className="container py-40 text-center text-muted-foreground">در حال بارگذاری…</div>;

  return (
    <section className="container py-16">
      <Link to="/shop" className="inline-flex items-center gap-2 text-primary mb-8"><ArrowRight className="h-4 w-4" /> بازگشت به فروشگاه کتاب</Link>
      <div className="grid md:grid-cols-2 gap-12">
        <div className="warm-photo-overlay rounded-3xl overflow-hidden">
          <img src={book.coverUrl} alt={book.titleFa} className="w-full h-[560px] object-cover warm-photo" />
        </div>
        <div>
          <div className="flex gap-2 mb-4">
            <span className="chip-gold">{levelFa(book.level)}</span>
            <span className="chip">{book.category}</span>
          </div>
          <h1 className="text-4xl md:text-5xl mb-3 text-primary">{book.titleFa}</h1>
          {book.titleEn && <p className="text-lg text-muted-foreground italic mb-2">{book.titleEn}</p>}
          <p className="text-primary/70 mb-6">اثر: {book.author}</p>
          <p className="text-primary/80 leading-8 mb-8">{book.descriptionFa}</p>

          <div className="bg-card rounded-3xl p-6 border border-primary/10 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground">قیمت</div>
                <div className="text-3xl font-black text-primary">{formatToman(book.priceToman)}</div>
              </div>
              <div className="text-sm text-turquoise font-bold">{book.stock.toLocaleString("fa-IR")} عدد موجود</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { cartApi.add(book.id); toast.success("به سبد خرید افزوده شد."); }} className="btn-primary">
                <ShoppingBag className="h-5 w-5" /> افزودن به سبد
              </button>
              <button onClick={() => { cartApi.add(book.id); nav("/cart"); }} className="btn-gold">خرید فوری</button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Feature icon={<Truck className="h-5 w-5" />} title="ارسال سریع" />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} title="اصالت کتاب" />
            <Feature icon={<RotateCcw className="h-5 w-5" />} title="بازگشت ۷ روزه" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="bg-card rounded-2xl p-4 border border-primary/10 text-center">
      <div className="w-10 h-10 rounded-full bg-gold/15 text-gold mx-auto mb-2 flex items-center justify-center">{icon}</div>
      <div className="text-xs font-bold text-primary">{title}</div>
    </div>
  );
}
