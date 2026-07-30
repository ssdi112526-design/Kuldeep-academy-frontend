import { FaExclamationCircle } from 'react-icons/fa';
import Button from './Button';

export default function ValidationPopup({ open, title, message, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-[#111827]/55 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="validation-popup-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-[24px] bg-white p-8 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500">
          <FaExclamationCircle size={34} />
        </div>
        <h3 id="validation-popup-title" className="mt-5 font-display text-xl font-bold text-[#111827]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">{message}</p>
        <Button type="button" className="mt-6 w-full sm:w-auto" onClick={onClose}>
          OK
        </Button>
      </div>
    </div>
  );
}
