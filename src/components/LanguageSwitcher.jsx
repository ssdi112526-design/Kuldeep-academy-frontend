import { useEffect, useId, useRef, useState } from 'react';
import { HiChevronDown } from 'react-icons/hi';
import { FiGlobe } from 'react-icons/fi';
import useTranslation from '../hooks/useTranslation';

const OPTIONS = [
  { code: 'en', flag: '🇺🇸', labelKey: 'lang.english' },
  { code: 'hi', flag: '🇮🇳', labelKey: 'lang.hindi' },
];

export default function LanguageSwitcher() {
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

  return (
    <div className="relative" ref={rootRef}>
      {/* Desktop trigger */}
      <button
        type="button"
        className="hidden items-center gap-1.5 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-[13px] font-semibold text-[#071A35] shadow-[0_4px_16px_rgba(0,0,0,0.06)] backdrop-blur-md transition hover:bg-white lg:inline-flex"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('lang.switch')}
        onClick={() => setOpen((v) => !v)}
      >
        <FiGlobe className="text-[#2563EB]" size={15} aria-hidden />
        <span>{t(current.labelKey)}</span>
        <HiChevronDown
          className={`text-[#6B7280] transition ${open ? 'rotate-180' : ''}`}
          size={14}
          aria-hidden
        />
      </button>

      {/* Mobile globe */}
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E5E7EB] bg-white/80 text-[#2563EB] shadow-sm backdrop-blur-md lg:hidden"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={t('lang.switch')}
        onClick={() => setOpen((v) => !v)}
      >
        <FiGlobe size={18} />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t('lang.switch')}
          className="absolute right-0 z-[60] mt-2 min-w-[160px] overflow-hidden rounded-2xl border border-white/50 bg-white/90 p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl"
        >
          {OPTIONS.map((opt) => {
            const selected = language === opt.code;
            return (
              <li key={opt.code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    selected
                      ? 'bg-[#EFF6FF] text-[#2563EB]'
                      : 'text-[#374151] hover:bg-[#F8FAFC]'
                  }`}
                  onClick={() => {
                    setLanguage(opt.code);
                    setOpen(false);
                  }}
                >
                  <span aria-hidden>{opt.flag}</span>
                  {t(opt.labelKey)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
