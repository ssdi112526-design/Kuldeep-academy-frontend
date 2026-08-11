import { useEffect, useState } from 'react';
import Reveal, { SectionHeading } from '../ui/Reveal';
import { facilityTags } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';
import { facilityService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';
import { wrestlingCardImgClass, wrestlingFallbacks } from '../../utils/wrestlingImages';

export default function Facilities() {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const list = await cachedPublicGet('facilities', async () => {
          const res = await facilityService.listPublic();
          return res.data.data.facilities || [];
        });
        if (alive) setFacilities(list);
      } catch {
        if (alive) setError('Unable to load facilities right now.');
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
  }, []);

  return (
    <section id="facilities" className="section bg-[#F8F7F2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('facilities.eyebrow')}
            title={t('facilities.title')}
            highlight={t('facilities.highlight')}
            subtitle={t('facilities.subtitle')}
          />
        </Reveal>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-md bg-slate-200/70" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : facilities.length === 0 ? (
          <p className="text-center text-sm text-[#64748B]">Facilities will appear here soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {facilities.map((item, i) => (
              <Reveal key={item._id || item.id} delay={i * 0.06}>
                <article className="card group flex h-full flex-col overflow-hidden p-0">
                  <div className="overflow-hidden">
                    <img
                      src={mediaUrl(item.image)}
                      alt={item.name}
                      width={640}
                      height={400}
                      className={wrestlingCardImgClass}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = wrestlingFallbacks.facilities;
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-semibold text-[#172033]">{item.name}</h3>
                    <p className="mt-1.5 text-sm text-[#64748B]">{item.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {facilityTags.map((key) => (
              <span
                key={key}
                className="border border-[#E9E7DE] bg-white px-4 py-2 text-xs font-semibold text-[#64748B]"
              >
                {t(`facilities.tags.${key}`)}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
