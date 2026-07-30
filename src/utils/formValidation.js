export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const AADHAAR_REGEX = /^[0-9]{12}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const PHONE_LOOSE_REGEX = /^[+\d][\d\s-]{7,18}$/;

export const inputBase =
  'mt-1.5 w-full rounded-xl border px-3 py-2.5 outline-none transition focus:ring-2 focus:ring-brand/20';
export const inputOk = 'border-slate-200 focus:border-brand';
export const inputErr = 'border-red-400 focus:border-red-500 focus:ring-red-200';

export function fieldClass(errors, key, extra = '') {
  return `${inputBase} ${errors?.[key] ? inputErr : inputOk} ${extra}`.trim();
}

export function firstErrorMessage(errors, order = []) {
  if (!errors || typeof errors !== 'object') return '';
  const keys = order.length ? order : Object.keys(errors);
  const key = keys.find((k) => errors[k]);
  return key ? errors[key] : Object.values(errors)[0] || '';
}

export function requiredText(value, label, min = 2) {
  const v = String(value || '').trim();
  if (!v) return `${label} is required`;
  if (v.length < min) return `${label} must be at least ${min} characters`;
  return '';
}

export function validateIndianMobile(value, label = 'Mobile number', required = true) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return required ? `${label} is required` : '';
  if (!PHONE_REGEX.test(digits)) return `${label} must be a valid 10-digit Indian number`;
  return '';
}

export function validateOptionalPhone(value, label = 'Phone') {
  const v = String(value || '').trim();
  if (!v) return '';
  const digits = v.replace(/\D/g, '');
  if (digits.length === 10 && PHONE_REGEX.test(digits)) return '';
  if (PHONE_LOOSE_REGEX.test(v)) return '';
  return `${label} is invalid`;
}

export function validateEmail(value, { required = false } = {}) {
  const v = String(value || '').trim();
  if (!v) return required ? 'Email is required' : '';
  if (!EMAIL_REGEX.test(v)) return 'Please enter a valid email address';
  return '';
}

export function validateAadhaar(value, { required = true } = {}) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return required ? 'Aadhaar number is required' : '';
  if (!AADHAAR_REGEX.test(digits)) return 'Aadhaar must be exactly 12 digits';
  return '';
}

export function validatePan(value, { required = true } = {}) {
  const pan = String(value || '').trim().toUpperCase();
  if (!pan) return required ? 'PAN number is required' : '';
  if (!PAN_REGEX.test(pan)) return 'PAN must be in format ABCDE1234F';
  return '';
}

export function validateDate(value, label, { required = true, maxToday = false } = {}) {
  const v = String(value || '').trim();
  if (!v) return required ? `${label} is required` : '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return `${label} is invalid`;
  if (maxToday) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) return `${label} cannot be in the future`;
  }
  return '';
}

export function normalizeAadhaar(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 12);
}

export function normalizePan(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 10);
}

export function normalizeMobile(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}
