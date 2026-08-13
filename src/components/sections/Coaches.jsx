import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import useTranslation from '../../hooks/useTranslation';
import { championCoaches } from '../../data/akhada';
import { entryService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

function fallbackItems(t) {
  return championCoaches.map((coach) => ({
    id: coach.key,
    name: t(`coaches.items.${coach.key}.name`),
    role: t(`coaches.items.${coach.key}.role`),
    bio: t(`coaches.items.${coach.key}.bio`),
    image: coach.image,
    objectPosition: coach.objectPosition || 'object-top',
    isStatic: true,
  }));
}

function CoachCard({ coach, index }) {
  return (
    <Reveal className="h-full" delay={index * 0.08}>
      <article className="group relative flex h-full flex-col pt-20 sm:pt-[5.25rem]">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-[#C9A227]/80 opacity-90" />
            <div className="relative h-[150px] w-[150px] overflow-hidden rounded-full border-[3px] border-white bg-[#F7F3EC] shadow-[0_10px_24px_rgba(12,10,9,0.12)] md:h-[180px] md:w-[180px]">
              <img
                src={coach.image}
                alt={coach.name}
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
              {coach.name}
            </h3>
            <p className="mt-2 text-sm font-semibold text-[#8B5E3C]">{coach.role}</p>
            {coach.bio ? (
              <p className="mt-4 line-clamp-4 flex-1 text-[13px] leading-relaxed text-[#6B6560]">{coach.bio}</p>
            ) : null}
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export default function Coaches() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const list = await cachedPublicGet('coaches', async () => {
          const res = await entryService.coaches.listPublic();
          return res.data?.data?.coaches || [];
        });
        if (!alive) return;
        if (list.length) {
          setItems(
            list.map((c) => ({
              id: c.id || c._id,
              name: c.fullName || c.name,
              role: c.designation || c.specialization || 'Coach',
              bio: c.biography || '',
              image: mediaUrl(c.photo) || mediaUrl(c.image),
              objectPosition: 'object-top',
              isStatic: false,
            }))
          );
        } else {
          setItems(fallbackItems(t));
        }
      } catch {
        if (alive) setItems(fallbackItems(t));
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      alive = false;
      unsub();
    };
  }, [t]);

  const display = items.length ? items : fallbackItems(t);

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

        <div
          className={`mx-auto grid items-stretch gap-x-8 gap-y-16 ${
            display.length === 1 ? 'max-w-md grid-cols-1' : 'max-w-3xl grid-cols-1 sm:grid-cols-2'
          }`}
        >
          {display.map((coach, index) => (
            <CoachCard key={coach.id} coach={coach} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
