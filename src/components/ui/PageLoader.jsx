import logoImg from '../../assets/logo.webp';

/**
 * Full-page branded loader — used on refresh / route load.
 */
export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-white via-[#F8FAFC] to-[#EFF6FF]">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#2563EB]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#F59E0B]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col items-center px-6" role="status" aria-live="polite" aria-label={message}>
        <div className="relative flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-[#2563EB]/15" />
          <span className="absolute inset-0 animate-spin rounded-full border-2 border-[#2563EB]/15 border-t-[#2563EB]" />
          <img
            src={logoImg}
            alt="Raghunandan Akhada"
            className="relative h-14 w-14 rounded-full object-contain shadow-[0_8px_24px_rgba(37,99,235,0.2)]"
          />
        </div>

        <p className="mt-6 font-display text-base font-bold tracking-tight text-[#071A35]">
          Raghunandan <span className="text-[#2563EB]">Akhada</span>
        </p>
        <p className="mt-2 text-sm text-[#6B7280]">{message}</p>

        <div className="mt-5 flex items-center gap-1.5" aria-hidden>
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2563EB] [animation-delay:-0.3s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#2563EB] [animation-delay:-0.15s]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#F59E0B]" />
        </div>
      </div>
    </div>
  );
}

/** Compact loader for tables / panels */
export function PanelLoader({ message = 'Loading data...' }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-slate-100 bg-white px-4 py-16 shadow-sm">
      <div className="relative flex h-14 w-14 items-center justify-center" role="status" aria-label={message}>
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-brand/15 border-t-brand" />
        <img src={logoImg} alt="" className="relative h-9 w-9 rounded-full object-contain" />
      </div>
      <p className="mt-4 text-sm font-medium text-ink">{message}</p>
      <div className="mt-5 w-full max-w-md space-y-2.5 px-4" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-lg bg-slate-100"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
