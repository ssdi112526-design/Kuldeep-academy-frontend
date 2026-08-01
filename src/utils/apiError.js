/** Extract a user-facing message from an Axios/API error. */
export function getApiErrorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (!data) {
    if (err?.message === 'Network Error') return 'Network error. Please check your connection.';
    return err?.message || fallback;
  }

  if (typeof data.message === 'string' && data.message.trim()) {
    return data.message;
  }

  const errors = data.errors;
  if (Array.isArray(errors) && errors.length) {
    const first = errors[0];
    if (typeof first === 'string') return first;
    if (first?.msg) return first.msg;
    if (first?.message) return first.message;
  }

  if (typeof errors === 'string') return errors;

  return fallback;
}
