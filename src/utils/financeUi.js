/**
 * Central INR formatter for the entire Finance module.
 * Whole rupees → ₹2,000
 * With paise → ₹1,999.99
 * Does not invent rounding beyond 2 decimal places of the stored value.
 */
export function formatCurrencyINR(value) {
  const n = Number(value);
  const amount = Number.isFinite(n) ? n : 0;
  const cents = Math.round(amount * 100);
  const hasPaise = cents % 100 !== 0;
  const normalized = cents / 100;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(normalized);
}

/** @deprecated Prefer formatCurrencyINR — kept as alias for existing imports */
export function inr(value) {
  return formatCurrencyINR(value);
}

export function paymentModeLabel(mode) {
  const map = {
    Cash: 'Cash',
    UPI: 'UPI',
    BankTransfer: 'Bank Transfer',
    Other: 'Other',
  };
  return map[mode] || mode || '—';
}

export function feeStatusClass(status) {
  switch (status) {
    case 'Paid':
      return 'bg-emerald-50 text-emerald-700';
    case 'Partial':
      return 'bg-amber-50 text-amber-700';
    case 'Overdue':
      return 'bg-red-50 text-red-700';
    case 'Due':
    case 'Pending':
      return 'bg-orange-50 text-orange-700';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export const PAYMENT_MODES = [
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BankTransfer', label: 'Bank Transfer' },
  { value: 'Other', label: 'Other' },
];

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

export function formatFinanceDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
