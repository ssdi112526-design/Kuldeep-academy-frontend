import Reveal from '../ui/Reveal';
import { academyWrestlers } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function Wrestlers() {
  const { t } = useTranslation();

  return (
    <section id="wrestlers" className="relative overflow-hidden bg-[#F7F3EC] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8B5E3C]">
              {t('wrestlers.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold tracking-tight text-[#1A120B]">
              {t('wrestlers.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#57534E]">{t('wrestlers.subtitle')}</p>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {academyWrestlers.map((wrestler, index) => (
            <Reveal key={wrestler.key} delay={index * 0.06}>
              <article className="group relative overflow-hidden rounded-[16px] bg-[#1A120B] shadow-[0_10px_28px_rgba(26,18,11,0.12)]">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={wrestler.image}
                    alt={t(`wrestlers.items.${wrestler.key}.category`)}
                    loading="lazy"
                    width={600}
                    height={800}
                    className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${wrestler.objectPosition || 'object-center'}`}
                  />
                </div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0C0A09] via-[#0C0A09]/75 to-transparent px-4 pb-4 pt-16">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A227]">
                    {t(`wrestlers.items.${wrestler.key}.category`)}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
