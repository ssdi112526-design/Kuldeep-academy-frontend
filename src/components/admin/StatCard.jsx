import { displayZero } from '../../utils/zeroEmpty';

export default function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  iconClass = 'bg-brand-light text-brand',
  className = '',
}) {
  const shown = loading ? '...' : displayZero(value);
  return (
    <div
      className={`flex h-full items-center gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm sm:gap-4 sm:p-5 ${className}`}
    >
      {Icon && (
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl sm:h-11 sm:w-11 ${iconClass}`}
        >
          <Icon size={18} />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 text-xl font-bold text-ink sm:text-2xl">{shown}</p>
      </div>
    </div>
  );
}
