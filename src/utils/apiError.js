import { sanitizeUserErrorMessage } from './formValidation';

/** Extract a user-facing message from an Axios/API error. */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (!data) {
    if (err?.message === 'Network Error') {
      return 'Network error. For video uploads, wait for the server to wake and try a smaller MP4, or retry in a minute.';
    }
    return sanitizeUserErrorMessage(err?.message, fallback);
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return sanitizeUserErrorMessage(data.message, fallback);
  }

  const errors = data.errors;
  if (Array.isArray(errors) && errors.length) {
    const first = errors[0];
    if (typeof first === 'string') return sanitizeUserErrorMessage(first, fallback);
    if (first?.msg) return sanitizeUserErrorMessage(first.msg, fallback);
    if (first?.message) return sanitizeUserErrorMessage(first.message, fallback);
  }

  if (typeof errors === 'string') return sanitizeUserErrorMessage(errors, fallback);

  return fallback;
}
