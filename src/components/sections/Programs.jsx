import { useEffect, useState } from 'react';
import Reveal, { SectionHeading } from '../ui/Reveal';
import { programTags } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';
import { programService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';
import { wrestlingCardImgClass, wrestlingFallbackForTitle } from '../../utils/wrestlingImages';

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
    <section id="programs" className="section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="03"
            eyebrow={t('programs.eyebrow')}
            title={t('programs.title')}
            highlight={t('programs.highlight')}
            subtitle={t('programs.subtitle')}
          />
        </Reveal>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[380px] animate-pulse rounded-[14px] bg-[#E9E7DE]/70" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : programs.length === 0 ? (
          <p className="text-center text-sm text-[#64748B]">Programs will appear here soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programs.map((item, i) => (
              <Reveal key={item._id || item.id} delay={i * 0.06}>
                <article className="group flex h-full flex-col overflow-hidden border border-[#E9E7DE] bg-[#F8F7F2] transition duration-300 hover:-translate-y-1 hover:border-[#D97706]/40 hover:shadow-[0_18px_40px_rgba(7,26,43,0.1)]">
                  <div className="relative overflow-hidden">
                    <div className="absolute left-0 top-0 z-[1] h-full w-1.5 bg-[#D97706]" aria-hidden />
                    <img
                      src={mediaUrl(item.image)}
                      alt={item.title}
                      width={640}
                      height={400}
                      className={`${wrestlingCardImgClass} transition duration-500 group-hover:scale-[1.03]`}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = wrestlingFallbackForTitle(item.title);
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-display text-lg font-bold text-[#071A2B]">{item.title}</h3>
                      <span
                        className="mt-1 text-[#D97706] transition group-hover:translate-x-1"
                        aria-hidden
                      >
                        →
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-[#64748B]">{item.description}</p>
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
                className="border border-[#E9E7DE] bg-[#F8F7F2] px-4 py-2 text-xs font-semibold text-[#64748B]"
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
