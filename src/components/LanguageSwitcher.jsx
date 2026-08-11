import { useEffect, useId, useRef, useState } from 'react';
import { HiChevronDown } from 'react-icons/hi';
import { FiGlobe } from 'react-icons/fi';
import useTranslation from '../hooks/useTranslation';

const OPTIONS = [
  { code: 'en', labelKey: 'lang.english', short: 'EN' },
  { code: 'hi', labelKey: 'lang.hindi', short: 'HI' },
];

export default function LanguageSwitcher({ invert = false }) {
  const { language, setLanguage, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const listId = useId();

  useEffect(() => {
    const onPointer = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const current = OPTIONS.find((o) => o.code === language) || OPTIONS[0];
  const trigger = invert
    ? 'border-white/20 bg-white/5 text-white hover:bg-white/10'
    : 'border-[#E9E7DE] bg-white/90 text-[#071A2B] hover:bg-white';

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={`inline-flex h-9 items-center gap-1.5 rounded-[12px] border px-2.5 text-[12px] font-bold backdrop-blur-md transition sm:px-3 ${trigger}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('lang.switch')}
        onClick={() => setOpen((v) => !v)}
      >
        <FiGlobe className="text-[#F5A400]" size={14} aria-hidden />
        <span className="hidden sm:inline">{t(current.labelKey)}</span>
        <span className="sm:hidden">{current.short}</span>
        <HiChevronDown className={`opacity-70 transition ${open ? 'rotate-180' : ''}`} size={13} aria-hidden />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('lang.switch')}
          className="absolute right-0 z-[70] mt-2 min-w-[148px] overflow-hidden rounded-[12px] border border-[#E9E7DE] bg-white p-1 shadow-[0_16px_40px_rgba(7,26,43,0.12)]"
        >
          {OPTIONS.map((opt) => {
            const selected = language === opt.code;
            return (
              <li key={opt.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-sm font-medium transition ${
                    selected
                      ? 'bg-[#F8F7F2] text-[#0B3D2E]'
                      : 'text-[#64748B] hover:bg-[#F8F7F2] hover:text-[#071A2B]'
                  }`}
                  onClick={() => {
                    setLanguage(opt.code);
                    setOpen(false);
                  }}
                >
                  <span className="w-6 text-[11px] font-bold text-[#D97706]">{opt.short}</span>
                  {t(opt.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
