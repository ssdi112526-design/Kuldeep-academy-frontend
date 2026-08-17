import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import { legacyMemberService } from '../../services';
import useTranslation from '../../hooks/useTranslation';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

export default function PrestigiousMembers() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      try {
        const list = await cachedPublicGet('legacy-members', async () => {
          const res = await legacyMemberService.listPublic();
          return res.data?.data?.members || [];
        });
        if (!alive) return;
        setItems(
          (list || []).map((m) => ({
            id: m.id || m._id,
            name: m.name,
            designation: m.designation,
            achievement: m.achievement || '',
            description: m.description,
            image: mediaUrl(m.image),
            objectPosition: m.objectPosition || 'center',
          }))
        );
      } catch {
        if (alive) setItems([]);
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
    <section id="prestigious-members" className="relative overflow-hidden bg-[#0C0A09] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A227]">
              {t('members.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold tracking-tight">
              {t('members.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#A8A29E]">{t('members.subtitle')}</p>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:gap-10">
            {[1, 2].map((i) => (
              <div key={i} className="overflow-hidden rounded-[18px] border border-white/10 bg-[#1C1917]">
                <div className="w-full animate-pulse bg-white/5" style={{ aspectRatio: '4 / 5' }} />
                <div className="space-y-3 px-6 py-6">
                  <div className="h-6 w-2/3 animate-pulse rounded bg-white/5" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-white/5" />
                  <div className="h-12 w-full animate-pulse rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-[#A8A29E]">
            Prestigious members will appear here once added from the admin panel.
          </p>
        ) : (
          <div className="grid items-stretch gap-8 sm:grid-cols-2 lg:gap-10">
            {items.map((member, index) => (
              <Reveal key={member.id} delay={index * 0.08} className="h-full">
                <article className="group flex h-full flex-col overflow-hidden rounded-[18px] border border-white/10 bg-[#1C1917]">
                  <div
                    className="relative w-full shrink-0 overflow-hidden bg-[#0C0A09]"
                    style={{ aspectRatio: '4 / 5' }}
                  >
                    <img
                      src={member.image}
                      alt={member.name}
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.02]"
                      style={{ objectPosition: member.objectPosition || 'center' }}
                    />
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0C0A09]/85 via-[#0C0A09]/15 to-transparent" />
                  </div>
                  <div className="flex min-h-[10.5rem] flex-1 flex-col px-6 py-6 sm:px-7 sm:py-7">
                    <h3 className="line-clamp-2 font-display text-2xl font-extrabold tracking-tight">
                      {member.name}
                    </h3>
                    <p className="mt-2 line-clamp-1 text-sm font-semibold uppercase tracking-[0.12em] text-[#C9A227]">
                      {member.designation}
                    </p>
                    {member.achievement ? (
                      <p className="mt-2 line-clamp-1 text-xs font-medium tracking-wide text-[#E7E5E4]">
                        {member.achievement}
                      </p>
                    ) : (
                      <p className="mt-2 h-4" aria-hidden />
                    )}
                    <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#A8A29E]">
                      {member.description}
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
