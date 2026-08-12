import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
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

const loginBtnBase =
  'inline-flex h-8 items-center justify-center rounded-full px-2.5 text-[10px] font-bold uppercase tracking-[0.06em] transition xl:h-9 xl:px-3.5 xl:text-[11px]';

const loginLinks = [
  { to: '/login?portal=admin', labelKey: 'nav.adminLogin', variant: 'outline' },
  { to: '/login?portal=parent', labelKey: 'nav.parentsLogin', variant: 'outline' },
  { to: '/login?portal=player', labelKey: 'nav.playerLogin', variant: 'gold' },
];

function LoginButton({ to, label, variant, className = '', onClick }) {
  const styles =
    variant === 'gold'
      ? 'bg-[#C9A227] text-[#0C0A09] hover:bg-[#b8911f]'
      : 'border border-white/30 bg-transparent text-white/90 hover:border-[#C9A227] hover:text-[#C9A227]';
  return (
    <Link to={to} onClick={onClick} className={`${loginBtnBase} ${styles} ${className}`}>
      {label}
    </Link>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
      <header className="fixed inset-x-0 top-0 z-[60]">
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

            {/* lg–2xl: compact nav links without taking full desktop space */}
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
              <div className="hidden items-center gap-1.5 lg:flex xl:gap-2">
                {loginLinks.map((item) => (
                  <LoginButton
                    key={item.to}
                    to={item.to}
                    label={t(item.labelKey)}
                    variant={item.variant}
                  />
                ))}
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

            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {loginLinks.map((item) => (
                <LoginButton
                  key={item.to}
                  to={item.to}
                  label={t(item.labelKey)}
                  variant={item.variant}
                  onClick={() => setOpen(false)}
                  className="h-11 w-full text-[12px]"
                />
              ))}
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
