import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import Logo from '../ui/Logo';
import LanguageSwitcher from '../LanguageSwitcher';
import { navLinks } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { hash, pathname } = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
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

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 1280px)').matches) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const isActive = (href) => {
    if (href === '/#home') return pathname === '/' && (!hash || hash === '#home' || hash === '');
    if (href === '/login') return pathname.startsWith('/login') || pathname.startsWith('/admin') || pathname.startsWith('/student');
    return hash && href.endsWith(hash);
  };

  const navCtaClass =
    'inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-[#2563EB] px-5 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(37,99,235,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1D4ED8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40';

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#E5E7EB] bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md md:backdrop-blur-xl'
          : 'border-b border-transparent bg-white/95 md:bg-white/90 md:backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6 lg:px-8">
        <div className="min-w-0 shrink">
          <Logo />
        </div>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-x-3 xl:flex 2xl:gap-x-5"
          aria-label="Primary"
        >
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative shrink-0 whitespace-nowrap text-[12px] font-medium transition 2xl:text-[13px] ${
                  active ? 'text-[#111827]' : 'text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                {t(link.labelKey)}
                {active && (
                  <span className="absolute -bottom-1 left-0 h-0.5 w-full rounded-full bg-[#2563EB]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LanguageSwitcher />
          {/* Match desktop nav breakpoint (xl) so CTAs never show without the link row */}
          <div className="hidden xl:inline-grid xl:grid-cols-2 xl:gap-2">
            <Link to="/#contact" className={navCtaClass}>
              {t('nav.join')}
            </Link>
            <Link
              to="/login"
              className={`${navCtaClass} ${isActive('/login') ? 'bg-[#1D4ED8]' : ''}`}
            >
              {t('nav.login')}
            </Link>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-[#111827] xl:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-nav-panel"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <HiX size={22} /> : <HiMenuAlt3 size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-nav-panel"
          className="max-h-[min(80vh,calc(100dvh-4.5rem))] overflow-y-auto border-t border-[#E5E7EB] bg-white px-4 py-4 xl:hidden"
        >
          <nav className="flex flex-col gap-1" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive(link.href)
                    ? 'bg-[#EFF6FF] text-[#2563EB]'
                    : 'text-[#374151] hover:bg-[#F8FAFC]'
                }`}
                onClick={() => setOpen(false)}
              >
                {t(link.labelKey)}
              </Link>
            ))}
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Link to="/#contact" onClick={() => setOpen(false)} className={`${navCtaClass} h-11 w-full`}>
                {t('nav.join')}
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className={`${navCtaClass} h-11 w-full ${isActive('/login') ? 'bg-[#1D4ED8]' : ''}`}
              >
                {t('nav.login')}
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
