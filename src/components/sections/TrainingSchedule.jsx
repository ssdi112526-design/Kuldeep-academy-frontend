import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sunrise,
  Sunset,
  Moon,
  PersonStanding,
  Mountain,
  Swords,
  Dumbbell,
  Flame,
  Gamepad2,
  HeartPulse,
  Target,
  Activity,
} from 'lucide-react';
import Reveal from '../ui/Reveal';
import Button from '../ui/Button';
import useTranslation from '../../hooks/useTranslation';
import { scheduleService } from '../../services';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

const SESSION_META = {
  morning: { Icon: Sunrise, accent: 'from-[#FF9933]/25 to-transparent' },
  evening: { Icon: Sunset, accent: 'from-[#D4AF37]/25 to-transparent' },
  sunday: { Icon: Moon, accent: 'from-slate-400/20 to-transparent' },
};

const DAY_BADGES = {
  monday: 'bg-amber-500/20 text-amber-300 ring-amber-400/30',
  tuesday: 'bg-orange-500/20 text-orange-300 ring-orange-400/30',
  wednesday: 'bg-yellow-500/20 text-yellow-200 ring-yellow-400/30',
  thursday: 'bg-amber-500/20 text-amber-200 ring-amber-400/30',
  friday: 'bg-orange-500/20 text-orange-200 ring-orange-400/30',
  saturday: 'bg-[#D4AF37]/20 text-[#F5D76E] ring-[#D4AF37]/30',
  sunday: 'bg-slate-500/20 text-slate-300 ring-slate-400/30',
};

const FALLBACK_DAYS = [
  {
    key: 'monday',
    morning: ['running', 'wrestlingPractice', 'strength'],
    evening: ['wrestlingTechniques', 'strength'],
  },
  {
    key: 'tuesday',
    morning: ['running', 'wrestlingTechniques'],
    evening: ['wrestlingTechniques', 'sports'],
  },
  {
    key: 'wednesday',
    morning: ['running', 'wrestlingPractice', 'strength'],
    evening: ['wrestlingPractice', 'gym'],
  },
  {
    key: 'thursday',
    morning: ['running', 'wrestlingTechniques'],
    evening: ['wrestlingTechniques', 'strength'],
  },
  {
    key: 'friday',
    morning: ['running', 'wrestlingPractice', 'endurance'],
    evening: ['sparring', 'gym'],
  },
  {
    key: 'saturday',
    morning: ['crossCountry', 'wrestlingTechniques'],
    evening: ['crossCountry', 'wrestlingTechniques', 'gym'],
  },
  {
    key: 'sunday',
    morning: ['holiday'],
    evening: ['holiday'],
    holiday: true,
  },
];

const ACTIVITY_META = {
  running: { Icon: PersonStanding, color: 'text-sky-300' },
  crossCountry: { Icon: Mountain, color: 'text-emerald-300' },
  wrestlingPractice: { Icon: Swords, color: 'text-amber-300' },
  wrestlingTechniques: { Icon: Target, color: 'text-orange-300' },
  strength: { Icon: Dumbbell, color: 'text-[#F5D76E]' },
  gym: { Icon: Dumbbell, color: 'text-rose-300' },
  sports: { Icon: Gamepad2, color: 'text-violet-300' },
  sparring: { Icon: Flame, color: 'text-red-300' },
  endurance: { Icon: Activity, color: 'text-cyan-300' },
  holiday: { Icon: HeartPulse, color: 'text-slate-300' },
};

const LEGEND = [
  'running',
  'crossCountry',
  'wrestlingPractice',
  'wrestlingTechniques',
  'strength',
  'gym',
  'sports',
  'sparring',
];

function splitText(text = '') {
  return String(text)
    .split(/[,،|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function TextPills({ parts }) {
  return (
    <div className="flex flex-wrap gap-2">
      {parts.map((part) => (
        <span
          key={part}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 backdrop-blur-sm"
        >
          {part}
        </span>
      ))}
    </div>
  );
}

function ActivityPills({ keys, t }) {
  return (
    <div className="flex flex-wrap gap-2">
      {keys.map((key) => {
        const meta = ACTIVITY_META[key] || ACTIVITY_META.holiday;
        const Icon = meta.Icon;
        return (
          <span
            key={key}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-200 backdrop-blur-sm"
          >
            <Icon size={13} className={meta.color} aria-hidden />
            {t(`schedule.activities.${key}`)}
          </span>
        );
      })}
    </div>
  );
}

export default function TrainingSchedule() {
  const { t, language } = useTranslation();
  const hi = language === 'hi';
  const [apiSessions, setApiSessions] = useState(null);
  const [apiDays, setApiDays] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await cachedPublicGet('schedule', async () => {
          const res = await scheduleService.listPublic();
          const { sessions = [], days = [] } = res.data?.data || {};
          return { sessions, days };
        });
        if (!cancelled) {
          setApiSessions(data.sessions.length ? data.sessions : null);
          setApiDays(data.days.length ? data.days : null);
        }
      } catch {
        if (!cancelled) {
          setApiSessions(null);
          setApiDays(null);
        }
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const sessions = useMemo(() => {
    if (apiSessions?.length) {
      return apiSessions.map((s) => {
        const meta = SESSION_META[s.key] || SESSION_META.morning;
        return {
          key: s.key,
          Icon: meta.Icon,
          accent: meta.accent,
          title: hi ? s.titleHi : s.titleEn,
          time: hi ? s.timeHi : s.timeEn,
          note: hi ? s.noteHi || s.noteEn : s.noteEn || s.noteHi,
        };
      });
    }
    return ['morning', 'evening', 'sunday'].map((key) => {
      const meta = SESSION_META[key];
      return {
        key,
        Icon: meta.Icon,
        accent: meta.accent,
        title: t(`schedule.sessions.${key}.title`),
        time: t(`schedule.sessions.${key}.time`),
        note: t(`schedule.sessions.${key}.note`),
      };
    });
  }, [apiSessions, hi, t]);

  const days = useMemo(() => {
    if (apiDays?.length) {
      return apiDays.map((d) => ({
        key: d.dayKey,
        label: hi ? d.labelHi : d.labelEn,
        morningParts: splitText(hi ? d.morningHi : d.morningEn),
        eveningParts: splitText(hi ? d.eveningHi : d.eveningEn),
        holiday: Boolean(d.isHoliday),
        fromApi: true,
        badge: DAY_BADGES[d.dayKey] || DAY_BADGES.monday,
      }));
    }
    return FALLBACK_DAYS.map((d) => ({
      ...d,
      label: t(`schedule.days.${d.key}`),
      fromApi: false,
      badge: DAY_BADGES[d.key],
    }));
  }, [apiDays, hi, t]);

  return (
    <section
      id="schedule"
      className="relative overflow-hidden bg-[#0F172A] py-20 text-white sm:py-24"
      aria-labelledby="schedule-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="absolute -right-16 bottom-10 h-80 w-80 rounded-full bg-[#FF9933]/10 blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, #D4AF37 0.8px, transparent 0.8px), radial-gradient(circle at 80% 60%, #FF9933 0.7px, transparent 0.7px)',
            backgroundSize: '28px 28px, 36px 36px',
          }}
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#D4AF37]">
              {t('schedule.eyebrow')}
            </p>
            <h2
              id="schedule-heading"
              className="font-display text-[clamp(1.85rem,3.8vw,2.75rem)] font-bold leading-tight tracking-tight text-white"
            >
              {t('schedule.title')}{' '}
              <span className="bg-gradient-to-r from-[#D4AF37] to-[#FF9933] bg-clip-text text-transparent">
                {t('schedule.highlight')}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-300">
              {t('schedule.subtitle')}
            </p>
            <motion.div
              className="mx-auto mt-6 h-px w-28 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-3">
          {sessions.map((card, i) => {
            const Icon = card.Icon;
            return (
              <Reveal key={card.key} delay={i * 0.08}>
                <article className="group relative overflow-hidden rounded-[20px] border border-white/10 bg-white/5 p-5 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-[#D4AF37]/40 hover:shadow-[0_0_32px_rgba(212,175,55,0.28)]">
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${card.accent}`} />
                  <div className="relative flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10 text-[#D4AF37]">
                      <Icon size={20} aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-base font-semibold text-white">{card.title}</h3>
                      <p className="mt-1 text-sm font-medium text-[#F5D76E]">{card.time}</p>
                      {card.note ? <p className="mt-2 text-xs leading-relaxed text-slate-400">{card.note}</p> : null}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-10 hidden overflow-hidden rounded-[20px] border border-white/10 bg-white/[0.04] shadow-[0_16px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl md:block">
            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#111827]/95 backdrop-blur-md">
                  <tr className="border-b border-white/10 text-xs uppercase tracking-[0.14em] text-[#D4AF37]">
                    <th className="px-5 py-4 font-semibold">{t('schedule.table.day')}</th>
                    <th className="px-5 py-4 font-semibold">{t('schedule.table.morning')}</th>
                    <th className="px-5 py-4 font-semibold">{t('schedule.table.evening')}</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, i) => (
                    <motion.tr
                      key={day.key}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-20px' }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                      className={`border-b border-white/5 transition duration-300 hover:bg-[#D4AF37]/8 ${
                        i % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
                      } ${day.holiday ? 'opacity-90' : ''}`}
                    >
                      <td className="whitespace-nowrap px-5 py-4 align-top">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${day.badge}`}>
                          {day.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 align-top">
                        {day.fromApi ? <TextPills parts={day.morningParts} /> : <ActivityPills keys={day.morning} t={t} />}
                      </td>
                      <td className="px-5 py-4 align-top">
                        {day.fromApi ? <TextPills parts={day.eveningParts} /> : <ActivityPills keys={day.evening} t={t} />}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <div className="mt-8 space-y-3 md:hidden">
          {days.map((day, i) => (
            <Reveal key={day.key} delay={i * 0.04}>
              <article className="rounded-[18px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${day.badge}`}>
                  {day.label}
                </span>
                <div className="mt-3 space-y-3">
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#D4AF37]">
                      {t('schedule.table.morning')}
                    </p>
                    {day.fromApi ? <TextPills parts={day.morningParts} /> : <ActivityPills keys={day.morning} t={t} />}
                  </div>
                  <div>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#FF9933]">
                      {t('schedule.table.evening')}
                    </p>
                    {day.fromApi ? <TextPills parts={day.eveningParts} /> : <ActivityPills keys={day.evening} t={t} />}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        {!apiDays && (
          <Reveal delay={0.12}>
            <div className="mt-8 rounded-[20px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
              <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#D4AF37]">
                {t('schedule.legendTitle')}
              </h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {LEGEND.map((key) => {
                  const meta = ACTIVITY_META[key];
                  const Icon = meta.Icon;
                  return (
                    <div key={key} className="flex items-center gap-2 text-xs text-slate-300">
                      <Icon size={15} className={meta.color} aria-hidden />
                      <span>{t(`schedule.activities.${key}`)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal delay={0.1}>
          <div className="relative mt-12 overflow-hidden rounded-[24px] border border-[#D4AF37]/25 bg-gradient-to-br from-[#111827] via-[#0F172A] to-[#1a1208] p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4AF37]/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-[#FF9933]/12 blur-3xl" />
            <h3 className="relative font-display text-2xl font-bold text-white sm:text-3xl">{t('schedule.cta.title')}</h3>
            <p className="relative mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-[15px]">
              {t('schedule.cta.text')}
            </p>
            <div className="relative mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button href="/#contact" variant="gold" className="min-w-[140px] rounded-xl">
                {t('schedule.cta.join')}
              </Button>
              <a
                href="/#contact"
                className="inline-flex min-w-[140px] items-center justify-center rounded-xl border border-[#D4AF37]/40 bg-transparent px-5 py-2.5 text-sm font-semibold text-[#F5D76E] transition duration-300 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:shadow-[0_0_24px_rgba(212,175,55,0.25)]"
              >
                {t('schedule.cta.contact')}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
