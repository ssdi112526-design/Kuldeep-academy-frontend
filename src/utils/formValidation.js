export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
export const AADHAAR_REGEX = /^[0-9]{12}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[6-9]\d{9}$/;
export const PHONE_LOOSE_REGEX = /^[+\d][\d\s-]{7,18}$/;
export const URL_REGEX = /^https?:\/\/.+/i;

export const INT4_MAX = 2147483647;
export const MONEY_MAX_DEFAULT = '9999999999999999.99';
export const MONEY_MAX_EQUIPMENT = '999999999999.99';

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

export function requiredText(value, label, min = 1, max = 500) {
  const v = String(value || '').trim();
  if (!v) return `${label} is required`;
  if (v.length < min) return `${label} must be at least ${min} characters`;
  if (v.length > max) return `${label} must be at most ${max} characters`;
  return '';
}

export function optionalText(value, label, max = 2000) {
  const v = String(value || '').trim();
  if (!v) return '';
  if (v.length > max) return `${label} must be at most ${max} characters`;
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

export function validateDate(value, label, { required = true, maxToday = false, minToday = false } = {}) {
  const v = String(value || '').trim();
  if (!v) return required ? `${label} is required` : '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return `${label} is invalid`;
  if (maxToday) {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (d > today) return `${label} cannot be in the future`;
  }
  if (minToday) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (d < today) return `${label} cannot be in the past`;
  }
  return '';
}

export function validateUrl(value, label = 'URL', { required = false } = {}) {
  const v = String(value || '').trim();
  if (!v) return required ? `${label} is required` : '';
  if (!URL_REGEX.test(v)) return `${label} must start with http:// or https://`;
  return '';
}

export function validatePassword(value, { required = true, min = 6, strong = false } = {}) {
  const v = String(value || '');
  if (!v) return required ? 'Password is required' : '';
  if (v.length < min) return `Password must be at least ${min} characters`;
  if (strong && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v)) {
    return 'Password must include upper, lower and a number (8+ characters)';
  }
  return '';
}

export function validateConfirmPassword(password, confirm) {
  if (String(password || '') !== String(confirm || '')) return 'Passwords do not match';
  return '';
}

export function validateRequiredSelect(value, label) {
  if (value === undefined || value === null || String(value).trim() === '') {
    return `${label} is required`;
  }
  return '';
}

/** Money / decimal with up to 2 places — avoids float math. */
export function validateMoney(
  value,
  label = 'Amount',
  { required = false, max = MONEY_MAX_DEFAULT, allowZero = true } = {}
) {
  const raw = String(value ?? '').trim().replace(/,/g, '');
  if (!raw) return required ? `${label} is required` : '';
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) {
    return `${label} must be a valid number with up to 2 decimal places`;
  }
  const [whole, frac = ''] = raw.split('.');
  const maxWhole = String(max).split('.')[0];
  if (whole.length > maxWhole.length || (whole.length === maxWhole.length && whole > maxWhole)) {
    return `${label} is too large`;
  }
  if (!allowZero && Number(raw) === 0) return `${label} must be greater than 0`;
  if (frac.length > 2) return `${label} can have at most 2 decimal places`;
  return '';
}

export function validateInt4(value, label, { required = false, min = 0, max = INT4_MAX } = {}) {
  const raw = String(value ?? '').trim();
  if (!raw) return required ? `${label} is required` : '';
  if (!/^\d+$/.test(raw)) return `${label} must be a whole number`;
  const n = Number(raw);
  if (!Number.isSafeInteger(n) || n < min || n > max) {
    return `${label} must be between ${min} and ${max}`;
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

/** Strip technical Prisma/Postgres noise if it ever reaches the client. */
export function sanitizeUserErrorMessage(message, fallback = 'Something went wrong') {
  const msg = String(message || '').trim();
  if (!msg) return fallback;
  if (/Invalid `prisma\.|PrismaClient|ConnectorError|PostgresError|invocation:/i.test(msg)) {
    if (/numeric field overflow|22P03|binary data format/i.test(msg)) {
      return 'One numeric value is invalid or too large. Please check amount or cost fields.';
    }
    if (/Unable to fit integer|INT4/i.test(msg)) {
      return 'A number is too large for this field. Please enter a smaller value.';
    }
    if (/foreign key|RESTRICT|violates/i.test(msg)) {
      return 'This record is linked to other data and cannot be changed that way.';
    }
    if (/Unique constraint|P2002/i.test(msg)) {
      return 'A record with this value already exists.';
    }
    return 'Could not save. Please check your input and try again.';
  }
  return msg;
}
