export default function Logo({ className = '', mark = true, wordmark = true }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {mark && (
        <svg
          viewBox="0 0 40 40"
          className="h-9 w-9 shrink-0"
          aria-hidden="true"
          role="img"
        >
          <circle cx="20" cy="20" r="19" fill="#1f2a45" />
          <circle cx="20" cy="20" r="11" fill="none" stroke="#cca96a" strokeWidth="2" />
          <circle cx="20" cy="20" r="4" fill="#cca96a" />
          <path d="M5 30 L35 30" stroke="#faf6ec" strokeWidth="1.5" opacity="0.4" />
        </svg>
      )}
      {wordmark && (
        <div className="leading-tight">
          <div className="font-serif text-navy-900 text-base font-semibold">
            Assumption
          </div>
          <div className="text-[11px] uppercase tracking-[0.18em] text-stone-400 -mt-0.5">
            Learning Lens
          </div>
        </div>
      )}
    </div>
  );
}