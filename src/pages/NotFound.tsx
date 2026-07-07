import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex items-center justify-center text-center">
      <div>
        <div className="text-8xl font-black text-gold mb-4">۴۰۴</div>
        <h1 className="text-3xl text-primary mb-3">صفحه یافت نشد</h1>
        <p className="text-muted-foreground mb-6">آدرس مورد نظر وجود ندارد یا حذف شده است.</p>
        <Link to="/" className="btn-primary">بازگشت به خانه</Link>
      </div>
    </section>
  );
}
