import { FaExclamationCircle } from 'react-icons/fa';

/** Inline error banner for admin create/edit modals */
export default function FormErrorBanner({ message }) {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
    >
      <FaExclamationCircle className="mt-0.5 shrink-0" size={16} />
      <p className="min-w-0 flex-1 break-words">{message}</p>
    </div>
  );
}
