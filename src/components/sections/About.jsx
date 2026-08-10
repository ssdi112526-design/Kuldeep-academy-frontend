import Reveal, { SectionHeading } from '../ui/Reveal';
import { aboutPillars, images } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function About() {
  const { t } = useTranslation();
  const sidePillars = aboutPillars.filter((item) => item.key !== 'discipline');
  const disciplineQuotes = t('about.disciplineQuotes') || [];

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

        <Reveal delay={0.08}>
          <div className="-mt-4 mb-10 overflow-x-auto">
            <p
              className="mx-auto w-max max-w-none whitespace-nowrap rounded-full border border-[#D4AF37]/35 bg-gradient-to-r from-[#FFF9E8] via-white to-[#FFF4E0] px-5 py-2.5 text-center font-display text-[clamp(0.72rem,1.85vw,1.05rem)] font-semibold tracking-wide text-[#8B5E3C] shadow-[0_8px_24px_rgba(212,175,55,0.12)]"
              lang="sa"
              aria-label={t('about.mantraLabel')}
            >
              <span className="mr-1.5 text-[#D4AF37]" aria-hidden>
                ॥
              </span>
              {t('about.mantra')}
              <span className="ml-1.5 text-[#D4AF37]" aria-hidden>
                ॥
              </span>
            </p>
          </div>
        </Reveal>

        <div className="grid items-stretch gap-6 lg:grid-cols-2">
          <Reveal>
            <img
              src={images.about}
              alt={t('about.imageAlt')}
              width={960}
              height={720}
              loading="lazy"
              decoding="async"
              className="img-card h-full min-h-[320px] object-cover object-[center_18%] shadow-[0_12px_32px_rgba(0,0,0,0.08)] sm:min-h-[380px] sm:object-[center_15%] md:object-[center_12%]"
            />
          </Reveal>
          <div className="grid gap-4">
            {sidePillars.map((item, i) => (
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

        <Reveal delay={0.1}>
          <article className="card mt-6 overflow-hidden p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-[#E8DFD0] pb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#B8860B]">
                  {t('about.pillars.discipline.title')}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold text-[#111827] sm:text-2xl">
                  {t('about.disciplineQuotesTitle')}
                </h3>
              </div>
              <p className="max-w-md text-sm leading-relaxed text-[#6B7280]">
                {t('about.pillars.discipline.text')}
              </p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.isArray(disciplineQuotes) &&
                disciplineQuotes.map((quote, i) => (
                  <li
                    key={i}
                    className="rounded-2xl border border-[#F0E6D4] bg-gradient-to-br from-[#FFFBF3] to-white p-4 shadow-[0_4px_16px_rgba(26,18,11,0.04)] transition duration-300 hover:-translate-y-0.5 hover:border-[#D4AF37]/40 hover:shadow-[0_10px_24px_rgba(212,175,55,0.12)]"
                  >
                    <span className="mb-2 block font-display text-lg leading-none text-[#D4AF37]" aria-hidden>
                      “
                    </span>
                    <p className="text-[13px] leading-relaxed text-[#5C4A3A] sm:text-sm">{quote}</p>
                  </li>
                ))}
            </ul>
          </article>
        </Reveal>
      </div>
    </section>
  );
}
