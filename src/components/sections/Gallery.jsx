import { useEffect, useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import Reveal, { SectionHeading } from '../ui/Reveal';
import useTranslation from '../../hooks/useTranslation';
import { galleryService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

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
        if (alive) setError('Unable to load gallery right now.');
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
    <section id="gallery" className="section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('gallery.eyebrow')}
            title={t('gallery.title')}
            highlight={t('gallery.highlight')}
            subtitle={t('gallery.subtitle')}
          />
        </Reveal>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-[24px] bg-slate-200/70" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-center text-sm text-[#6B7280]">Gallery images will appear here soon.</p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const caption = item.title || item.category || 'Gallery';
              return (
                <Reveal key={item._id || item.id} delay={(i % 3) * 0.05}>
                  <button
                    type="button"
                    onClick={() => setActive({ src: mediaUrl(item.image), caption })}
                    className="group relative block w-full overflow-hidden rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                  >
                    <img
                      src={mediaUrl(item.image)}
                      alt={caption}
                      width={640}
                      height={400}
                      className="h-[280px] w-full object-cover transition duration-500 group-hover:scale-105 md:h-[320px]"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111827]/55 via-transparent to-transparent opacity-80" />
                    <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#111827] backdrop-blur">
                      {caption}
                    </span>
                  </button>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#111827]/70 p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
        >
          <button
            type="button"
            className="absolute right-5 top-5 rounded-full bg-white p-3 text-[#111827] shadow"
            aria-label={t('gallery.close')}
            onClick={() => setActive(null)}
          >
            <FaTimes />
          </button>
          <img
            src={active.src}
            alt={active.caption}
            className="max-h-[85vh] max-w-5xl rounded-[24px] object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
}
