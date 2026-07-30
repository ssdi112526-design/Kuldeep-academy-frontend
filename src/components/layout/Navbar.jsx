import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiMenuAlt3, HiX } from 'react-icons/hi';
import Logo from '../ui/Logo';
import Button from '../ui/Button';
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

  const isActive = (href) => {
    if (href === '/#home') return pathname === '/' && (!hash || hash === '#home' || hash === '');
    return hash && href.endsWith(hash);
  };

  return (
    <header
      className={`fixed inset-x-0 top-0 z-[60] transition-all duration-300 ${
        scrolled
          ? 'border-b border-[#E5E7EB] bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl'
          : 'border-b border-transparent bg-white/90 backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-4 xl:flex xl:gap-5" aria-label="Primary">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`relative whitespace-nowrap text-[12px] font-medium transition xl:text-[13px] ${
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

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher />
          <div className="hidden lg:block">
            <Button href="/#contact" className="px-5 py-2.5 text-[13px]">
              {t('nav.join')}
            </Button>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-[#111827] xl:hidden"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <HiX size={22} /> : <HiMenuAlt3 size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-[#E5E7EB] bg-white px-4 py-4 xl:hidden">
          <nav className="flex max-h-[70vh] flex-col gap-1 overflow-y-auto" aria-label="Mobile">
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
            <Button href="/#contact" className="mt-3 w-full" onClick={() => setOpen(false)}>
              {t('nav.join')}
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
}
