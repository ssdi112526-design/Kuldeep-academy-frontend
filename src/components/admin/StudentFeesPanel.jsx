import { useEffect, useMemo, useRef, useState } from 'react';
import { FaEdit, FaHistory, FaPlus } from 'react-icons/fa';
import Button from '../ui/Button';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import AccessDenied from './AccessDenied';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { financeService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/apiError';
import { mediaUrl } from '../../utils/mediaUrl';
import { inr, feeStatusClass, MONTHS, currentMonthYear, feeCategoryLabel } from '../../utils/financeUi';
import { validateMoney } from '../../utils/formValidation';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

function pagesOf(total, limit) {
  return Math.max(1, Math.ceil((Number(total) || 0) / (Number(limit) || 20)));
}

function parseAmountOrZero(value) {
  const raw = String(value ?? '').trim().replace(/,/g, '');
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export default function StudentFeesPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canCreate = can('finance.create');
  const canEdit = can('finance.edit');

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const [editModal, setEditModal] = useState({ open: false, student: null, saving: false });
  const [defaults, setDefaults] = useState({
    monthlyFee: '',
    hostelFee: '',
    otherFee: '',
    admissionFee: '',
    defaultDiscount: '',
  });

  const [historyModal, setHistoryModal] = useState({ open: false, student: null, loading: false, rows: [] });

  const cy = currentMonthYear();
  const [genOpen, setGenOpen] = useState(false);
  const [genForm, setGenForm] = useState({
    month: cy.month,
    year: cy.year,
    monthlyFee: '',
    hostelFee: '',
    otherFee: '',
    saveAsStudentDefault: true,
  });
  const [genErrors, setGenErrors] = useState({});
  const [genSaving, setGenSaving] = useState(false);

  const genTotal = useMemo(() => {
    return (
      parseAmountOrZero(genForm.monthlyFee) +
      parseAmountOrZero(genForm.hostelFee) +
      parseAmountOrZero(genForm.otherFee)
    );
  }, [genForm.monthlyFee, genForm.hostelFee, genForm.otherFee]);

  const filtersKey = JSON.stringify({ debouncedSearch });
  const prevFiltersKeyRef = useRef(filtersKey);

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await financeService.listStudents({
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
      setError(getApiErrorMessage(err, 'Failed to load students'));
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

  const openEdit = (student) => {
    if (!canEdit) return;
    setDefaults({
      monthlyFee: student.monthlyFee ?? '',
      hostelFee: student.hostelFee ?? '',
      otherFee: student.otherFee ?? '',
      admissionFee: student.admissionFee ?? '',
      defaultDiscount: student.defaultDiscount ?? '',
    });
    setEditModal({ open: true, student, saving: false });
  };

  const saveDefaults = async (e) => {
    e.preventDefault();
    if (!canEdit || !editModal.student) return;
    setEditModal((s) => ({ ...s, saving: true }));
    try {
      await financeService.updateStudentDefaults(editModal.student.id || editModal.student._id, {
        monthlyFee: Number(defaults.monthlyFee) || 0,
        hostelFee: Number(defaults.hostelFee) || 0,
        otherFee: Number(defaults.otherFee) || 0,
        admissionFee: Number(defaults.admissionFee) || 0,
        defaultDiscount: Number(defaults.defaultDiscount) || 0,
      });
      toast.success('Fee defaults updated');
      setEditModal({ open: false, student: null, saving: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update defaults'));
      setEditModal((s) => ({ ...s, saving: false }));
    }
  };

  const openHistory = async (student) => {
    setHistoryModal({ open: true, student, loading: true, rows: [] });
    try {
      const res = await financeService.studentHistory(student.id || student._id);
      setHistoryModal({ open: true, student, loading: false, rows: res.data.data.history || [] });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load history'));
      setHistoryModal({ open: true, student, loading: false, rows: [] });
    }
  };

  const openGenerate = () => {
    // Prefill from first listed player's defaults when available
    const sample = rows[0];
    setGenForm({
      month: cy.month,
      year: cy.year,
      monthlyFee: sample?.monthlyFee != null && Number(sample.monthlyFee) > 0 ? String(sample.monthlyFee) : '',
      hostelFee: sample?.hostelFee != null && Number(sample.hostelFee) > 0 ? String(sample.hostelFee) : '',
      otherFee: sample?.otherFee != null && Number(sample.otherFee) > 0 ? String(sample.otherFee) : '',
      saveAsStudentDefault: true,
    });
    setGenErrors({});
    setGenOpen(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!canCreate) return;

    const errors = {};
    const monthlyErr = validateMoney(genForm.monthlyFee, 'Monthly Fees', { required: false });
    const hostelErr = validateMoney(genForm.hostelFee, 'Hostel Fees', { required: false });
    const otherErr = validateMoney(genForm.otherFee, 'Other Fees', { required: false });
    if (monthlyErr) errors.monthlyFee = monthlyErr;
    if (hostelErr) errors.hostelFee = hostelErr;
    if (otherErr) errors.otherFee = otherErr;

    const anyFilled =
      String(genForm.monthlyFee).trim() !== '' ||
      String(genForm.hostelFee).trim() !== '' ||
      String(genForm.otherFee).trim() !== '';

    if (anyFilled && genTotal <= 0) {
      errors.total = 'Enter at least one fee amount greater than zero';
    }
    if (!anyFilled) {
      // Allowed: use each player's saved defaults — no client total required
    }

    if (Object.keys(errors).length) {
      setGenErrors(errors);
      toast.error(errors.total || errors.monthlyFee || errors.hostelFee || errors.otherFee || 'Please check fee amounts');
      return;
    }

    setGenSaving(true);
    setGenErrors({});
    try {
      const res = await financeService.generateMonthly({
        month: Number(genForm.month),
        year: Number(genForm.year),
        monthlyFee: genForm.monthlyFee,
        hostelFee: genForm.hostelFee,
        otherFee: genForm.otherFee,
        saveAsStudentDefault: Boolean(genForm.saveAsStudentDefault),
      });
      toast.success(res.data.message || 'Fees generated');
      setGenOpen(false);
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to generate fees'));
    } finally {
      setGenSaving(false);
    }
  };

  if (!canView) return <AccessDenied />;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search name, reg no, mobile…"
        />
        {canCreate && (
          <Button className="rounded-lg text-sm" onClick={openGenerate}>
            <FaPlus size={12} /> Generate Fees
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
              <th className="px-4 py-3 font-semibold">Player</th>
              <th className="px-4 py-3 font-semibold">Monthly</th>
              <th className="px-4 py-3 font-semibold">Hostel</th>
              <th className="px-4 py-3 font-semibold">Other</th>
              <th className="px-4 py-3 font-semibold">Current due</th>
              <th className="px-4 py-3 font-semibold">Total paid</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  No students found
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr key={s.id || s._id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {s.photo ? (
                        <img
                          src={mediaUrl(s.photo)}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-muted">
                          {(s.fullName || '?').slice(0, 1)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-ink">{s.fullName}</p>
                        <p className="text-xs text-muted">{s.registrationNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{inr(s.monthlyFee)}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(s.hostelFee)}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(s.otherFee)}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(s.currentDue)}</td>
                  <td className="px-4 py-3 tabular-nums">{inr(s.totalPaid)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${feeStatusClass(s.feeStatus)}`}
                    >
                      {s.feeStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openHistory(s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-slate-50"
                      >
                        <FaHistory size={11} /> History
                      </button>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => openEdit(s)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-slate-50"
                        >
                          <FaEdit size={11} /> Set Fee
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
            onSubmit={saveDefaults}
            className="w-full max-w-md rounded-xl border border-slate-100 bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">Set Fee Defaults</h3>
            <p className="mt-1 text-sm text-muted">
              {editModal.student?.fullName} — Monthly, Hostel and Other fee defaults.
            </p>
            <div className="mt-4 space-y-3">
              <label className="block text-xs font-medium text-muted">
                Monthly Fees
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={defaults.monthlyFee}
                  onChange={(e) => setDefaults((d) => ({ ...d, monthlyFee: e.target.value }))}
                  required
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Hostel Fees
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={defaults.hostelFee}
                  onChange={(e) => setDefaults((d) => ({ ...d, hostelFee: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Other Fees
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={defaults.otherFee}
                  onChange={(e) => setDefaults((d) => ({ ...d, otherFee: e.target.value }))}
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Default discount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${inputClass}`}
                  value={defaults.defaultDiscount}
                  onChange={(e) => setDefaults((d) => ({ ...d, defaultDiscount: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg text-sm"
                onClick={() => setEditModal({ open: false, student: null, saving: false })}
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

      {historyModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-100 bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-ink">Fee history</h3>
                <p className="mt-1 text-sm text-muted">{historyModal.student?.fullName}</p>
              </div>
              <Button
                variant="secondary"
                className="rounded-lg text-sm"
                onClick={() => setHistoryModal({ open: false, student: null, loading: false, rows: [] })}
              >
                Close
              </Button>
            </div>
            {historyModal.loading ? (
              <p className="mt-8 text-center text-sm text-muted">Loading…</p>
            ) : historyModal.rows.length === 0 ? (
              <p className="mt-8 text-center text-sm text-muted">No fee months yet</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase text-muted">
                    <tr>
                      <th className="px-2 py-2">Month</th>
                      <th className="px-2 py-2">Type</th>
                      <th className="px-2 py-2">Fee</th>
                      <th className="px-2 py-2">Paid</th>
                      <th className="px-2 py-2">Due</th>
                      <th className="px-2 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyModal.rows.map((h) => (
                      <tr key={h.id || h._id} className="border-b border-slate-50">
                        <td className="px-2 py-2">{h.monthLabel}</td>
                        <td className="px-2 py-2">
                          {feeCategoryLabel(h.category)}
                          {h.title ? <span className="block text-[11px] text-muted">{h.title}</span> : null}
                        </td>
                        <td className="px-2 py-2 tabular-nums">
                          {inr(h.feeAmount)}
                          {(Number(h.monthlyAmount) > 0 ||
                            Number(h.hostelAmount) > 0 ||
                            Number(h.otherAmount) > 0) && (
                            <span className="mt-0.5 block text-[10px] text-muted">
                              M {inr(h.monthlyAmount || 0)} · H {inr(h.hostelAmount || 0)} · O{' '}
                              {inr(h.otherAmount || 0)}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2 tabular-nums">{inr(h.paidAmount)}</td>
                        <td className="px-2 py-2 tabular-nums">{inr(h.remainingDue)}</td>
                        <td className="px-2 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${feeStatusClass(h.status)}`}
                          >
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {genOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-3 sm:p-4">
          <form
            onSubmit={handleGenerate}
            className="flex max-h-[min(92dvh,38rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
          >
            <div className="shrink-0 border-b border-slate-100 px-5 py-3.5">
              <h3 className="text-lg font-bold text-ink">Generate Fees</h3>
              <p className="mt-0.5 text-sm text-muted">One bill per active player for the selected month</p>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-xs font-semibold text-ink">
                  Month
                  <select
                    className={`mt-1 ${inputClass}`}
                    value={genForm.month}
                    onChange={(e) => setGenForm((f) => ({ ...f, month: Number(e.target.value) }))}
                  >
                    {MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-xs font-semibold text-ink">
                  Year
                  <input
                    type="number"
                    min="2000"
                    className={`mt-1 ${inputClass}`}
                    value={genForm.year}
                    onChange={(e) => setGenForm((f) => ({ ...f, year: Number(e.target.value) }))}
                    required
                  />
                </label>
              </div>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                {[
                  { key: 'monthlyFee', label: 'Monthly Fees', hint: 'Training / academy', placeholder: '2,000' },
                  { key: 'hostelFee', label: 'Hostel Fees', hint: 'Accommodation', placeholder: '5,000' },
                  { key: 'otherFee', label: 'Other Fees', hint: 'Extra charges', placeholder: '1,000' },
                ].map((row, idx) => (
                  <label
                    key={row.key}
                    className={`flex items-center gap-3 px-3 py-2.5 ${idx > 0 ? 'border-t border-slate-100' : ''}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-ink">{row.label}</span>
                      <span className="block text-[11px] text-muted">{row.hint}</span>
                      {genErrors[row.key] ? (
                        <span className="mt-0.5 block text-[11px] text-red-600">{genErrors[row.key]}</span>
                      ) : null}
                    </span>
                    <span className="relative w-[7.75rem] shrink-0">
                      <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder={row.placeholder}
                        className={`w-full rounded-lg border py-2 pl-6 pr-2 text-right text-sm tabular-nums outline-none focus:ring-2 focus:ring-brand/20 ${
                          genErrors[row.key]
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-slate-200 focus:border-brand'
                        }`}
                        value={genForm[row.key]}
                        onChange={(e) => {
                          setGenForm((f) => ({ ...f, [row.key]: e.target.value }));
                          setGenErrors((err) => ({ ...err, [row.key]: undefined, total: undefined }));
                        }}
                      />
                    </span>
                  </label>
                ))}

                <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-3 py-3">
                  <div>
                    <p className="text-sm font-bold text-ink">Total Fees</p>
                    {genErrors.total ? (
                      <p className="text-[11px] text-red-600">{genErrors.total}</p>
                    ) : (
                      <p className="text-[11px] text-muted">Monthly + Hostel + Other</p>
                    )}
                  </div>
                  <p className="text-xl font-extrabold tabular-nums text-brand">{inr(genTotal)}</p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5 text-xs leading-snug text-ink">
                <input
                  type="checkbox"
                  className="mt-0.5 shrink-0"
                  checked={genForm.saveAsStudentDefault}
                  onChange={(e) =>
                    setGenForm((f) => ({ ...f, saveAsStudentDefault: e.target.checked }))
                  }
                />
                <span>
                  <span className="font-semibold">Save as player defaults</span>
                  <span className="mt-0.5 block text-muted">
                    Also update each player&apos;s Monthly / Hostel / Other defaults. Leave amounts
                    empty to use existing defaults.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-3">
              <Button
                type="button"
                variant="secondary"
                className="rounded-lg text-sm"
                onClick={() => setGenOpen(false)}
                disabled={genSaving}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-lg text-sm" disabled={genSaving}>
                {genSaving ? 'Generating…' : 'Generate / Replace'}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
