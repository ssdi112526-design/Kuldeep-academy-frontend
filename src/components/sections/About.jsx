import Reveal from '../ui/Reveal';
import aboutImg from '../../assets/akhada/about-heritage.webp';
import { aboutPillars } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function About() {
  const { t } = useTranslation();

  return (
    <section id="about" className="relative overflow-hidden bg-[#F7F3EC] py-20 sm:py-24">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[20px]">
            <img
              src={aboutImg}
              alt={t('about.imageAlt')}
              width={900}
              height={1100}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover object-center sm:aspect-[5/6]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A09]/50 to-transparent" />
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8B5E3C]">
            {t('about.eyebrow')}
          </p>
          <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,3rem)] font-extrabold leading-tight tracking-tight text-[#1A120B]">
            {t('about.title')}
          </h2>
          <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-[#57534E] sm:text-base">
            {t('about.subtitle')}
          </p>

          <div className="mt-8 space-y-5 border-t border-[#E7E0D4] pt-6">
            {aboutPillars.map((pillar) => (
              <div key={pillar.key}>
                <h3 className="font-display text-base font-bold text-[#1A120B]">
                  {t(`about.pillars.${pillar.key}.title`)}
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[#6B6560]">
                  {t(`about.pillars.${pillar.key}.text`)}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
