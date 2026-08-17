import { useState } from 'react';
import { FaDownload, FaPrint } from 'react-icons/fa';
import Button from '../../ui/Button';
import { reportsService } from '../../../services';
import { triggerBlobDownload, parseBlobError } from '../../../utils/downloadBlob';

export const reportInputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

export function ReportExportBar({ reportKey, filters = {}, canExport, canPrint, toast }) {
  const [busy, setBusy] = useState('');

  const doExport = async (format) => {
    if (!canExport) {
      toast?.error?.('No export permission');
      return;
    }
    setBusy(format);
    try {
      const res = await reportsService.export(reportKey, { ...filters, format });
      const mime =
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      triggerBlobDownload(
        new Blob([res.data], { type: mime }),
        `${reportKey}-${new Date().toISOString().slice(0, 10)}.${format}`
      );
      toast?.success?.('Export downloaded');
    } catch (err) {
      toast?.error?.(await parseBlobError(err));
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 print:hidden">
      {canExport && (
        <>
          <Button
            type="button"
            variant="secondary"
            className="rounded-lg text-sm"
            disabled={!!busy}
            onClick={() => doExport('xlsx')}
          >
            <FaDownload size={12} /> {busy === 'xlsx' ? '…' : 'Excel'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="rounded-lg text-sm"
            disabled={!!busy}
            onClick={() => doExport('csv')}
          >
            <FaDownload size={12} /> {busy === 'csv' ? '…' : 'CSV'}
          </Button>
        </>
      )}
      {canPrint && (
        <Button
          type="button"
          variant="secondary"
          className="rounded-lg text-sm"
          onClick={() => window.print()}
        >
          <FaPrint size={12} /> Print
        </Button>
      )}
    </div>
  );
}

export function SimpleBars({ items = [], maxHeight = 120 }) {
  const max = Math.max(1, ...items.map((i) => Number(i.value) || 0));
  const colorMap = {
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-400',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    gold: 'bg-amber-400',
    silver: 'bg-slate-400',
    bronze: 'bg-orange-700',
  };
  return (
    <div className="flex h-[140px] items-end gap-2">
      {items.map((item) => {
        const h = Math.round(((Number(item.value) || 0) / max) * maxHeight);
        return (
          <div key={item.label} className="flex min-w-[2.5rem] flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold tabular-nums text-ink">{item.value}</span>
            <div
              className={`w-full rounded-t ${colorMap[item.color] || 'bg-brand'}`}
              style={{ height: `${Math.max(4, h)}px` }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="max-w-full truncate text-center text-[10px] text-muted">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export function ReportStatCard({ label, value, onClick, accent }) {
  const Comp = onClick ? 'button' : 'div';
  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-xl border border-slate-100 bg-white p-4 text-left shadow-sm ${
        onClick ? 'cursor-pointer transition hover:border-brand/40 hover:shadow' : ''
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent || 'text-ink'}`}>{value}</p>
    </Comp>
  );
}

export function ReportTable({ columns, rows, loading, empty = 'No records', onRowClick }) {
  const clickable = typeof onRowClick === 'function';

  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white print:border-0">
      <table className="min-w-full text-left text-sm">
        <thead className="sticky top-0 z-[1] border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-3 font-semibold whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">
                Loading…
              </td>
            </tr>
          ) : !rows?.length ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-10 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr
                key={row.id || row._id || idx}
                tabIndex={clickable ? 0 : undefined}
                aria-label={clickable ? `View details for ${row.fullName || 'player'}` : undefined}
                onClick={clickable ? () => onRowClick(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                className={`border-b border-slate-50 last:border-0 ${
                  clickable
                    ? 'cursor-pointer transition-colors hover:bg-brand/5 focus-visible:bg-brand/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40'
                    : ''
                }`}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-3 py-2.5 whitespace-nowrap">
                    {c.render ? c.render(row) : row[c.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export function currentMonthYear() {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

export function medalBadge(medal) {
  const m = String(medal || '');
  const cls = /gold/i.test(m)
    ? 'bg-amber-100 text-amber-800'
    : /silver/i.test(m)
      ? 'bg-slate-200 text-slate-700'
      : /bronze/i.test(m)
        ? 'bg-orange-100 text-orange-800'
        : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {m || '—'}
    </span>
  );
}

export function feeStatusBadge(status) {
  const s = String(status || '');
  const cls = /paid/i.test(s)
    ? 'bg-emerald-100 text-emerald-800'
    : /partial/i.test(s)
      ? 'bg-amber-100 text-amber-800'
      : 'bg-red-100 text-red-800';
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>
      {s || '—'}
    </span>
  );
}
