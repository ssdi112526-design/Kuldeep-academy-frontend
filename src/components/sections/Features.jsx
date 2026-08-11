import { useEffect, useState } from 'react';
import {
  FaUsers,
  FaIdCard,
  FaClipboardCheck,
  FaDumbbell,
  FaChartLine,
  FaTrophy,
  FaChalkboardTeacher,
  FaCreditCard,
} from 'react-icons/fa';
import Reveal, { SectionHeading } from '../ui/Reveal';
import useTranslation from '../../hooks/useTranslation';
import { featureService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

const ICON_MAP = {
  FaUsers,
  FaIdCard,
  FaClipboardCheck,
  FaDumbbell,
  FaChartLine,
  FaTrophy,
  FaChalkboardTeacher,
  FaCreditCard,
};

export default function Features() {
  const { t, language } = useTranslation();
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const list = await cachedPublicGet('features', async () => {
          const res = await featureService.listPublic();
          return res.data.data.features || [];
        });
        if (alive) setFeatures(list);
      } catch {
        if (alive) setError('Unable to load features right now.');
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
    <section id="features" className="section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('features.eyebrow')}
            title={t('features.title')}
            highlight={t('features.highlight')}
            subtitle={t('features.subtitle')}
          />
        </Reveal>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-md bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : features.length === 0 ? (
          <p className="text-center text-sm text-[#64748B]">Features will appear here soon.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((item, i) => {
              const Icon = ICON_MAP[item.icon] || FaUsers;
              const title = language === 'hi' ? item.titleHi || item.titleEn : item.titleEn || item.titleHi;
              const text =
                language === 'hi'
                  ? item.descriptionHi || item.descriptionEn
                  : item.descriptionEn || item.descriptionHi;
              return (
                <Reveal key={item._id || item.id} delay={(i % 4) * 0.04}>
                  <article className="card flex h-full flex-col p-5">
                    {item.image ? (
                      <img
                        src={mediaUrl(item.image)}
                        alt=""
                        className="mb-3 h-10 w-10 rounded-xl object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F8F7F2] text-[#0B3D2E]">
                        <Icon size={16} />
                      </div>
                    )}
                    <h3 className="font-display text-[15px] font-semibold text-[#172033]">{title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{text}</p>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
