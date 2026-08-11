import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import useTranslation from '../../hooks/useTranslation';
import { championCoaches } from '../../data/akhada';
import { entryService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

function StaticCoachCard({ coach, index, t }) {
  return (
    <Reveal className="h-full" delay={index * 0.08}>
      <article className="group relative flex h-full flex-col pt-20 sm:pt-[5.25rem]">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-[#D97706]/75 opacity-90" />
            <div className="relative h-[150px] w-[150px] overflow-hidden rounded-full border-[3px] border-white bg-[#F8F7F2] shadow-[0_10px_24px_rgba(7,26,43,0.12)] md:h-[180px] md:w-[180px]">
              <img
                src={coach.image}
                alt={t(`coaches.items.${coach.key}.name`)}
                width={360}
                height={360}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover object-top transition duration-[400ms] ease-out group-hover:scale-110"
              />
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-[14px] border border-[#E9E7DE] bg-white px-5 pb-6 pt-[6.5rem] shadow-[0_10px_28px_rgba(7,26,43,0.06)] transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-[#D97706]/45 group-hover:shadow-[0_18px_40px_rgba(7,26,43,0.1)] md:min-h-[300px] md:pt-[7.25rem]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#D97706]"
            aria-hidden
          />

          <div className="relative flex flex-1 flex-col text-center">
            <h3 className="font-hindi mx-auto min-h-[3rem] max-w-[15rem] px-1 pt-1 text-[1.05rem] font-bold leading-[1.5] tracking-normal text-[#1A120B] sm:text-lg sm:leading-[1.55]">
              {t(`coaches.items.${coach.key}.name`)}
            </h3>
            <p className="font-hindi mt-2 min-h-[1.25rem] text-sm font-semibold leading-snug text-[#B8860B]">
              {t(`coaches.items.${coach.key}.role`)}
            </p>

            <div className="mt-4 flex min-h-[2rem] flex-wrap items-center justify-center gap-2">
              <span className="font-hindi border border-[#D97706]/35 bg-[#F8F7F2] px-3 py-1 text-[11px] font-semibold text-[#071A2B]">
                {t(`coaches.items.${coach.key}.experience`)}
              </span>
              <span className="font-hindi border border-[#E9E7DE] bg-white px-3 py-1 text-[11px] font-semibold text-[#64748B]">
                {t(`coaches.items.${coach.key}.specialty`)}
              </span>
            </div>

            <p className="font-hindi mt-4 line-clamp-4 flex-1 text-[13px] leading-relaxed text-[#6B5E52]">
              {t(`coaches.items.${coach.key}.bio`)}
            </p>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

function ApiCoachCard({ coach, index }) {
  const photo = coach.photo ? mediaUrl(coach.photo) : '';
  const role = coach.designation || coach.specialization || '';
  const experience =
    coach.experienceYears != null && coach.experienceYears !== ''
      ? `${coach.experienceYears}+ years`
      : '';

  return (
    <Reveal className="h-full" delay={index * 0.08}>
      <article className="group relative flex h-full flex-col pt-20 sm:pt-[5.25rem]">
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-full bg-[#D97706]/75 opacity-90" />
            <div className="relative h-[150px] w-[150px] overflow-hidden rounded-full border-[3px] border-white bg-[#F8F7F2] shadow-[0_10px_24px_rgba(7,26,43,0.12)] md:h-[180px] md:w-[180px]">
              {photo ? (
                <img
                  src={photo}
                  alt={coach.fullName || coach.name || 'Coach'}
                  width={360}
                  height={360}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover object-top transition duration-[400ms] ease-out group-hover:scale-110"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#F5E6A6] text-2xl font-bold text-[#8B5E3C]">
                  {(coach.fullName || '?').charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex min-h-[280px] flex-1 flex-col overflow-hidden rounded-[14px] border border-[#E9E7DE] bg-white px-5 pb-6 pt-[6.5rem] shadow-[0_10px_28px_rgba(7,26,43,0.06)] transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:border-[#D97706]/45 group-hover:shadow-[0_18px_40px_rgba(7,26,43,0.1)] md:min-h-[300px] md:pt-[7.25rem]">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[#D97706]"
            aria-hidden
          />

          <div className="relative flex flex-1 flex-col text-center">
            <h3 className="font-hindi mx-auto min-h-[3rem] max-w-[15rem] px-1 pt-1 text-[1.05rem] font-bold leading-[1.5] tracking-normal text-[#1A120B] sm:text-lg sm:leading-[1.55]">
              {coach.fullName || coach.name}
            </h3>
            <p className="font-hindi mt-2 min-h-[1.25rem] text-sm font-semibold leading-snug text-[#B8860B]">
              {role || '\u00A0'}
            </p>

            <div className="mt-4 flex min-h-[2rem] flex-wrap items-center justify-center gap-2">
              {experience ? (
                <span className="font-hindi border border-[#D97706]/35 bg-[#F8F7F2] px-3 py-1 text-[11px] font-semibold text-[#071A2B]">
                  {experience}
                </span>
              ) : null}
              {coach.specialization && coach.designation ? (
                <span className="font-hindi border border-[#E9E7DE] bg-white px-3 py-1 text-[11px] font-semibold text-[#64748B]">
                  {coach.specialization}
                </span>
              ) : null}
            </div>

            <p className="font-hindi mt-4 line-clamp-4 flex-1 text-[13px] leading-relaxed text-[#6B5E52]">
              {coach.biography || '\u00A0'}
            </p>
          </div>
        </div>
      </article>
    </Reveal>
  );
}

export default function Coaches() {
  const { t } = useTranslation();
  const [coaches, setCoaches] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const list = await cachedPublicGet('coaches', async () => {
          const res = await entryService.coaches.listPublic();
          return res.data?.data?.coaches || [];
        });
        if (alive) setCoaches(Array.isArray(list) ? list : []);
      } catch {
        if (alive) setCoaches([]);
      } finally {
        if (alive) setLoaded(true);
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const useApi = loaded && coaches.length > 0;
  const apiWithoutKuldeep = useApi
    ? coaches.filter((c) => !/kuldeep\s*malik/i.test(String(c.fullName || c.name || '')))
    : [];

  return (
    <section
      id="coaches"
      className="relative overflow-hidden section bg-gradient-to-b from-[#FBF8F1] via-[#FFFcf7] to-white"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #D4AF37 0.8px, transparent 0.9px), radial-gradient(circle at 80% 60%, #8B5E3C 0.7px, transparent 0.8px)',
          backgroundSize: '28px 28px, 36px 36px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#8B5E3C]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 border-l-2 border-[#D97706] bg-white/80 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#071A2B]">
              {t('coaches.badge')}
            </span>
            <h2 className="mt-4 font-display text-[clamp(1.85rem,3.8vw,2.75rem)] font-extrabold leading-tight tracking-tight text-[#071A2B]">
              {t('coaches.titleLine1')}{' '}
              <span className="text-[#D97706]">{t('coaches.titleLine2')}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#6B5E52] md:text-base">
              {t('coaches.subtitle')}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 items-stretch gap-x-6 gap-y-16 sm:grid-cols-2 xl:grid-cols-4">
          {/* Always lead with Kuldeep Malik (official founder photo) */}
          <StaticCoachCard coach={championCoaches[0]} index={0} t={t} />
          {useApi
            ? apiWithoutKuldeep.map((coach, index) => (
                <ApiCoachCard key={coach._id || coach.id} coach={coach} index={index + 1} />
              ))
            : championCoaches.slice(1).map((coach, index) => (
                <StaticCoachCard key={coach.key} coach={coach} index={index + 1} t={t} />
              ))}
        </div>
      </div>
    </section>
  );
}
