import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import coachKuldeep from '../../assets/akhada/coaches/kuldeep-malik.webp';
import wrestlingHero from '../../assets/akhada/hero-celebration.webp';
import useTranslation from '../../hooks/useTranslation';

const ease = [0.22, 1, 0.36, 1];

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section
      id="home"
      className="relative min-h-[80svh] overflow-hidden bg-[#0C0A09] pt-[4.25rem] sm:min-h-[85svh] lg:min-h-[90svh]"
      aria-label={t('brand.name')}
    >
      {/* Split imagery */}
      <div className="absolute inset-0 top-[4.25rem] grid grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease }}
          className="relative min-h-0 overflow-hidden"
        >
          <img
            src={coachKuldeep}
            alt={t('coaches.items.kuldeep.name')}
            className="h-full w-full object-cover object-[center_18%] md:object-[center_12%]"
            fetchPriority="high"
            width={900}
            height={1200}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, delay: 0.05, ease }}
          className="relative min-h-0 overflow-hidden"
        >
          <img
            src={wrestlingHero}
            alt={t('hero.imageAlt')}
            className="h-full w-full object-cover object-[center_35%] md:object-center"
            fetchPriority="high"
            width={1200}
            height={900}
          />
        </motion.div>
      </div>

      {/* Cinematic blend */}
      <div className="pointer-events-none absolute inset-0 top-[4.25rem]" aria-hidden>
        <div className="absolute inset-y-0 left-1/2 hidden w-[36%] -translate-x-1/2 bg-gradient-to-r from-transparent via-[#0C0A09]/50 to-transparent md:block" />
        <div className="absolute inset-x-0 top-1/2 h-[24%] -translate-y-1/2 bg-gradient-to-b from-transparent via-[#0C0A09]/55 to-transparent md:hidden" />
        <div className="absolute inset-0 bg-[#0C0A09]/20 md:bg-[#0C0A09]/15" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(12,10,9,0.55)_0%,rgba(12,10,9,0.2)_42%,rgba(12,10,9,0.65)_100%)]" />
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0C0A09]/65 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0C0A09]/70 to-transparent" />
      </div>

      {/* Title + CTAs */}
      <div className="relative z-10 flex min-h-[calc(80svh-4.25rem)] flex-col items-center justify-center px-4 sm:min-h-[calc(85svh-4.25rem)] lg:min-h-[calc(90svh-4.25rem)]">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15, ease }}
          className="w-full max-w-[15ch] text-center font-display text-[clamp(2.75rem,5.5vw,6rem)] font-extrabold uppercase leading-[1.05] tracking-[0.08em] sm:max-w-none sm:tracking-[0.12em]"
          style={{
            backgroundImage: 'linear-gradient(180deg, #F0D060 0%, #C9A227 48%, #A67C1A 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            filter: 'drop-shadow(0 2px 12px rgba(0,0,0,0.55)) drop-shadow(0 0 28px rgba(201,162,39,0.28))',
          }}
        >
          <span className="block">KULDEEP MALIK</span>
          <span className="mt-[0.12em] block">SPORTS ACADEMY</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.28, ease }}
          className="mt-8 flex w-full max-w-md flex-col items-stretch gap-3 px-2 sm:mt-10 sm:max-w-none sm:flex-row sm:items-center sm:justify-center sm:gap-4"
        >
          <Link
            to="/#inquire"
            className="inline-flex h-12 items-center justify-center rounded-full bg-[#C9A227] px-8 text-[12px] font-bold uppercase tracking-[0.1em] text-[#0C0A09] shadow-[0_8px_24px_rgba(201,162,39,0.28)] transition hover:bg-[#b8911f] hover:shadow-[0_10px_28px_rgba(201,162,39,0.4)]"
          >
            {t('hero.ctaPrimary')}
          </Link>
          <Link
            to="/#gallery"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/35 bg-black/25 px-8 text-[12px] font-bold uppercase tracking-[0.1em] text-white backdrop-blur-[2px] transition hover:border-[#C9A227] hover:text-[#C9A227]"
          >
            {t('hero.ctaSecondary')}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
