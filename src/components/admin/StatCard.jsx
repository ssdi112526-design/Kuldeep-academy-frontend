import { displayZero } from '../../utils/zeroEmpty';

export default function StatCard({ label, value, icon: Icon, loading }) {
  const shown = loading ? '...' : displayZero(value);
  return (
    <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
      {Icon && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-light text-brand">
          <Icon size={20} />
        </div>
      )}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-1 text-2xl font-bold text-ink">{shown}</p>
      </div>
    </div>
  );
}
