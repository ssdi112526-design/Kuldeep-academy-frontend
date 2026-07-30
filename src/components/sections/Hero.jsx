import { motion } from 'framer-motion';
import { FaArrowRight, FaHandshake } from 'react-icons/fa';
import Button from '../ui/Button';
import { images } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

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
