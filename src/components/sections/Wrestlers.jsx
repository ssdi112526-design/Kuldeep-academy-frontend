import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import { academyWrestlers } from '../../data/akhada';
import { athleteService } from '../../services';
import useTranslation from '../../hooks/useTranslation';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

const STATIC_OBJECT_POS = {
  'object-top': 'top',
  'object-center': 'center',
  'object-bottom': 'bottom',
  'object-[center_20%]': 'center 20%',
};

function fallbackItems(t) {
  return academyWrestlers.map((w) => ({
    id: w.key,
    name: t(`wrestlers.items.${w.key}.name`),
    category: t(`wrestlers.items.${w.key}.category`),
    image: w.image,
    objectPosition: STATIC_OBJECT_POS[w.objectPosition] || 'center',
    isStatic: true,
  }));
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
              image: mediaUrl(a.image),
              objectPosition: a.objectPosition || 'top',
              isStatic: false,
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

        {loading ? (
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-[16px] bg-[#E8E0D4]" />
            ))}
          </div>
        ) : (
          <div
            className={`mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:gap-6 ${
              items.length === 1
                ? 'sm:grid-cols-1 sm:max-w-sm'
                : items.length === 2
                  ? 'sm:grid-cols-2 sm:max-w-3xl'
                  : 'sm:grid-cols-3'
            }`}
          >
            {items.map((wrestler, index) => (
              <Reveal key={wrestler.id} delay={Math.min(index * 0.06, 0.24)}>
                <article className="group relative overflow-hidden rounded-[16px] bg-[#1A120B] shadow-[0_10px_28px_rgba(26,18,11,0.12)]">
                  <div className="aspect-[3/4] overflow-hidden">
                    <img
                      src={wrestler.image}
                      alt={wrestler.name || wrestler.category}
                      loading="lazy"
                      width={600}
                      height={800}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      style={{ objectPosition: wrestler.objectPosition || 'center' }}
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0C0A09] via-[#0C0A09]/75 to-transparent px-4 pb-4 pt-16">
                    {wrestler.name ? (
                      <p className="font-display text-base font-bold text-white">{wrestler.name}</p>
                    ) : null}
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A227]">
                      {wrestler.category}
                    </p>
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
