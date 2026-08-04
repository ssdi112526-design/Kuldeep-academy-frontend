import { motion } from 'framer-motion';
import { FaArrowRight, FaHandshake } from 'react-icons/fa';
import Button from '../ui/Button';
import { images } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

const CURVED_TEXT = '॥ आओ, चलें खेल की ओर। ॥';
const ARC_PATH_ID = 'hero-guru-arc';

/**
 * Safari-safe SVG textPath arc.
 * Avoids stroke + letter-spacing on Devanagari (WebKit shaping bugs).
 * Uses Noto Sans Devanagari + dual href/xlinkHref for broad SVG support.
 */
function HeroCurvedMantra() {
  return (
    <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden pt-14 sm:pt-16 md:pt-20">
      <motion.div
        className="pointer-events-auto absolute right-0 top-[12%] w-[min(92%,560px)] origin-center cursor-default sm:right-[2%] sm:top-[14%] sm:w-[min(70%,600px)] md:right-[4%] md:top-[13%] md:w-[min(58%,640px)] lg:right-[5%] lg:top-[12%] lg:w-[min(52%,680px)] xl:right-[6%] xl:w-[min(48%,700px)]"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          className="hero-curved-wrap relative will-change-transform"
        >
          <div
            className="pointer-events-none absolute left-1/2 top-[42%] h-14 w-4/5 -translate-x-1/2 rounded-full bg-[#C79A3B]/18 blur-2xl"
            aria-hidden
          />

          <svg
            viewBox="0 0 700 240"
            className="hero-curved-svg h-auto w-full overflow-visible"
            role="img"
            aria-label={CURVED_TEXT}
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
          >
            <defs>
              {/* Wide gentle upper arc — enough length for Devanagari clusters */}
              <path id={ARC_PATH_ID} d="M 36,188 C 160,72 540,72 664,188" fill="none" />
              <linearGradient id="hero-arc-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9A6F28" />
                <stop offset="28%" stopColor="#E8C547" />
                <stop offset="55%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#9A6F28" />
              </linearGradient>
            </defs>

            {/* Accessible plain text for screen readers / selection fallback */}
            <title>{CURVED_TEXT}</title>

            <text
              className="hero-curved-text"
              fill="url(#hero-arc-gold)"
              lang="hi"
              direction="ltr"
              fontSize="26"
              fontFamily="Noto Sans Devanagari, Noto Serif Devanagari, sans-serif"
              fontWeight="700"
              style={{
                letterSpacing: 'normal',
                fontKerning: 'normal',
                fontFeatureSettings: '"kern" 1, "liga" 1',
                textRendering: 'geometricPrecision',
              }}
            >
              {/* Dual attributes: href (modern) + xlinkHref (Safari / older WebKit) */}
              <textPath
                href={`#${ARC_PATH_ID}`}
                xlinkHref={`#${ARC_PATH_ID}`}
                startOffset="50%"
                textAnchor="middle"
                method="align"
                spacing="auto"
              >
                {CURVED_TEXT}
              </textPath>
            </text>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function Hero() {
  const { t } = useTranslation();

  return (
    <section
      id="home"
      className="relative flex min-h-[560px] items-center overflow-hidden bg-gradient-to-br from-white via-[#F8FAFC] to-[#EFF6FF] pt-20 md:min-h-[640px] lg:min-h-[720px]"
    >
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#DBEAFE]/50 to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-[#2563EB]/25 via-[#38BDF8]/15 to-transparent blur-2xl md:h-[520px] md:w-[520px]"
        aria-hidden
      />

      <div className="absolute inset-0 z-0">
        <img
          src={images.hero}
          alt={t('hero.imageAlt')}
          width={1920}
          height={1080}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-[72%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-transparent md:via-white/55 lg:via-white/35 lg:to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/40 via-transparent to-white/20 lg:from-transparent" />
      </div>

      <HeroCurvedMantra />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl py-16 md:py-20 lg:max-w-[520px] lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#BFDBFE] bg-[#EFF6FF]/90 px-3.5 py-1.5 text-[12px] font-semibold text-[#2563EB] shadow-[0_4px_14px_rgba(37,99,235,0.08)] backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" />
              {t('hero.badge')}
            </div>

            <h1 className="font-display text-[clamp(2.1rem,4.8vw,3.4rem)] font-bold leading-[1.12] tracking-[-0.03em] text-[#071A35]">
              {t('hero.titleLine1')}
              <br />
              <span className="text-[#2563EB]">{t('hero.titleLine2')}</span>
            </h1>

            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#6B7280] md:text-base">
              {t('hero.subtitle')}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="#contact" className="rounded-full px-7 py-3.5 text-[15px]">
                {t('hero.ctaPrimary')}
                <FaArrowRight className="text-xs" />
              </Button>
              <Button href="#about" variant="secondary" className="rounded-full px-7 py-3.5 text-[15px]">
                <FaHandshake className="text-[#2563EB]" />
                {t('hero.ctaSecondary')}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
