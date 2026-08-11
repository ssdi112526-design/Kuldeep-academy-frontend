import { useEffect, useRef, useState } from 'react';
import { FaDownload, FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';
import FeeReceiptModal from './FeeReceiptModal';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { financeService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/apiError';
import { triggerBlobDownload, parseBlobError } from '../../utils/downloadBlob';
import { inr, PAYMENT_MODES, MONTHS, currentMonthYear } from '../../utils/financeUi';

const inputClass =
  'rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function pagesOf(total, limit) {
  return Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 20)));
}

export default function PaymentHistoryPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canEdit = can('finance.edit');
  const canDelete = can('finance.delete');
  const canExport = can('finance.export');

  const cy = currentMonthYear();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [mode, setMode] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [exporting, setExporting] = useState(false);

  const [receipt, setReceipt] = useState(null);
  const [editModal, setEditModal] = useState({ open: false, payment: null, saving: false });
  const [editForm, setEditForm] = useState({
    amount: '',
    paymentMode: 'Cash',
    transactionReference: '',
    remarks: '',
    paymentDate: '',
  });
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const filtersKey = JSON.stringify({ debouncedSearch, month, year, mode, status });
  const prevFiltersKeyRef = useRef(filtersKey);

  const buildParams = (page) => ({
    page,
    limit: pagination.limit,
    search: debouncedSearch.trim() || undefined,
    month: month || undefined,
    year: year || undefined,
    paymentMode: mode || undefined,
    status: status || undefined,
  });

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await financeService.listPayments(buildParams(page));
      const data = res.data.data;
      const total = data.total ?? 0;
      const limit = data.limit ?? pagination.limit;
      setRows(data.rows || []);
      setPagination((prev) => ({
        ...prev,
        page: data.page || page,
        limit,
        total,
        pages: pagesOf(total, limit),
      }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load payments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    const filtersChanged = prevFiltersKeyRef.current !== filtersKey;
    prevFiltersKeyRef.current = filtersKey;
    if (filtersChanged && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }
    fetchList(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView, pagination.page, pagination.limit, filtersKey]);

  const viewReceipt = async (id) => {
    try {
      const res = await financeService.getReceipt(id);
      setReceipt(res.data.data.payment);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load receipt'));
    }
  };

  const openEdit = (p) => {
    if (!canEdit) return;
    setEditForm({
      amount: p.amount ?? '',
      paymentMode: p.paymentMode || 'Cash',
      transactionReference: p.transactionReference || '',
      remarks: p.remarks || '',
      paymentDate: p.paymentDate ? String(p.paymentDate).slice(0, 10) : '',
    });
    setEditModal({ open: true, payment: p, saving: false });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!canEdit || !editModal.payment) return;
    setEditModal((m) => ({ ...m, saving: true }));
    try {
      await financeService.updatePayment(editModal.payment.id || editModal.payment._id, {
        amount: Number(editForm.amount),
        paymentMode: editForm.paymentMode,
        transactionReference: editForm.transactionReference.trim() || undefined,
        remarks: editForm.remarks.trim() || undefined,
        paymentDate: editForm.paymentDate || undefined,
      });
      toast.success('Payment updated');
      setEditModal({ open: false, payment: null, saving: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Update failed'));
      setEditModal((m) => ({ ...m, saving: false }));
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !confirm.id) return;
    const deleteId = confirm.id;
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await financeService.deletePayment(deleteId);
      setRows((prev) => prev.filter((row) => (row._id || row.id) !== deleteId));
      toast.success('Payment deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((c) => ({ ...c, loading: false }));
      fetchList(pagination.page);
    }
  };

  const handleExport = async (format) => {
    if (!canExport) {
      toast.error('You do not have permission to export');
      return;
    }
    setExporting(true);
    try {
      const res = await financeService.exportPayments({
        format,
        search: debouncedSearch.trim() || undefined,
        month: month || undefined,
        year: year || undefined,
        paymentMode: mode || undefined,
        status: status || undefined,
      });
      const mime =
        format === 'csv'
          ? 'text/csv'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      triggerBlobDownload(
        new Blob([res.data], { type: mime }),
        `fee-payments-${new Date().toISOString().slice(0, 10)}.${format}`
      );
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(await parseBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search receipt, student…" />
        {canExport && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={exporting}
              onClick={() => handleExport('xlsx')}
            >
              <FaDownload size={12} /> Excel
            </Button>
            <Button
              variant="secondary"
              className="rounded-lg text-sm"
              disabled={exporting}
              onClick={() => handleExport('csv')}
            >
              <FaDownload size={12} /> CSV
            </Button>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <select
          className={inputClass}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">All months</option>
          {MONTHS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          className={`${inputClass} w-28`}
          placeholder={`Year (${cy.year})`}
          value={year}
          onChange={(e) => setYear(e.target.value)}
        />
        <select className={inputClass} value={mode} onChange={(e) => setMode(e.target.value)}>
          <option value="">All modes</option>
          {PAYMENT_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="Paid">Paid</option>
          <option value="Partial">Partial</option>
          <option value="Due">Due</option>
          <option value="Overdue">Overdue</option>
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="px-4 py-3 font-semibold">Receipt</th>
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-4 py-3 font-semibold">Month</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">Mode</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted">
                  No payments found
                </td>
              </tr>
            ) : (
              rows.map((p) => (
                <tr key={p.id || p._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{p.receiptNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{p.student?.fullName}</p>
                    <p className="text-xs text-muted">{p.student?.registrationNumber}</p>
                  </td>
                  <td className="px-4 py-3">{p.monthLabel}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(p.amount)}</td>
                  <td className="px-4 py-3">{p.paymentMode}</td>
                  <td className="px-4 py-3 text-xs text-muted">
                    {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => viewReceipt(p.id || p._id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                      >
                        <FaEye size={11} /> Receipt
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(p)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          <FaEdit size={11} /> Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({ open: true, id: p.id || p._id, loading: false })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                        >
                          <FaTrash size={11} /> Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onLimitChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
      />

      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <form
            onSubmit={saveEdit}
            className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">Edit payment</h3>
            <p className="mt-1 font-mono text-xs text-muted">{editModal.payment?.receiptNumber}</p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-muted">
                Amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 w-full ${inputClass}`}
                  value={editForm.amount}
                  onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Mode
                <select
                  className={`mt-1 w-full ${inputClass}`}
                  value={editForm.paymentMode}
                  onChange={(e) => setEditForm((f) => ({ ...f, paymentMode: e.target.value }))}
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-muted">
                Date
                <input
                  type="date"
                  className={`mt-1 w-full ${inputClass}`}
                  value={editForm.paymentDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, paymentDate: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Reference
                <input
                  type="text"
                  className={`mt-1 w-full ${inputClass}`}
                  value={editForm.transactionReference}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, transactionReference: e.target.value }))
                  }
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Remarks
                <textarea
                  rows={2}
                  className={`mt-1 w-full ${inputClass}`}
                  value={editForm.remarks}
                  onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg text-sm"
                onClick={() => setEditModal({ open: false, payment: null, saving: false })}
                disabled={editModal.saving}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg text-sm" disabled={editModal.saving}>
                {editModal.saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Are you sure you want to delete this?"
        message="This soft-deletes the payment and recalculates the fee month."
        confirmLabel="Delete"
        danger
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />

      {receipt && <FeeReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
