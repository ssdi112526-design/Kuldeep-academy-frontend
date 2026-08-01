import { motion } from 'framer-motion';
import { FaArrowRight, FaHandshake } from 'react-icons/fa';
import Button from '../ui/Button';
import { images } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

const CURVED_TEXT = '॥ आओ, चलें खेल की ओर। ॥';
const ARC_PATH_ID = 'hero-guru-arc';
/** Soft upper arc — sits below navbar, above Guru's head */
const ARC_D = 'M 100,195 A 255,175 0 0 1 600,195';

function HeroCurvedMantra() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-[5] overflow-hidden pt-16 sm:pt-20 md:pt-24"
      aria-hidden={false}
    >
      <motion.div
        className="pointer-events-auto absolute left-[40%] top-[18%] w-[60%] max-w-[620px] cursor-default origin-center sm:left-[43%] sm:top-[17%] sm:w-[55%] md:left-[45%] md:top-[16%] md:w-[52%] lg:left-[47%] lg:top-[15%] lg:w-[48%] xl:left-[49%] xl:w-[46%]"
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.04 }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          {/* Soft golden glow behind text */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/3 h-16 w-3/4 -translate-x-1/2 rounded-full bg-[#C79A3B]/20 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
            aria-hidden
          />

          <motion.div
            className="relative transition-[filter] duration-300 hover:drop-shadow-[0_0_18px_rgba(199,154,59,0.55)]"
            whileHover={{ filter: 'brightness(1.08)' }}
          >
            <svg
              viewBox="0 0 700 260"
              className="h-auto w-full overflow-visible"
              role="img"
              aria-label={CURVED_TEXT}
            >
              <defs>
                <path id={ARC_PATH_ID} d={ARC_D} fill="none" />
                <linearGradient id="hero-arc-gold" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A67C2D" />
                  <stop offset="35%" stopColor="#E8C547" />
                  <stop offset="65%" stopColor="#D4AF37" />
                  <stop offset="100%" stopColor="#A67C2D" />
                </linearGradient>
                <filter id="hero-text-glow" x="-20%" y="-40%" width="140%" height="180%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#C79A3B" floodOpacity="0.55" />
                </filter>
              </defs>

              <motion.g
                filter="url(#hero-text-glow)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.55 }}
              >
                <text
                  fill="url(#hero-arc-gold)"
                  className="hero-curved-text"
                  style={{
                    fontFamily: '"Mukta", "Noto Sans Devanagari", sans-serif',
                    fontWeight: 800,
                    letterSpacing: '1.4px',
                  }}
                >
                  <textPath href={`#${ARC_PATH_ID}`} startOffset="50%" textAnchor="middle">
                    {CURVED_TEXT}
                  </textPath>
                </text>
              </motion.g>
            </svg>
          </motion.div>
        </motion.div>
      </motion.div>

      <style>{`
        .hero-curved-text {
          font-size: 20px;
          font-weight: 800;
          -webkit-font-smoothing: antialiased;
          stroke: #8B5A2B;
          stroke-width: 0.6px;
          paint-order: stroke fill;
        }
        @media (min-width: 640px) {
          .hero-curved-text { font-size: 22px; }
        }
        @media (min-width: 768px) {
          .hero-curved-text { font-size: 26px; }
        }
        @media (min-width: 1024px) {
          .hero-curved-text { font-size: 30px; }
        }
        @media (min-width: 1280px) {
          .hero-curved-text { font-size: 34px; }
        }
      `}</style>
    </motion.div>
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
