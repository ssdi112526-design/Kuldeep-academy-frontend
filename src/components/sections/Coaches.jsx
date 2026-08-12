import Reveal from '../ui/Reveal';
import useTranslation from '../../hooks/useTranslation';
import { championCoaches } from '../../data/akhada';

function CoachCard({ coach, index, t }) {
  return (
    <Reveal className="h-full" delay={index * 0.08}>
      <article className="group relative flex h-full flex-col pt-20 sm:pt-[5.25rem]">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-[#C9A227]/80 opacity-90" />
            <div className="relative h-[150px] w-[150px] overflow-hidden rounded-full border-[3px] border-white bg-[#F7F3EC] shadow-[0_10px_24px_rgba(12,10,9,0.12)] md:h-[180px] md:w-[180px]">
              <img
                src={coach.image}
                alt={t(`coaches.items.${coach.key}.name`)}
                width={360}
                height={360}
                loading="lazy"
                decoding="async"
                className={`h-full w-full object-cover ${coach.objectPosition || 'object-top'} transition duration-[400ms] ease-out group-hover:scale-110`}
              />
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[260px] flex-1 flex-col overflow-hidden rounded-[16px] border border-[#E7E0D4] bg-white px-5 pb-6 pt-[6.5rem] shadow-[0_10px_28px_rgba(12,10,9,0.05)] transition duration-300 group-hover:-translate-y-1 md:pt-[7.25rem]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#C9A227]" aria-hidden />
          <div className="relative flex flex-1 flex-col text-center">
            <h3 className="font-display mx-auto max-w-[15rem] text-[1.05rem] font-bold leading-snug text-[#1A120B] sm:text-lg">
              {t(`coaches.items.${coach.key}.name`)}
            </h3>
            <p className="mt-2 text-sm font-semibold text-[#8B5E3C]">
              {t(`coaches.items.${coach.key}.role`)}
            </p>
            <p className="mt-4 line-clamp-4 flex-1 text-[13px] leading-relaxed text-[#6B6560]">
              {t(`coaches.items.${coach.key}.bio`)}
            </p>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export default function Coaches() {
  const { t } = useTranslation();

  return (
    <section id="coaches" className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8B5E3C]">
              {t('coaches.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold tracking-tight text-[#1A120B]">
              {t('coaches.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#57534E]">{t('coaches.subtitle')}</p>
          </div>
        </Reveal>

        <div className="mx-auto grid max-w-3xl grid-cols-1 items-stretch gap-x-8 gap-y-16 sm:grid-cols-2">
          {championCoaches.map((coach, index) => (
            <CoachCard key={coach.key} coach={coach} index={index} t={t} />
          ))}
        </div>
      </div>
    </section>
  );
}
