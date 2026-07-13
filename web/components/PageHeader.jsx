import Link from "next/link";

export default function PageHeader({ title, backHref, backLabel = "Back", action, subtitle }) {
  return (
    <div className="border-b border-ink/8 bg-linen/30">
      <div className="max-w-4xl mx-auto px-6 py-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="inline-flex items-center gap-1 text-sm text-ink/50 hover:text-moss mb-2 transition-colors"
            >
              <span aria-hidden="true">←</span> {backLabel}
            </Link>
          )}
          <h1 className="font-display text-2xl md:text-3xl text-ink">{title}</h1>
          {subtitle && <p className="text-sm text-ink/55 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0 pt-1">{action}</div>}
      </div>
    </div>
  );
}
