import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import coachKuldeep from '../../assets/akhada/coaches/kuldeep-malik.webp';
import wrestlingHero from '../../assets/akhada/hero-celebration.webp';
import useTranslation from '../../hooks/useTranslation';

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      className="relative flex flex-col overflow-hidden bg-[#0C0A09] pt-[calc(4.25rem+env(safe-area-inset-top,0px))] md:block md:min-h-[85svh] lg:min-h-[90svh]"
      aria-label={t('brand.name')}
    >
      {/* 1 · First image (LCP) */}
      <div className="relative order-1 aspect-[4/5] w-full overflow-hidden md:absolute md:inset-y-0 md:left-0 md:top-[4.25rem] md:aspect-auto md:h-[calc(100%-4.25rem)] md:w-1/2">
        <img
          src={coachKuldeep}
          alt={t('coaches.items.kuldeep.name')}
          className="h-full w-full object-cover object-[center_18%] md:object-[center_12%]"
          fetchPriority="high"
          decoding="async"
          width={900}
          height={1200}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0C0A09]/30 via-transparent to-[#0C0A09]/80 md:hidden"
          aria-hidden
        />
      </div>

      {/* 2 · Title + CTAs */}
      <div className="relative z-10 order-2 flex flex-col items-center px-4 py-8 md:min-h-[calc(85svh-4.25rem)] md:justify-center md:py-0 lg:min-h-[calc(90svh-4.25rem)]">
        {reduceMotion ? (
          <h1
            className="w-full px-1 text-center font-display text-[clamp(1.5rem,calc(0.7rem+5.8vw),6rem)] font-extrabold uppercase leading-[0.98] tracking-[0.03em] sm:text-[clamp(2.25rem,5.5vw,6rem)] sm:leading-[1.05] sm:tracking-[0.1em] md:tracking-[0.12em]"
            style={{
              backgroundImage: 'linear-gradient(180deg, #F0D060 0%, #C9A227 48%, #A67C1A 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.55))',
            }}
          >
            <span className="block">KULDEEP MALIK</span>
            <span className="mt-[0.1em] block sm:mt-[0.12em]">SPORTS ACADEMY</span>
          </h1>
        ) : (
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease }}
            className="w-full px-1 text-center font-display text-[clamp(1.5rem,calc(0.7rem+5.8vw),6rem)] font-extrabold uppercase leading-[0.98] tracking-[0.03em] sm:text-[clamp(2.25rem,5.5vw,6rem)] sm:leading-[1.05] sm:tracking-[0.1em] md:tracking-[0.12em]"
            style={{
              backgroundImage: 'linear-gradient(180deg, #F0D060 0%, #C9A227 48%, #A67C1A 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.55)) drop-shadow(0 0 28px rgba(201,162,39,0.28))',
            }}
          >
            <span className="block">KULDEEP MALIK</span>
            <span className="mt-[0.1em] block sm:mt-[0.12em]">SPORTS ACADEMY</span>
          </motion.h1>
        )}

        <div className="mt-5 flex w-full max-w-sm flex-col items-stretch gap-2.5 sm:mt-8 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4 md:mt-10">
          <Link
            to="/#inquire"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#C9A227] px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-[#0C0A09] shadow-[0_8px_24px_rgba(201,162,39,0.28)] transition hover:bg-[#b8911f] hover:shadow-[0_10px_28px_rgba(201,162,39,0.4)] sm:h-12 sm:px-8 sm:text-[12px]"
          >
            {t('hero.ctaPrimary')}
          </Link>
          <Link
            to="/#gallery"
            className="inline-flex h-11 items-center justify-center rounded-full border border-white/35 bg-black/25 px-6 text-[11px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-[2px] transition hover:border-[#C9A227] hover:text-[#C9A227] sm:h-12 sm:px-8 sm:text-[12px]"
          >
            {t('hero.ctaSecondary')}
          </Link>
        </div>
      </div>

      {/* 3 · Second image */}
      <div className="relative order-3 aspect-[5/4] w-full overflow-hidden md:absolute md:inset-y-0 md:right-0 md:top-[4.25rem] md:aspect-auto md:h-[calc(100%-4.25rem)] md:w-1/2">
        <img
          src={wrestlingHero}
          alt={t('hero.imageAlt')}
          className="h-full w-full object-cover object-[center_35%] md:object-center"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width={1200}
          height={900}
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0A09]/45 via-transparent to-[#0C0A09]/35 md:hidden"
          aria-hidden
        />
      </div>

      <div className="pointer-events-none absolute inset-0 top-[4.25rem] z-[5] hidden md:block" aria-hidden>
        <div className="absolute inset-y-0 left-1/2 w-[36%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#0C0A09]/50 to-transparent" />
        <div className="absolute inset-0 bg-[#0C0A09]/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,10,9,0.5)_0%,rgba(12,10,9,0.18)_45%,rgba(12,10,9,0.7)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0C0A09]/65 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0C0A09]/70 to-transparent" />
      </div>
    </section>
  );
}
