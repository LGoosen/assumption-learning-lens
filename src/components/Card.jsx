export default function Card({
  title,
  subtitle,
  icon: Icon,
  actions,
  className = '',
  children,
}) {
  return (
    <section className={`card ${className}`} aria-label={title || undefined}>
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-start gap-3 min-w-0">
            {Icon && (
              <span className="mt-1 inline-flex items-center justify-center w-9 h-9 rounded-lg bg-navy-50 text-navy-700 shrink-0">
                <Icon className="w-5 h-5" aria-hidden="true" />
              </span>
            )}
            <div className="min-w-0">
              {title && (
                <h2 className="text-lg font-semibold text-navy-900 truncate">
                  {title}
                </h2>
              )}
              {subtitle && (
                <p className="text-sm text-stone-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}