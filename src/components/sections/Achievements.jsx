import { useEffect, useRef, useState } from 'react';
import Reveal, { SectionHeading } from '../ui/Reveal';
import { achievements as fallbackAchievements } from '../../data/akhada';
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

function Stat({ item, active, label }) {
  const value = useCountUp(item.value, active);
  return (
    <div className="card p-6 text-center">
      <p className="font-display text-4xl font-bold text-[#2563EB]">
        {value}
        {item.suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-[#6B7280]">{label}</p>
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
    <section id="achievements" className="section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('achievements.eyebrow')}
            title={t('achievements.title')}
            highlight={t('achievements.highlight')}
            subtitle={t('achievements.subtitle')}
          />
        </Reveal>
        <div ref={ref} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <Reveal key={item.id} delay={i * 0.05}>
              <Stat item={item} active={active} label={item.label} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
