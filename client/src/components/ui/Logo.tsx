/** TripSync mark: a kilometre stone with a yellow crown and a two-stop route on its face. */
export function LogoMark({ className = 'size-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M6 29V14.5a10 10 0 0 1 20 0V29z" fill="var(--surface)" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M6 14.5a10 10 0 0 1 20 0z" fill="var(--accent)" stroke="var(--ink)" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M11.5 24.5c3.5 0 5-2.5 9-2.5" fill="none" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="11.5" cy="24.5" r="1.7" fill="var(--ink)" />
      <circle cx="20.5" cy="22" r="1.7" fill="var(--ink)" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight">TripSync</span>
    </span>
  );
}
