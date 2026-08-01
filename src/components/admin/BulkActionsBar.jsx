import { FaFileCsv, FaFileExcel, FaTrash, FaTimes } from 'react-icons/fa';

export default function BulkActionsBar({ count, onExport, onBulkDelete, onClear, exporting, canExport, canDelete }) {
  if (count === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brand/20 bg-brand-light px-4 py-3">
      <span className="text-sm font-semibold text-ink">{count} selected</span>

      {canExport ? (
        <button
          type="button"
          onClick={() => onExport('csv')}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
        >
          <FaFileCsv /> Export CSV
        </button>
      ) : null}

      {canExport ? (
        <button
          type="button"
          onClick={() => onExport('xlsx')}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-60"
        >
          <FaFileExcel /> Export Excel
        </button>
      ) : null}

      {canDelete ? (
        <button
          type="button"
          onClick={onBulkDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <FaTrash /> Delete Selected
        </button>
      ) : null}

      <button
        type="button"
        onClick={onClear}
        className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-ink"
      >
        <FaTimes /> Clear
      </button>
    </div>
  );
}
