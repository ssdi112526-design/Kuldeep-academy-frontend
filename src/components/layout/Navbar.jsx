import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HiChevronDown, HiMenuAlt3, HiX } from 'react-icons/hi';
import Logo from '../ui/Logo';
import LanguageSwitcher from '../LanguageSwitcher';
import { navGroups } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

function useHashActive() {
  const { hash, pathname } = useLocation();

  const isActive = (href) => {
    if (href === '/#home') return pathname === '/' && (!hash || hash === '#home' || hash === '');
    if (href === '/login') {
      return (
        pathname.startsWith('/login') ||
        pathname.startsWith('/admin') ||
        pathname.startsWith('/student') ||
        pathname.startsWith('/coach')
      );
    }
    return Boolean(hash && href.endsWith(hash));
  };

  const groupActive = (group) => {
    if (group.href) return isActive(group.href);
    return (group.children || []).some((c) => isActive(c.href));
  };

  return { isActive, groupActive, pathname, hash };
}

function DesktopDropdown({ group, t, isActive, groupActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuId = useId();
  const active = groupActive(group);

  useEffect(() => {
    const onPointer = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
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

  return (
    <div
      className="relative"
      ref={ref}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`relative inline-flex items-center gap-1 whitespace-nowrap text-[13px] font-semibold tracking-wide transition ${
          active ? 'text-white' : 'text-white/75 hover:text-white'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
      >
        {t(group.labelKey)}
        <HiChevronDown
          className={`transition duration-200 ${open ? 'rotate-180 text-[#F5A400]' : ''}`}
          size={14}
          aria-hidden
        />
        {active ? (
          <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#F5A400]" aria-hidden />
        ) : null}
      </button>

      <div
        id={menuId}
        role="menu"
        className={`absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 pt-3 transition duration-200 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="overflow-hidden rounded-[12px] border border-white/10 bg-[#06251E] py-2 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
          {group.children.map((item) => {
            const itemActive = isActive(item.href);
            return (
              <Link
                key={item.href + item.labelKey}
                to={item.href}
                role="menuitem"
                className={`block px-4 py-2.5 text-[13px] font-medium transition ${
                  itemActive
                    ? 'bg-white/10 text-white'
                    : 'text-[#B8C7C2] hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => setOpen(false)}
              >
                <span className="inline-flex items-center gap-2">
                  {itemActive ? <span className="h-1.5 w-1.5 rounded-full bg-[#F5A400]" aria-hidden /> : null}
                  {t(item.labelKey)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileAccordion({ group, t, isActive, groupActive, onNavigate }) {
  const [open, setOpen] = useState(false);
  const active = groupActive(group);

  if (group.href) {
    return (
      <Link
        to={group.href}
        className={`block rounded-[12px] px-3 py-3 text-[15px] font-semibold transition ${
          isActive(group.href) ? 'bg-white/10 text-white' : 'text-[#B8C7C2] hover:bg-white/5 hover:text-white'
        }`}
        onClick={onNavigate}
      >
        {t(group.labelKey)}
      </Link>
    );
  }

  return (
    <div className="border-b border-white/10 last:border-b-0">
      <button
        type="button"
        className={`flex w-full items-center justify-between px-3 py-3.5 text-left text-[15px] font-semibold ${
          active ? 'text-white' : 'text-[#B8C7C2]'
        }`}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="inline-flex items-center gap-2">
          {active ? <span className="h-1.5 w-1.5 rounded-full bg-[#F5A400]" aria-hidden /> : null}
          {t(group.labelKey)}
        </span>
        <HiChevronDown className={`text-[#B8C7C2] transition ${open ? 'rotate-180' : ''}`} size={18} />
      </button>
      {open ? (
        <div className="space-y-0.5 pb-3 pl-2">
          {group.children.map((item) => (
            <Link
              key={item.href + item.labelKey}
              to={item.href}
              className={`block rounded-[12px] px-3 py-2.5 text-sm font-medium transition ${
                isActive(item.href)
                  ? 'bg-white/10 text-white'
                  : 'text-[#B8C7C2] hover:bg-white/5 hover:text-white'
              }`}
              onClick={onNavigate}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { t } = useTranslation();
  const { isActive, groupActive, pathname, hash } = useHashActive();

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
      if (window.matchMedia('(min-width: 1024px)').matches) setOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      {/*
        Keep backdrop-blur on the bar only — blur/filter on the same ancestor as the
        mobile drawer makes position:fixed resolve against the short header box, so
        the menu never fills the screen on phones.
      */}
      <header className="fixed inset-x-0 top-0 z-[60]">
        <div
          className={`border-b transition-all duration-300 ${
            scrolled || open
              ? 'border-white/10 bg-[#03120F]/95 shadow-[0_8px_28px_rgba(0,0,0,0.35)] backdrop-blur-md'
              : 'border-transparent bg-[#03120F]/80 backdrop-blur-sm'
          }`}
        >
          <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <div className="min-w-0 shrink">
              <Logo invert />
            </div>

            <nav className="hidden flex-1 items-center justify-center gap-x-7 lg:flex" aria-label="Primary">
              {navGroups.map((group) => {
                if (group.href) {
                  const active = isActive(group.href);
                  return (
                    <Link
                      key={group.id}
                      to={group.href}
                      className={`relative whitespace-nowrap text-[13px] font-semibold tracking-wide transition ${
                        active ? 'text-white' : 'text-white/75 hover:text-white'
                      }`}
                    >
                      {t(group.labelKey)}
                      {active ? (
                        <span className="absolute -bottom-1 left-0 h-0.5 w-full bg-[#F5A400]" aria-hidden />
                      ) : null}
                    </Link>
                  );
                }
                return (
                  <DesktopDropdown
                    key={group.id}
                    group={group}
                    t={t}
                    isActive={isActive}
                    groupActive={groupActive}
                  />
                );
              })}
            </nav>

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <LanguageSwitcher invert />
              <div className="hidden items-center gap-2 lg:flex">
                <Link
                  to="/#contact"
                  className="inline-flex h-10 items-center justify-center rounded-[12px] bg-[#F5A400] px-4 text-[13px] font-bold text-[#03120F] transition hover:bg-[#e09500] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A400]/50"
                >
                  {t('nav.join')}
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-10 items-center justify-center rounded-[12px] border border-white/25 bg-transparent px-4 text-[13px] font-bold text-white transition hover:border-[#F5A400]/60 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A400]/40"
                >
                  {t('nav.login')}
                </Link>
              </div>
              <button
                type="button"
                className="rounded-[12px] p-2 text-white transition hover:bg-white/10 lg:hidden"
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
          className="fixed inset-x-0 bottom-0 top-[4.25rem] z-[55] overflow-y-auto overscroll-contain border-t border-white/10 bg-[#03120F] lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <nav className="mx-auto flex max-w-lg flex-col px-4 py-4 pb-10" aria-label="Mobile">
            {navGroups.map((group) => (
              <MobileAccordion
                key={group.id}
                group={group}
                t={t}
                isActive={isActive}
                groupActive={groupActive}
                onNavigate={() => setOpen(false)}
              />
            ))}
            <div className="mt-6 grid gap-2">
              <Link
                to="/#contact"
                onClick={() => setOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-[12px] bg-[#F5A400] text-sm font-bold text-[#03120F]"
              >
                {t('nav.join')}
              </Link>
              <Link
                to="/login"
                onClick={() => setOpen(false)}
                className="inline-flex h-12 items-center justify-center rounded-[12px] border border-white/25 text-sm font-bold text-white"
              >
                {t('nav.login')}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </>
  );
}
