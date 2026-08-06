import { useEffect, useState } from 'react';
import Button from '../ui/Button';
import AccessDenied from './AccessDenied';
import FeeReceiptModal from './FeeReceiptModal';
import ValidationPopup from '../ui/ValidationPopup';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { financeService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { getApiErrorMessage } from '../../utils/apiError';
import { mediaUrl } from '../../utils/mediaUrl';
import { inr, PAYMENT_MODES, MONTHS, currentMonthYear } from '../../utils/financeUi';

const inputClass =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';
const inputErrorClass =
  'w-full rounded-lg border border-red-400 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200';

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function fieldClass(hasError) {
  return hasError ? inputErrorClass : inputClass;
}

export default function CollectFeesPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('finance');
  const canCreate = can('finance.create');

  const cy = currentMonthYear();
  const [q, setQ] = useState('');
  const debouncedQ = useDebouncedValue(q, 350);
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState(null);

  const [month, setMonth] = useState(cy.month);
  const [year, setYear] = useState(cy.year);
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const [form, setForm] = useState({
    feeAmount: '',
    previousDue: '',
    discount: '',
    paidAmount: '',
    paymentMode: 'Cash',
    transactionReference: '',
    remarks: '',
    paymentDate: todayISO(),
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [validation, setValidation] = useState({ open: false, title: '', message: '' });
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);

  useEffect(() => {
    if (!canView || !debouncedQ.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearching(true);
      try {
        const res = await financeService.searchStudents(debouncedQ.trim());
        if (!cancelled) setResults(res.data.data.students || []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [debouncedQ, canView]);

  useEffect(() => {
    if (!student) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setPreviewLoading(true);
      try {
        const res = await financeService.collectPreview({
          studentId: student.id || student._id,
          month,
          year,
        });
        if (cancelled) return;
        const data = res.data.data;
        setPreview(data);
        setFieldErrors({});
        setForm((f) => ({
          ...f,
          feeAmount: data.feeAmount ?? '',
          previousDue: data.previousDue ?? 0,
          discount: data.discount ?? 0,
          paidAmount: data.totalOutstanding > 0 ? data.totalOutstanding : '',
        }));
      } catch (err) {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, 'Failed to load preview'));
          setPreview(null);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, month, year]);

  const feeAmount = Number(form.feeAmount) || 0;
  const previousDue = Number(form.previousDue) || 0;
  const discount = Number(form.discount) || 0;
  const paidAmount = Number(form.paidAmount) || 0;
  const remaining = Math.max(0, feeAmount + previousDue - discount - paidAmount);

  const selectStudent = (s) => {
    setStudent(s);
    setQ('');
    setResults([]);
    setFieldErrors({});
  };

  const showValidation = (title, message) => {
    setValidation({ open: true, title, message });
  };

  const validateCollect = () => {
    const errors = {};
    if (!student) {
      showValidation('Student required', 'Please search and select a student before collecting fees.');
      return false;
    }
    if (!Number.isFinite(Number(year)) || Number(year) < 2000) {
      errors.year = 'Enter a valid year';
    }
    if (form.feeAmount === '' || Number(form.feeAmount) < 0 || Number.isNaN(Number(form.feeAmount))) {
      errors.feeAmount = 'Enter a valid fee amount (0 or more)';
    }
    if (Number(form.feeAmount) === 0 && previousDue <= 0) {
      errors.feeAmount = 'Fee amount or previous due must be greater than zero';
    }
    if (form.discount !== '' && (Number(form.discount) < 0 || Number.isNaN(Number(form.discount)))) {
      errors.discount = 'Discount cannot be negative';
    }
    if (discount > feeAmount + previousDue) {
      errors.discount = 'Discount cannot be more than fee + previous due';
    }
    if (form.paidAmount === '' || Number.isNaN(Number(form.paidAmount)) || paidAmount <= 0) {
      errors.paidAmount = 'Paid amount must be greater than zero';
    }
    if (!form.paymentMode) {
      errors.paymentMode = 'Select payment mode';
    }
    if (
      (form.paymentMode === 'UPI' || form.paymentMode === 'BankTransfer') &&
      !String(form.transactionReference || '').trim()
    ) {
      errors.transactionReference = 'Transaction / reference number is required for UPI and Bank Transfer';
    }
    if (!form.paymentDate) {
      errors.paymentDate = 'Payment date is required';
    } else {
      const d = new Date(form.paymentDate);
      if (Number.isNaN(d.getTime())) errors.paymentDate = 'Invalid payment date';
    }
    if (String(form.remarks || '').length > 500) {
      errors.remarks = 'Remarks must be 500 characters or less';
    }
    if (String(form.transactionReference || '').length > 120) {
      errors.transactionReference = 'Reference must be 120 characters or less';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      showValidation('Please fix the form', Object.values(errors)[0]);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreate) {
      showValidation('Access denied', 'You do not have permission to collect fees.');
      return;
    }
    if (!validateCollect()) return;

    setSaving(true);
    try {
      const res = await financeService.collect({
        studentId: student.id || student._id,
        month: Number(month),
        year: Number(year),
        feeAmount,
        discount,
        paidAmount,
        paymentMode: form.paymentMode,
        transactionReference: form.transactionReference.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        paymentDate: form.paymentDate || undefined,
      });
      toast.success(res.data.message || 'Fee collected');
      setFieldErrors({});
      setReceipt(res.data.data.payment);
      setForm((f) => ({
        ...f,
        paidAmount: '',
        transactionReference: '',
        remarks: '',
        paymentDate: todayISO(),
      }));
      const prev = await financeService.collectPreview({
        studentId: student.id || student._id,
        month,
        year,
      });
      setPreview(prev.data.data);
    } catch (err) {
      showValidation('Collection failed', getApiErrorMessage(err, 'Collection failed'));
    } finally {
      setSaving(false);
    }
  };

  if (!canView) return <AccessDenied />;
  if (!canCreate) {
    return (
      <AccessDenied
        title="403 — Access Denied"
        message="You need finance.create permission to collect fees."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Collect fees</h2>
        <p className="mt-1 text-sm text-muted">Manual entry — Cash / UPI / Bank Transfer.</p>

        <label className="mt-4 block text-xs font-medium text-muted">
          Search student
          <input
            type="text"
            className={`mt-1 ${inputClass}`}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name, registration no, or mobile"
          />
        </label>
        {(searching || results.length > 0) && (
          <ul className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50">
            {searching && <li className="px-3 py-2 text-sm text-muted">Searching…</li>}
            {!searching &&
              results.map((s) => (
                <li key={s.id || s._id}>
                  <button
                    type="button"
                    onClick={() => selectStudent(s)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-white"
                  >
                    {s.photo ? (
                      <img src={mediaUrl(s.photo)} alt="" className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold">
                        {(s.fullName || '?').slice(0, 1)}
                      </div>
                    )}
                    <span className="flex-1">
                      <span className="font-medium text-ink">{s.fullName}</span>
                      <span className="ml-2 text-xs text-muted">{s.registrationNumber}</span>
                    </span>
                    <span className="text-xs text-muted">Due {inr(s.previousDue)}</span>
                  </button>
                </li>
              ))}
          </ul>
        )}

        {student && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3">
            {student.photo ? (
              <img src={mediaUrl(student.photo)} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold">
                {(student.fullName || '?').slice(0, 1)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-ink">{student.fullName}</p>
              <p className="text-xs text-muted">
                {student.registrationNumber} · {student.mobileNumber || '—'}
              </p>
            </div>
            <button
              type="button"
              className="text-xs font-medium text-brand hover:underline"
              onClick={() => {
                setStudent(null);
                setPreview(null);
                setFieldErrors({});
              }}
            >
              Change
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block text-xs font-medium text-muted">
            Month
            <select
              className={`mt-1 ${inputClass}`}
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
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
              min="2000"
              className={`mt-1 ${fieldClass(fieldErrors.year)}`}
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
            />
            {fieldErrors.year ? <p className="mt-1 text-xs text-red-600">{fieldErrors.year}</p> : null}
          </label>
        </div>

        {previewLoading && <p className="mt-4 text-sm text-muted">Loading preview…</p>}

        {preview && !previewLoading && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3" noValidate>
            <p className="text-xs text-muted">
              {preview.monthLabel} · Status:{' '}
              <span className="font-semibold text-ink">{preview.status}</span>
              {preview.totalOutstanding != null && (
                <> · Outstanding {inr(preview.totalOutstanding)}</>
              )}
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-muted">
                Fee amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${fieldClass(fieldErrors.feeAmount)}`}
                  value={form.feeAmount}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, feeAmount: e.target.value }));
                    setFieldErrors((err) => ({ ...err, feeAmount: undefined }));
                  }}
                  required
                />
                {fieldErrors.feeAmount ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.feeAmount}</p>
                ) : null}
              </label>
              <label className="block text-xs font-medium text-muted">
                Previous due
                <input
                  type="number"
                  className={`mt-1 ${inputClass} bg-slate-50`}
                  value={form.previousDue}
                  readOnly
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Discount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${fieldClass(fieldErrors.discount)}`}
                  value={form.discount}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, discount: e.target.value }));
                    setFieldErrors((err) => ({ ...err, discount: undefined }));
                  }}
                />
                {fieldErrors.discount ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.discount}</p>
                ) : null}
              </label>
              <label className="block text-xs font-medium text-muted">
                Paid amount
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 ${fieldClass(fieldErrors.paidAmount)}`}
                  value={form.paidAmount}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, paidAmount: e.target.value }));
                    setFieldErrors((err) => ({ ...err, paidAmount: undefined }));
                  }}
                  required
                />
                {fieldErrors.paidAmount ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.paidAmount}</p>
                ) : null}
              </label>
              <label className="block text-xs font-medium text-muted">
                Remaining (calc)
                <input
                  type="text"
                  className={`mt-1 ${inputClass} bg-slate-50`}
                  value={inr(remaining)}
                  readOnly
                />
              </label>
              <label className="block text-xs font-medium text-muted">
                Payment mode
                <select
                  className={`mt-1 ${fieldClass(fieldErrors.paymentMode)}`}
                  value={form.paymentMode}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, paymentMode: e.target.value }));
                    setFieldErrors((err) => ({
                      ...err,
                      paymentMode: undefined,
                      transactionReference: undefined,
                    }));
                  }}
                >
                  {PAYMENT_MODES.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium text-muted">
                Transaction reference
                {(form.paymentMode === 'UPI' || form.paymentMode === 'BankTransfer') && (
                  <span className="text-red-500"> *</span>
                )}
                <input
                  type="text"
                  maxLength={120}
                  className={`mt-1 ${fieldClass(fieldErrors.transactionReference)}`}
                  value={form.transactionReference}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, transactionReference: e.target.value }));
                    setFieldErrors((err) => ({ ...err, transactionReference: undefined }));
                  }}
                  placeholder={
                    form.paymentMode === 'UPI' || form.paymentMode === 'BankTransfer'
                      ? 'Required for UPI / Bank Transfer'
                      : 'Optional'
                  }
                />
                {fieldErrors.transactionReference ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.transactionReference}</p>
                ) : null}
              </label>
              <label className="block text-xs font-medium text-muted">
                Payment date
                <input
                  type="date"
                  className={`mt-1 ${fieldClass(fieldErrors.paymentDate)}`}
                  value={form.paymentDate}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, paymentDate: e.target.value }));
                    setFieldErrors((err) => ({ ...err, paymentDate: undefined }));
                  }}
                  required
                />
                {fieldErrors.paymentDate ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.paymentDate}</p>
                ) : null}
              </label>
              <label className="block text-xs font-medium text-muted sm:col-span-2">
                Remarks
                <textarea
                  rows={2}
                  maxLength={500}
                  className={`mt-1 ${fieldClass(fieldErrors.remarks)}`}
                  value={form.remarks}
                  onChange={(e) => {
                    setForm((f) => ({ ...f, remarks: e.target.value }));
                    setFieldErrors((err) => ({ ...err, remarks: undefined }));
                  }}
                />
                {fieldErrors.remarks ? (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.remarks}</p>
                ) : null}
              </label>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="submit" className="rounded-lg text-sm" disabled={saving}>
                {saving ? 'Collecting…' : 'Collect fee'}
              </Button>
            </div>
          </form>
        )}
      </div>

      <ValidationPopup
        open={validation.open}
        title={validation.title}
        message={validation.message}
        onClose={() => setValidation({ open: false, title: '', message: '' })}
      />

      {receipt && <FeeReceiptModal payment={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}
