import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import { equipmentPublicService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

export default function Equipment() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const list = await cachedPublicGet('equipment', async () => {
          const res = await equipmentPublicService.listPublic();
          return res.data?.data?.equipment || [];
        });
        if (alive) setItems(list);
      } catch {
        if (alive) setError('Unable to load equipment right now.');
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
    <section
      id="equipment"
      className="relative overflow-hidden bg-[#0C0A09] py-20 text-white sm:py-24"
      aria-labelledby="equipment-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%, rgba(201,162,39,0.12), transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(139,94,60,0.1), transparent 45%)',
        }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#C9A227]">Training Gear</p>
          <h2 id="equipment-heading" className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Akhada Equipment
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-white/65 sm:text-base">
            Traditional and modern training equipment used at Kuldeep Malik Sports Academy.
          </p>
        </Reveal>

        {loading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-white/5" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-10 text-sm text-red-300">{error}</p>
        ) : !items.length ? (
          <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-14 text-center text-sm text-white/60">
            Equipment will appear here when added from the Admin Panel.
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <Reveal key={item.id || item._id} delay={Math.min(index * 0.04, 0.2)}>
                <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                  <div className="aspect-[16/11] overflow-hidden bg-[#1A1410]">
                    {item.image ? (
                      <img
                        src={mediaUrl(item.image)}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#C9A227]/80">
                        <span className="text-xs font-semibold uppercase tracking-widest">Equipment</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 p-4">
                    {item.category ? (
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[#C9A227]/90">
                        {item.category}
                      </p>
                    ) : null}
                    <h3 className="text-lg font-bold text-white">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-white/65">{item.description}</p>
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
