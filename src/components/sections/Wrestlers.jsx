import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import { academyWrestlers } from '../../data/akhada';
import { athleteService } from '../../services';
import useTranslation from '../../hooks/useTranslation';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

function fallbackItems(t) {
  return academyWrestlers.map((w) => ({
    id: w.key,
    name: t(`wrestlers.items.${w.key}.name`),
    category: t(`wrestlers.items.${w.key}.category`),
    ageGroup: '',
    achievement: '',
    description: '',
    image: w.image,
    objectPosition: 'center',
  }));
}

function categoryLine(wrestler) {
  return [wrestler.category, wrestler.ageGroup].filter(Boolean).join(' • ');
}

export default function Wrestlers() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const list = await cachedPublicGet('athletes', async () => {
          const res = await athleteService.listPublic();
          return res.data?.data?.athletes || [];
        });
        if (!alive) return;
        if (list.length) {
          setItems(
            list.map((a) => ({
              id: a.id || a._id,
              name: a.name,
              category: a.category,
              ageGroup: a.ageGroup || '',
              achievement: a.achievement || '',
              description: a.description || '',
              image: mediaUrl(a.image),
              objectPosition: a.objectPosition || 'center',
            }))
          );
        } else {
          setItems(fallbackItems(t));
        }
      } catch {
        if (alive) setItems(fallbackItems(t));
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load({ silent: true }));
    return () => {
      alive = false;
      unsub();
    };
  }, [t]);

  return (
    <section id="wrestlers" className="relative overflow-hidden bg-[#F7F3EC] py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A227]">
              {t('wrestlers.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold tracking-tight text-[#1A120B]">
              {t('wrestlers.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#57534E]">{t('wrestlers.subtitle')}</p>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[18px] border border-[#E8E0D4] bg-white">
                <div className="w-full animate-pulse bg-[#E8E0D4]" style={{ aspectRatio: '4 / 5' }} />
                <div className="space-y-3 px-6 py-6">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-[#E8E0D4]" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-[#E8E0D4]" />
                  <div className="h-12 w-full animate-pulse rounded bg-[#E8E0D4]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid items-stretch grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {items.map((wrestler, index) => (
              <Reveal key={wrestler.id} delay={Math.min(index * 0.06, 0.24)} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-[#E8E0D4] bg-white shadow-[0_10px_28px_rgba(26,18,11,0.06)]">
                  <div
                    className="relative w-full shrink-0 overflow-hidden bg-[#1A120B]"
                    style={{ aspectRatio: '4 / 5' }}
                  >
                    <img
                      src={wrestler.image}
                      alt={wrestler.name || wrestler.category}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.03]"
                      style={{ objectPosition: wrestler.objectPosition || 'center' }}
                    />
                  </div>
                  <div className="flex min-h-[11rem] flex-1 flex-col px-6 py-6 sm:px-7 sm:py-7">
                    <h3 className="line-clamp-2 font-display text-2xl font-extrabold tracking-tight text-[#1A120B]">
                      {wrestler.name}
                    </h3>
                    {categoryLine(wrestler) ? (
                      <p className="mt-2 text-sm font-semibold uppercase tracking-[0.08em] text-[#57534E]">
                        {categoryLine(wrestler)}
                      </p>
                    ) : null}
                    {wrestler.achievement ? (
                      <p className="mt-3 line-clamp-2 text-sm font-semibold tracking-wide text-[#C9A227]">
                        {wrestler.achievement}
                      </p>
                    ) : (
                      <p className="mt-3 h-5" aria-hidden />
                    )}
                    {wrestler.description ? (
                      <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#57534E]">
                        {wrestler.description}
                      </p>
                    ) : null}
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
