import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { entryService, financeService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/apiError';
import { mediaUrl } from '../../utils/mediaUrl';
import { inr, feeStatusClass, PAYMENT_MODES, MONTHS, currentMonthYear } from '../../utils/financeUi';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function pagesOf(total, limit) {
  return Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 20)));
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const EMPTY_FORM = () => {
  const cy = currentMonthYear();
  return {
    coachId: '',
    month: cy.month,
    year: cy.year,
    baseSalary: '',
    bonus: '0',
    deduction: '0',
    paidAmount: '',
    paymentMode: 'Cash',
    transactionReference: '',
    remarks: '',
    paymentDate: todayISO(),
  };
};

export default function CoachPaymentsPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canCreate = can('finance.create');
  const canEdit = can('finance.edit');
  const canDelete = can('finance.delete');

  const [rows, setRows] = useState([]);
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const [modal, setModal] = useState({ open: false, editing: null, saving: false });
  const [form, setForm] = useState(EMPTY_FORM());
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const filtersKey = JSON.stringify({ debouncedSearch });
  const prevFiltersKeyRef = useRef(filtersKey);

  const baseSalary = Number(form.baseSalary) || 0;
  const bonus = Number(form.bonus) || 0;
  const deduction = Number(form.deduction) || 0;
  const netPayable = Math.max(0, baseSalary + bonus - deduction);

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await financeService.listCoachPayments({
        page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
      });
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
      setError(getApiErrorMessage(err, 'Failed to load coach payments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canView) return;
    (async () => {
      try {
        const res = await entryService.coaches.list({ page: 1, limit: 1000, status: 'Active' });
        setCoaches(res.data.data.coaches || []);
      } catch {
        setCoaches([]);
      }
    })();
  }, [canView]);

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

  const openCreate = () => {
    if (!canCreate) return;
    setForm(EMPTY_FORM());
    setModal({ open: true, editing: null, saving: false });
  };

  const openEdit = (row) => {
    if (!canEdit) return;
    setForm({
      coachId: row.coachId || row.coach?.id || '',
      month: row.month,
      year: row.year,
      baseSalary: row.baseSalary ?? '',
      bonus: row.bonus ?? 0,
      deduction: row.deduction ?? 0,
      paidAmount: row.paidAmount ?? '',
      paymentMode: row.paymentMode || 'Cash',
      transactionReference: row.transactionReference || '',
      remarks: row.remarks || '',
      paymentDate: row.paymentDate ? String(row.paymentDate).slice(0, 10) : todayISO(),
    });
    setModal({ open: true, editing: row, saving: false });
  };

  const onCoachChange = (coachId) => {
    const coach = coaches.find((c) => (c.id || c._id) === coachId);
    setForm((f) => ({
      ...f,
      coachId,
      baseSalary: coach?.salary != null ? coach.salary : f.baseSalary,
      paidAmount: coach?.salary != null ? coach.salary : f.paidAmount,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(modal.editing);
    if (isEdit && !canEdit) return;
    if (!isEdit && !canCreate) return;
    if (!form.coachId) {
      toast.error('Select a coach');
      return;
    }
    setModal((m) => ({ ...m, saving: true }));
    const payload = {
      coachId: form.coachId,
      month: Number(form.month),
      year: Number(form.year),
      baseSalary,
      bonus,
      deduction,
      paidAmount: Number(form.paidAmount) || 0,
      paymentMode: form.paymentMode,
      transactionReference: form.transactionReference.trim() || undefined,
      remarks: form.remarks.trim() || undefined,
      paymentDate: form.paymentDate || undefined,
    };
    try {
      if (isEdit) {
        await financeService.updateCoachPayment(modal.editing.id || modal.editing._id, payload);
        toast.success('Coach payment updated');
      } else {
        await financeService.makeCoachPayment(payload);
        toast.success('Coach payment recorded');
      }
      setModal({ open: false, editing: null, saving: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Save failed'));
      setModal((m) => ({ ...m, saving: false }));
    }
  };

  const handleDelete = async () => {
    if (!canDelete || !confirm.id) return;
    const deleteId = confirm.id;
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await financeService.deleteCoachPayment(deleteId);
      setRows((prev) => prev.filter((row) => (row._id || row.id) !== deleteId));
      toast.success('Coach payment deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((c) => ({ ...c, loading: false }));
      fetchList(pagination.page);
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search coach, voucher…" />
        {canCreate && (
          <Button className="rounded-lg text-sm" onClick={openCreate}>
            <FaPlus size={12} /> Make Payment
          </Button>
        )}
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
              <th className="px-4 py-3 font-semibold">Coach</th>
              <th className="px-4 py-3 font-semibold">Month</th>
              <th className="px-4 py-3 font-semibold">Net</th>
              <th className="px-4 py-3 font-semibold">Paid</th>
              <th className="px-4 py-3 font-semibold">Due</th>
              <th className="px-4 py-3 font-semibold">Status</th>
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
                  No coach payments
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id || r._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.coach?.photo ? (
                        <img
                          src={mediaUrl(r.coach.photo)}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-muted">
                          {(r.coach?.fullName || '?').slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-ink">{r.coach?.fullName}</p>
                        <p className="text-xs text-muted">
                          {r.coach?.coachCode} · {r.voucherNumber}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.monthLabel}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(r.netPayable)}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(r.paidAmount)}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(r.remainingAmount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${feeStatusClass(r.status)}`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-50"
                        >
                          <FaEdit size={11} /> Edit
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() =>
                            setConfirm({ open: true, id: r.id || r._id, loading: false })
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

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <form
            onSubmit={handleSave}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-slate-100 bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">
              {modal.editing ? 'Edit coach payment' : 'Make coach payment'}
            </h3>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-muted sm:col-span-2">
                Coach
                <select
                  className={`mt-1 ${inputClass}`}
                  value={form.coachId}
                  onChange={(e) => onCoachChange(e.target.value)}
                  required
                  disabled={Boolean(modal.editing)}
                >
                  <option value="">Select coach</option>
                  {coaches.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.fullName} ({c.coachCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-muted">
                Month
                <select
                  className={`mt-1 ${inputClass}`}
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))}
                  disabled={Boolean(modal.editing)}
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-muted">
                Year
                <input
                  type="number"
                  className={`mt-1 ${inputClass}`}
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))}
                  disabled={Boolean(modal.editing)}
                  required
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Salary
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={form.baseSalary}
                  onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Bonus
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={form.bonus}
                  onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Deduction
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={form.deduction}
                  onChange={(e) => setForm((f) => ({ ...f, deduction: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Net payable
                <input type="text" className={`mt-1 ${inputClass} bg-slate-50`} value={inr(netPayable)} readOnly />
              </label>
              <label className="block text-xs font-medium text-muted">
                Paid amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={form.paidAmount}
                  onChange={(e) => setForm((f) => ({ ...f, paidAmount: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Payment mode
                <select
                  className={`mt-1 ${inputClass}`}
                  value={form.paymentMode}
                  onChange={(e) => setForm((f) => ({ ...f, paymentMode: e.target.value }))}
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-muted">
                Payment date
                <input
                  type="date"
                  className={`mt-1 ${inputClass}`}
                  value={form.paymentDate}
                  onChange={(e) => setForm((f) => ({ ...f, paymentDate: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted sm:col-span-2">
                Reference
                <input
                  type="text"
                  className={`mt-1 ${inputClass}`}
                  value={form.transactionReference}
                  onChange={(e) => setForm((f) => ({ ...f, transactionReference: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted sm:col-span-2">
                Remarks
                <textarea
                  rows={2}
                  className={`mt-1 ${inputClass}`}
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg text-sm"
                onClick={() => setModal({ open: false, editing: null, saving: false })}
                disabled={modal.saving}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg text-sm" disabled={modal.saving}>
                {modal.saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Are you sure you want to delete this?"
        message="This soft-deletes the payment record. You can continue if this was entered in error."
        confirmLabel="Delete"
        danger
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
