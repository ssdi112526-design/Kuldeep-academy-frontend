import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import { legacyMemberService } from '../../services';
import useTranslation from '../../hooks/useTranslation';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

function MemberCard({ member, index }) {
  const designation = String(member.designation || '').trim();
  const achievement = String(member.achievement || '').trim();
  const description = String(member.description || '').trim();
  const showAchievement =
    achievement && achievement.toLowerCase() !== designation.toLowerCase();
  const showDescription =
    description &&
    description.toLowerCase() !== designation.toLowerCase() &&
    description.toLowerCase() !== achievement.toLowerCase();

  return (
    <Reveal delay={index * 0.08} className="h-full">
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1C1917]">
        {/* Fixed equal media box — image always covers full area */}
        <div className="relative h-52 w-full shrink-0 overflow-hidden bg-[#0C0A09] sm:h-56 md:h-60 lg:h-64">
          {member.image ? (
            <img
              src={member.image}
              alt={member.name}
              loading="lazy"
              decoding="async"
              width={800}
              height={600}
              className="absolute inset-0 block !h-full !w-full !max-h-none max-w-none object-cover transition duration-500 ease-out group-hover:scale-[1.02]"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: 'none',
                objectFit: 'cover',
                objectPosition: member.objectPosition || 'center center',
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-[#292524] text-4xl font-bold text-white/20">
              {String(member.name || '?').charAt(0)}
            </div>
          )}
        </div>

        {/* Equal text zone so cards match even if description differs */}
        <div className="flex min-h-[8.5rem] flex-1 flex-col px-4 py-3 sm:min-h-[9rem] sm:px-5 sm:py-4">
          <h3 className="line-clamp-2 font-display text-lg font-extrabold leading-snug tracking-tight text-white sm:text-xl">
            {member.name}
          </h3>

          {designation ? (
            <p className="mt-1 line-clamp-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#C9A227]">
              {designation}
            </p>
          ) : (
            <p className="mt-1 h-[1.1rem]" aria-hidden />
          )}

          {showAchievement ? (
            <p className="mt-1 line-clamp-1 text-sm font-medium leading-snug text-[#E7E5E4]">{achievement}</p>
          ) : null}

          {showDescription ? (
            <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#A8A29E]">{description}</p>
          ) : null}
        </div>
      </article>
    </Reveal>
  );
}

function MemberSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1C1917]">
      <div className="h-52 w-full animate-pulse bg-white/5 sm:h-56 md:h-60 lg:h-64" />
      <div className="min-h-[8.5rem] space-y-2 px-4 py-3 sm:min-h-[9rem] sm:px-5 sm:py-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-white/5" />
        <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
      </div>
    </div>
  );
}

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
            objectPosition: m.objectPosition || 'center center',
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

  const gridClass =
    items.length <= 2
      ? 'mx-auto grid max-w-4xl auto-rows-fr grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6'
      : 'grid auto-rows-fr grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6';

  return (
    <section
      id="prestigious-members"
      className="relative overflow-hidden bg-[#0C0A09] py-14 text-white sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A227]">
              {t('members.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.75rem,4.2vw,2.75rem)] font-extrabold tracking-tight">
              {t('members.title')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#A8A29E] sm:text-[15px]">
              {t('members.subtitle')}
            </p>
          </div>
        </Reveal>

        {loading ? (
          <div className="mx-auto grid max-w-4xl auto-rows-fr grid-cols-1 items-stretch gap-5 sm:grid-cols-2 sm:gap-6">
            <MemberSkeleton />
            <MemberSkeleton />
          </div>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-[#A8A29E]">
            Prestigious members will appear here once added from the admin panel.
          </p>
        ) : (
          <div className={gridClass}>
            {items.map((member, index) => (
              <MemberCard key={member.id} member={member} index={index} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
