import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Reveal from '../ui/Reveal';
import GalleryAchievementBadge from '../ui/GalleryAchievementBadge';
import useTranslation from '../../hooks/useTranslation';
import { galleryService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';
import { wrestlingFallbacks } from '../../utils/wrestlingImages';
import { resolveAchievement } from '../../utils/galleryAchievements';

export default function Gallery() {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const gallery = await cachedPublicGet('gallery', async () => {
          const res = await galleryService.listPublic();
          return res.data.data.gallery || [];
        });
        if (alive) setItems(gallery);
      } catch {
        if (alive) setError(t('gallery.error'));
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

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [active]);

  return (
    <section
      id="gallery"
      className="relative overflow-hidden bg-[#070605] py-20 text-white sm:py-24"
      aria-labelledby="gallery-heading"
    >
      {/* Subtle luxury texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%, rgba(201,162,39,0.12), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(139,94,60,0.1), transparent 45%), linear-gradient(180deg, #0C0A09 0%, #070605 50%, #0C0A09 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        aria-hidden
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.85\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-12 max-w-3xl text-center sm:mb-14">
            <h2
              id="gallery-heading"
              className="font-display text-[clamp(2rem,5vw,3.25rem)] font-extrabold uppercase tracking-[0.18em] text-white"
            >
              {t('gallery.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[14px] leading-relaxed text-[#A8A29E] sm:text-[15px]">
              {t('gallery.subtitle')}
            </p>
            {/* Gold diamond divider */}
            <div className="mt-6 flex items-center justify-center gap-3" aria-hidden>
              <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#C9A227]/80 sm:w-16" />
              <span className="h-2 w-2 rotate-45 bg-[#C9A227] shadow-[0_0_12px_rgba(201,162,39,0.7)]" />
              <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#C9A227]/80 sm:w-16" />
            </div>
          </div>
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className="aspect-[4/5] animate-pulse rounded-xl border border-[#C9A227]/15 bg-white/[0.04]"
              />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-200">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-[#A8A29E]">{t('gallery.empty')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {items.map((item, i) => {
              const caption = item.title || item.category || t('gallery.itemFallback');
              const achievement = resolveAchievement(item);
              return (
                <Reveal key={item._id || item.id} delay={(i % 4) * 0.04}>
                  <button
                    type="button"
                    onClick={() =>
                      setActive({
                        src: mediaUrl(item.image),
                        caption,
                        item,
                      })
                    }
                    className="group relative block w-full overflow-hidden rounded-xl border border-[#C9A227]/25 bg-[#12100E] shadow-[0_8px_28px_rgba(0,0,0,0.45)] transition duration-500 hover:border-[#C9A227]/55 hover:shadow-[0_12px_36px_rgba(201,162,39,0.22)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C9A227]"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={mediaUrl(item.image)}
                        alt={caption}
                        width={480}
                        height={600}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.06]"
                        onError={(e) => {
                          e.currentTarget.src = wrestlingFallbacks.gallery;
                        }}
                      />

                      <GalleryAchievementBadge item={item} />

                      {/* Cinematic hover overlay + caption */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent opacity-70 transition duration-500 group-hover:opacity-95" />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-1 p-3.5 opacity-90 transition duration-500 group-hover:translate-y-0 group-hover:opacity-100 sm:p-4">
                        {achievement ? (
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#C9A227] sm:text-[11px]">
                            {achievement.icon} {achievement.label}
                          </p>
                        ) : null}
                        <p className="mt-1 font-display text-sm font-semibold tracking-wide text-white sm:text-[15px]">
                          {caption}
                        </p>
                      </div>
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full border border-white/20 bg-white p-3 text-[#0C0A09] transition hover:bg-[#C9A227] sm:right-6 sm:top-6"
            aria-label={t('gallery.close')}
            onClick={() => setActive(null)}
          >
            <FaTimes />
          </button>
          <div
            className="relative max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-xl border border-[#C9A227]/30 shadow-[0_20px_60px_rgba(0,0,0,0.65)]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={active.src}
              alt={active.caption}
              className="max-h-[85vh] w-full object-contain bg-[#0C0A09]"
            />
            {resolveAchievement(active.item) ? (
              <GalleryAchievementBadge item={active.item} size="lg" className="left-3 top-3 sm:left-4 sm:top-4" />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-4 py-4 sm:px-5 sm:py-5">
              <p className="font-display text-base font-semibold text-white sm:text-lg">{active.caption}</p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
