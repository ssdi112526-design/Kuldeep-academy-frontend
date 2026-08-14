import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiChevronDown, HiMenuAlt3, HiX } from 'react-icons/hi';
import DualBrandLogos from '../ui/DualBrandLogos';
import LanguageSwitcher from '../LanguageSwitcher';
import { publicNavLinks } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

function useHashActive() {
  const { hash, pathname } = useLocation();
  const isActive = (href) => {
    if (href === '/#home') return pathname === '/' && (!hash || hash === '#home' || hash === '');
    return Boolean(hash && href.endsWith(hash));
  };
  return { isActive, pathname, hash };
}

const loginLinks = [
  { to: '/login?portal=admin', labelKey: 'nav.adminLogin' },
  { to: '/login?portal=parent', labelKey: 'nav.parentsLogin' },
  { to: '/login?portal=player', labelKey: 'nav.playerLogin' },
];

function LoginMenu({ onNavigate, className = '' }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const closeTimer = useRef(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMenu = () => {
    clearCloseTimer();
    setOpen(true);
  };

  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        className="inline-flex h-8 items-center justify-center gap-1 rounded-full border border-white/30 bg-transparent px-3 text-[10px] font-bold uppercase tracking-[0.06em] text-white/90 transition hover:border-[#C9A227] hover:text-[#C9A227] xl:h-9 xl:px-3.5 xl:text-[11px]"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="navbar-login-menu"
        onClick={() => setOpen((v) => !v)}
      >
        {t('nav.login')}
        <HiChevronDown className={`transition ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      <div
        id="navbar-login-menu"
        role="menu"
        aria-label={t('nav.login')}
        className={`absolute right-0 top-full z-[70] min-w-[12.5rem] pt-2 transition ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#141110] shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
          {loginLinks.map((item) => (
            <Link
              key={item.to}
              role="menuitem"
              to={item.to}
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="block border-b border-white/5 px-4 py-3 text-[12px] font-semibold tracking-[0.04em] text-white/85 transition last:border-b-0 hover:bg-white/5 hover:text-[#C9A227]"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileLoginOpen, setMobileLoginOpen] = useState(false);
  const { t } = useTranslation();
  const { isActive, pathname, hash } = useHashActive();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMobileLoginOpen(false);
  }, [pathname, hash]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-[60] pt-[env(safe-area-inset-top,0px)]">
        <div
          className={`border-b transition-all duration-300 ${
            scrolled || open
              ? 'border-white/10 bg-[#0C0A09]/95 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-md'
              : 'border-transparent bg-[#0C0A09]/75 backdrop-blur-sm'
          }`}
        >
          <div className="mx-auto flex h-[4.25rem] max-w-[90rem] items-center justify-between gap-2 px-3 sm:px-5 lg:gap-3 lg:px-6 xl:px-8">
            <Link to="/" className="min-w-0 shrink" aria-label={t('brand.name')}>
              <DualBrandLogos size="md" showText invert />
            </Link>

            <nav className="hidden items-center gap-5 xl:gap-7 2xl:flex" aria-label="Primary">
              {publicNavLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`relative whitespace-nowrap text-[13px] font-semibold tracking-[0.04em] transition ${
                      active ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {t(item.labelKey)}
                    {active ? (
                      <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#C9A227]" aria-hidden />
                    ) : null}
                  </Link>
                );
              })}
            </nav>

            <nav className="hidden items-center gap-4 lg:flex 2xl:hidden" aria-label="Primary compact">
              {publicNavLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`relative whitespace-nowrap text-[12px] font-semibold tracking-[0.03em] transition ${
                      active ? 'text-white' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>

            <div className="flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2">
              <div className="hidden lg:block">
                <LoginMenu />
              </div>
              <LanguageSwitcher invert />
              <Link
                to="/#inquire"
                className="hidden h-9 items-center justify-center rounded-full bg-[#C9A227] px-3.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#0C0A09] transition hover:bg-[#b8911f] lg:inline-flex xl:px-4 xl:text-[11px]"
              >
                {t('nav.inquireNow')}
              </Link>
              <button
                type="button"
                className="rounded-lg p-2 text-white transition hover:bg-white/10 lg:hidden"
                aria-label={open ? 'Close menu' : 'Open menu'}
                aria-expanded={open}
                aria-controls="mobile-nav-panel"
                onClick={() => setOpen((v) => !v)}
              >
                {open ? <HiX size={22} /> : <HiMenuAlt3 size={22} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {open ? (
        <div
          id="mobile-nav-panel"
          className="fixed inset-x-0 bottom-0 top-[4.25rem] z-[55] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#0C0A09] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <nav className="mx-auto flex max-w-lg flex-col px-4 py-6" aria-label="Mobile">
            {publicNavLinks.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-3.5 text-[15px] font-semibold ${
                  isActive(item.href) ? 'bg-white/10 text-white' : 'text-[#D6D3D1] hover:bg-white/5'
                }`}
              >
                {t(item.labelKey)}
              </Link>
            ))}

            <div className="mt-4 border-t border-white/10 pt-4">
              <button
                type="button"
                className="flex w-full items-center justify-between rounded-xl px-3 py-3.5 text-left text-[15px] font-semibold text-white"
                aria-expanded={mobileLoginOpen}
                onClick={() => setMobileLoginOpen((v) => !v)}
              >
                {t('nav.login')}
                <HiChevronDown className={`transition ${mobileLoginOpen ? 'rotate-180' : ''}`} aria-hidden />
              </button>
              {mobileLoginOpen ? (
                <div className="mt-1 space-y-1 pb-2 pl-2" role="menu">
                  {loginLinks.map((item) => (
                    <Link
                      key={item.to}
                      role="menuitem"
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="block rounded-xl px-3 py-3 text-[14px] font-medium text-[#D6D3D1] hover:bg-white/5 hover:text-[#C9A227]"
                    >
                      {t(item.labelKey)}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 px-3 py-3">
              <span className="text-sm font-semibold text-[#A8A29E]">{t('lang.switch')}</span>
              <LanguageSwitcher invert />
            </div>

            <Link
              to="/#inquire"
              onClick={() => setOpen(false)}
              className="mt-5 inline-flex h-12 items-center justify-center rounded-full bg-[#C9A227] text-sm font-bold uppercase tracking-[0.08em] text-[#0C0A09]"
            >
              {t('nav.inquireNow')}
            </Link>
          </nav>
        </div>
      ) : null}
    </>
  );
}
