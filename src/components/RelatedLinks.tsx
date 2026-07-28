import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

type LinkItem = { to: string; label: string; desc: string };

/** SEO-friendly internal linking block with descriptive anchor text. */
export default function RelatedLinks({
  title = "پیوندهای مرتبط",
  links,
}: {
  title?: string;
  links: LinkItem[];
}) {
  return (
    <nav aria-label={title} className="container py-14">
      <h2 className="text-2xl md:text-3xl text-primary mb-6">{title}</h2>
      <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map((l) => (
          <li key={l.to}>
            <Link
              to={l.to}
              title={l.label}
              className="group flex items-start gap-3 p-4 rounded-2xl border border-primary/10 bg-card hover:border-gold/40 hover:shadow-soft transition-all"
            >
              <ArrowLeft className="h-4 w-4 mt-1 text-gold shrink-0 group-hover:-translate-x-1 transition-transform" />
              <span>
                <span className="block font-bold text-primary">{l.label}</span>
                <span className="block text-xs text-muted-foreground mt-0.5 leading-6">{l.desc}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
