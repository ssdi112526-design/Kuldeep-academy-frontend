import { useEffect, useRef, useState } from 'react';
import Reveal from '../ui/Reveal';
import { achievements as fallbackAchievements, achievementVisuals } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';
import { achievementService } from '../../services';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

function useCountUp(target, active, duration = 1400) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!active) return undefined;
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, target, duration]);
  return value;
}

function Stat({ item, active, label, index }) {
  const value = useCountUp(item.value, active);
  return (
    <div className="border border-white/10 bg-white/[0.04] p-6 text-center transition hover:border-[#D97706]/40">
      <p className="text-[11px] font-bold tracking-[0.2em] text-[#D97706]">{String(index + 1).padStart(2, '0')}</p>
      <p className="mt-2 font-display text-4xl font-extrabold text-white sm:text-5xl">
        {value}
        {item.suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-white/65">{label}</p>
    </div>
  );
}

export default function Achievements() {
  const { t, language } = useTranslation();
  const ref = useRef(null);
  const [active, setActive] = useState(false);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const list = await cachedPublicGet('achievements', async () => {
          const res = await achievementService.listPublic();
          return res.data?.data?.achievements || [];
        });
        if (!cancelled && list.length) {
          setItems(
            list.map((a) => ({
              id: a._id || a.id,
              value: a.value,
              suffix: a.suffix || '+',
              label: language === 'hi' ? a.labelHi : a.labelEn,
            })),
          );
          return;
        }
      } catch {
        /* fall through to static */
      }
      if (!cancelled) {
        setItems(
          fallbackAchievements.map((a) => ({
            id: a.key,
            value: a.value,
            suffix: a.suffix,
            label: t(`achievements.items.${a.key}`),
          })),
        );
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      cancelled = true;
      unsub();
    };
  }, [language, t]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActive(true);
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="achievements" className="section relative overflow-hidden bg-[#071A2B]">
      <div className="noise-overlay" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D97706]">
              {t('achievements.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.9rem,4vw,3.25rem)] font-extrabold leading-[1.12] tracking-tight text-white">
              {t('achievements.title')} <span className="text-[#D97706]">{t('achievements.highlight')}</span>
            </h2>
            <div className="accent-rule mx-auto mt-4" aria-hidden />
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/65 md:text-base">
              {t('achievements.subtitle')}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {achievementVisuals.map((visual) => (
              <div
                key={visual.key}
                className="group relative overflow-hidden rounded-[14px] ring-1 ring-white/10"
              >
                <img
                  src={visual.image}
                  alt={t(`achievements.items.${visual.key}`)}
                  width={700}
                  height={525}
                  loading="lazy"
                  decoding="async"
                  className={`h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.03] sm:h-[240px] md:h-[260px] ${visual.position}`}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#071A2B]/90 via-[#071A2B]/35 to-transparent px-3.5 pb-3.5 pt-12">
                  <p className="text-sm font-semibold tracking-wide text-white">
                    {t(`achievements.items.${visual.key}`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.05}>
              <Stat item={item} active={active} label={item.label} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
