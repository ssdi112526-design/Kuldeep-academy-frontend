import Reveal, { SectionHeading } from '../ui/Reveal';
import { aboutPillars, images } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function About() {
  const { t } = useTranslation();

  return (
    <section id="about" className="section bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('about.eyebrow')}
            title={t('about.title')}
            highlight={t('about.highlight')}
            subtitle={t('about.subtitle')}
          />
        </Reveal>

        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <Reveal>
            <img
              src={images.about}
              alt={t('about.imageAlt')}
              className="img-card shadow-[0_12px_32px_rgba(0,0,0,0.08)]"
            />
          </Reveal>
          <div className="grid gap-4">
            {aboutPillars.map((item, i) => (
              <Reveal key={item.key} delay={i * 0.06}>
                <article className="card h-full p-5">
                  <h3 className="font-display text-lg font-semibold text-[#111827]">
                    {t(`about.pillars.${item.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                    {t(`about.pillars.${item.key}.text`)}
                  </p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
