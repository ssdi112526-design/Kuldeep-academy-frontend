import kuldeepImg from '../../assets/akhada/coaches/kuldeep-malik.webp';

/**
 * Full-page branded loader — used on refresh / route load.
 */
export default function PageLoader({ message = 'Loading...' }) {
  return (
    <div className="fixed inset-0 z-[100] flex min-h-screen flex-col items-center justify-center bg-[#F8F7F2]">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#D97706]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-[#0B3D2E]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col items-center px-6" role="status" aria-live="polite" aria-label={message}>
        <div className="relative flex h-24 w-24 items-center justify-center">
          <span className="absolute inset-0 animate-pulse rounded-full border border-[#D97706]/40" />
          <img
            src={kuldeepImg}
            alt="Kuldeep Malik Sports Academy"
            className="relative h-20 w-20 rounded-full object-cover object-top shadow-[0_8px_24px_rgba(7,26,43,0.12)] ring-1 ring-[#D97706]/25"
          />
        </div>

        <p className="mt-6 font-display text-base font-extrabold tracking-tight text-[#071A2B]">
          Kuldeep Malik <span className="text-[#D97706]">Sports Academy</span>
        </p>
        <p className="mt-2 text-sm text-[#64748B]">{message}</p>
      </div>
    </div>
  );
}

/** Compact loader for tables / panels */
export function PanelLoader({ message = 'Loading data...' }) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-[14px] border border-[#E9E7DE] bg-white px-4 py-16 shadow-sm">
      <div className="relative flex h-14 w-14 items-center justify-center" role="status" aria-label={message}>
        <span className="absolute inset-0 animate-pulse rounded-full border border-[#D97706]/40" />
        <img src={kuldeepImg} alt="" className="relative h-10 w-10 rounded-full object-cover object-top" />
      </div>
      <p className="mt-4 text-sm font-medium text-[#071A2B]">{message}</p>
      <div className="mt-5 w-full max-w-md space-y-2.5 px-4" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-10 animate-pulse rounded-[10px] bg-[#F8F7F2]"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
