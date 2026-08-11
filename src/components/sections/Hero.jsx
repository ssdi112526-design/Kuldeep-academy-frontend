import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowRight, FaShieldAlt, FaTrophy } from 'react-icons/fa';
import { GiMuscleUp } from 'react-icons/gi';
import { images } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

const FEATURES = [
  { key: 'discipline', Icon: FaShieldAlt },
  { key: 'strength', Icon: GiMuscleUp },
  { key: 'competition', Icon: FaTrophy },
];

function HeroFeatures({ t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="mt-9 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-3 sm:gap-0"
    >
      {FEATURES.map(({ key, Icon }, i) => (
        <div
          key={key}
          className={`flex items-start gap-3 sm:px-4 ${
            i > 0 ? 'sm:border-l sm:border-[rgba(245,164,0,0.25)]' : 'sm:pl-0'
          }`}
        >
          <Icon className="mt-0.5 shrink-0 text-[#F5A400]" size={18} aria-hidden />
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#F5A400]">
              {t(`hero.features.${key}.title`)}
            </p>
            <p className="mt-1 text-[12px] leading-snug text-[#B8C7C2]">{t(`hero.features.${key}.text`)}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

function HeroCopy({ t }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10"
    >
      <div className="mb-5 flex items-center gap-3 sm:mb-6">
        <span className="font-display text-[12px] font-bold tracking-[0.28em] text-[#F5A400]">01</span>
        <span className="h-px w-10 bg-[#F5A400]/80 sm:w-14" aria-hidden />
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#B8C7C2] sm:text-[11px]">
          {t('hero.badge')}
        </p>
      </div>

      <h1 className="font-display text-[clamp(2.75rem,7.2vw,5.6rem)] font-extrabold uppercase leading-[0.92] tracking-[-0.04em]">
        <span className="block text-white">{t('hero.titleBuild')}</span>
        <span className="block text-[#F5A400]">{t('hero.titleChampions')}</span>
        <span className="mt-1 block text-white">{t('hero.titlePreserve')}</span>
        <span className="block text-[#F5A400]">{t('hero.titleTradition')}</span>
      </h1>

      <p className="mt-6 max-w-[500px] text-[15px] leading-relaxed text-[#B8C7C2] sm:mt-7 sm:text-[16px]">
        {t('hero.support')}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap">
        <Link
          to="/#contact"
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-[12px] bg-[#F5A400] px-6 text-[13px] font-bold uppercase tracking-[0.08em] text-[#03120F] shadow-[0_12px_28px_rgba(245,164,0,0.28)] transition hover:-translate-y-0.5 hover:bg-[#e09500] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A400]/50"
        >
          {t('hero.ctaPrimary')}
          <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
        </Link>
        <Link
          to="/#programs"
          className="group inline-flex h-12 items-center justify-center gap-2 rounded-[12px] border border-[#F5A400]/70 bg-transparent px-6 text-[13px] font-bold uppercase tracking-[0.08em] text-[#F5A400] transition hover:-translate-y-0.5 hover:border-[#F5A400] hover:bg-[#F5A400]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F5A400]/40"
        >
          {t('hero.ctaSecondary')}
          <FaArrowRight className="text-xs transition group-hover:translate-x-0.5" />
        </Link>
      </div>

      <HeroFeatures t={t} />
    </motion.div>
  );
}

export default function Hero() {
  const { t } = useTranslation();
  const heroImage = images.hero;

  return (
    <section id="home" className="relative overflow-x-hidden bg-[#03120F] pt-[4.25rem]">
      {/* Desktop */}
      <div className="relative hidden min-h-[700px] lg:block lg:min-h-[min(780px,calc(100vh-4.25rem))]">
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 right-0 w-[56%] xl:w-[58%]"
        >
          <img
            src={heroImage}
            alt={t('hero.imageAlt')}
            width={1200}
            height={900}
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover object-[48%_center]"
          />
          <div
            className="absolute inset-y-0 left-0 w-[42%] bg-gradient-to-r from-[#03120F] via-[#03120F]/85 to-transparent"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-[#03120F]/50 via-transparent to-[#03120F]/25"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-24 origin-top-left -skew-x-6 bg-gradient-to-r from-[#03120F] to-transparent"
            aria-hidden
          />
        </motion.div>

        <div className="relative z-10 flex h-full min-h-[700px] w-[46%] flex-col justify-center px-8 py-14 lg:min-h-[min(780px,calc(100vh-4.25rem))] xl:w-[44%] xl:px-12 2xl:px-16">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(184,199,194,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(184,199,194,0.35) 1px, transparent 1px)',
              backgroundSize: '52px 52px',
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-16 top-1/4 h-72 w-72 rounded-full bg-[#06251E]/80 blur-3xl"
            aria-hidden
          />
          <div className="relative mx-auto w-full max-w-xl">
            <HeroCopy t={t} />
          </div>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden">
        <div className="relative overflow-hidden px-4 py-10 sm:px-6 sm:py-12">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(184,199,194,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(184,199,194,0.4) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-xl">
            <HeroCopy t={t} />
          </div>
        </div>
        <div className="relative aspect-[16/11] w-full sm:aspect-[16/10]">
          <img
            src={heroImage}
            alt={t('hero.imageAlt')}
            width={1200}
            height={750}
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover object-[48%_center]"
          />
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#03120F] to-transparent" aria-hidden />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#03120F]/70 to-transparent" aria-hidden />
        </div>
      </div>
    </section>
  );
}
