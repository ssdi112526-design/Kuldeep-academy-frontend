import { useEffect, useState } from 'react';
import Reveal, { SectionHeading } from '../ui/Reveal';
import { programTags } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';
import { programService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

export default function Programs() {
  const { t } = useTranslation();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const programsList = await cachedPublicGet('programs', async () => {
          const res = await programService.listPublic();
          return res.data.data.programs || [];
        });
        if (alive) setPrograms(programsList);
      } catch {
        if (alive) setError('Unable to load programs right now.');
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
    <section id="programs" className="section bg-[#F8FAFC]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('programs.eyebrow')}
            title={t('programs.title')}
            highlight={t('programs.highlight')}
            subtitle={t('programs.subtitle')}
          />
        </Reveal>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-[24px] bg-slate-200/70" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : programs.length === 0 ? (
          <p className="text-center text-sm text-[#6B7280]">Programs will appear here soon.</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {programs.map((item, i) => (
              <Reveal key={item._id || item.id} delay={i * 0.06}>
                <article className="card group flex h-full flex-col overflow-hidden p-0">
                  <div className="overflow-hidden">
                    <img
                      src={mediaUrl(item.image)}
                      alt={item.title}
                      width={640}
                      height={400}
                      className="h-[280px] w-full object-cover transition duration-500 group-hover:scale-105 md:h-[320px]"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.src =
                          'data:image/svg+xml,' +
                          encodeURIComponent(
                            '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect fill="#E5E7EB" width="100%" height="100%"/></svg>'
                          );
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-lg font-semibold text-[#111827]">{item.title}</h3>
                    <p className="mt-1.5 text-sm text-[#6B7280]">{item.description}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}

        <Reveal delay={0.1}>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {programTags.map((key) => (
              <span
                key={key}
                className="rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-xs font-semibold text-[#6B7280]"
              >
                {t(`programs.tags.${key}`)}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
