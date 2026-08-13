import { useEffect, useState } from 'react';
import {
  FaCalendarAlt,
  FaCrown,
  FaMapMarkerAlt,
  FaQuoteLeft,
  FaStar,
  FaTrophy,
  FaUser,
  FaWeightHanging,
} from 'react-icons/fa';
import Reveal from '../ui/Reveal';
import ChampionMedalBadge, {
  ChampionRibbonPin,
  MedalTypeIcon,
  medalHeadline,
} from '../ui/ChampionMedalBadge';
import { playerAchievementPublicService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';
import { normalizeMedal } from '../../utils/medals';

const THEMES = {
  Gold: {
    dark: true,
    card: 'border-[#C9A227]/55 bg-[#14110E] shadow-[0_12px_36px_rgba(201,162,39,0.22)]',
    name: 'text-white',
    meta: 'text-[#E8C547]',
    desc: 'text-[#C9BFAE]',
    chip: 'border-[#C9A227]/35 bg-[#1C1814] text-[#F0D060]',
    chipIcon: 'text-[#C9A227]',
    level: 'National Level',
  },
  Silver: {
    dark: false,
    card: 'border-slate-200 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)]',
    name: 'text-[#111827]',
    meta: 'text-slate-600',
    desc: 'text-slate-600',
    chip: 'border-slate-200 bg-slate-50 text-slate-700',
    chipIcon: 'text-slate-500',
    level: 'State Level',
  },
  Bronze: {
    dark: false,
    card: 'border-orange-200/80 bg-white shadow-[0_10px_28px_rgba(124,45,18,0.1)]',
    name: 'text-[#1A1410]',
    meta: 'text-[#9A3412]',
    desc: 'text-[#5C5346]',
    chip: 'border-orange-200 bg-orange-50/80 text-[#7C2D12]',
    chipIcon: 'text-[#C2410C]',
    level: 'District Level',
  },
  Other: {
    dark: false,
    card: 'border-[#E5DCCE] bg-white shadow-[0_10px_28px_rgba(26,20,16,0.08)]',
    name: 'text-[#1A1410]',
    meta: 'text-[#8B5E3C]',
    desc: 'text-[#5C5346]',
    chip: 'border-[#E5DCCE] bg-[#F7F3EC] text-[#5C5346]',
    chipIcon: 'text-[#C9A227]',
    level: 'Academy Level',
  },
};

function buildStats(item) {
  const year =
    item.year ||
    (item.achievedOn ? new Date(item.achievedOn).getFullYear() : null);
  const event =
    item.tournamentName ||
    item.playerCategory ||
    item.achievementType ||
    item.location ||
    null;
  return [
    year ? { key: 'year', label: String(year), Icon: FaCalendarAlt } : null,
    event ? { key: 'event', label: event, Icon: FaMapMarkerAlt } : null,
    item.weightCategory?.trim()
      ? { key: 'weight', label: item.weightCategory.trim(), Icon: FaWeightHanging }
      : null,
    item.ageCategory?.trim()
      ? { key: 'age', label: item.ageCategory.trim(), Icon: FaUser }
      : null,
  ].filter(Boolean);
}

function levelLine(item, medalKey, theme) {
  if (item.achievementType?.trim()) return item.achievementType.trim();
  if (item.result?.trim()) return item.result.trim();
  return theme.level;
}

function AchievementCard({ item }) {
  const photo = mediaUrl(item.image) || mediaUrl(item.player?.photo);
  const playerName = item.playerName || item.player?.fullName || 'Player';
  const medalKey = normalizeMedal(item.medal) || 'Other';
  const theme = THEMES[medalKey] || THEMES.Other;
  const stats = buildStats(item);
  const level = levelLine(item, medalKey, theme);
  const description =
    item.description?.trim() ||
    'Representing Kuldeep Malik Sports Academy with pride on the mat.';

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[1.35rem] border transition duration-300 hover:-translate-y-1 ${theme.card}`}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-[#1A1410]">
        {photo ? (
          <img
            src={photo}
            alt={playerName}
            loading="lazy"
            className="h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#2A2118] to-[#1A1410]">
            <FaTrophy className="text-4xl text-[#C9A227]/45" aria-hidden />
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent"
          aria-hidden
        />
        <ChampionRibbonPin medal={item.medal} />
        <ChampionMedalBadge medal={item.medal} />
      </div>

      <div className="flex flex-1 flex-col px-4 pb-5 pt-4 sm:px-5">
        <h3 className={`font-display text-[1.35rem] font-bold leading-tight tracking-tight sm:text-[1.5rem] ${theme.name}`}>
          {playerName}
        </h3>

        <p className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] ${theme.meta}`}>
          <MedalTypeIcon medal={item.medal} className="shrink-0 text-[11px]" />
          <span>
            {medalHeadline(item.medal)}
            <span className="mx-1 opacity-50">•</span>
            {level}
          </span>
        </p>

        {item.title ? (
          <p className={`mt-1 text-sm font-semibold ${theme.dark ? 'text-[#EDE6DA]' : 'text-[#3D342C]'}`}>
            {item.title}
          </p>
        ) : null}

        {stats.length ? (
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            {stats.map(({ key, label, Icon }) => (
              <div
                key={key}
                className={`flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1.5 text-[11px] font-semibold ${theme.chip}`}
              >
                <Icon className={`shrink-0 text-[10px] ${theme.chipIcon}`} aria-hidden />
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        ) : null}

        <p className={`mt-3 line-clamp-2 text-[12px] leading-relaxed sm:text-[13px] ${theme.desc}`}>
          {description}
        </p>
      </div>
    </article>
  );
}

function Laurel({ flip = false }) {
  return (
    <svg
      width="42"
      height="48"
      viewBox="0 0 42 48"
      fill="none"
      aria-hidden
      className={`text-[#C9A227] ${flip ? 'scale-x-[-1]' : ''}`}
    >
      <path
        d="M21 44c-1-8 2-16 8-22 4-4 8-6 10-7-2 6-3 12-2 18-4 4-10 8-16 11z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M21 40c-1-7 0-14 4-20 2-4 5-7 7-9-1 6-1 12 1 17-3 4-7 8-12 12z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M20 36c0-6-1-12-4-17-2-4-5-7-7-9 2 6 3 12 2 17 3 3 6 6 9 9z"
        fill="currentColor"
        opacity="0.7"
      />
    </svg>
  );
}

export default function Achievements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const list = await cachedPublicGet('player-achievements-v2', async () => {
          const res = await playerAchievementPublicService.listPublic();
          return res.data?.data?.achievements || [];
        });
        if (alive) setItems(list);
      } catch {
        if (alive) setError('Unable to load achievements right now.');
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
      id="achievements"
      className="relative overflow-hidden bg-[#F4EFE6] py-16 sm:py-20 lg:py-24"
      aria-labelledby="achievements-heading"
    >
      {/* Background atmosphere + wrestling watermarks */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 20% 10%, rgba(201,162,39,0.1), transparent 40%), radial-gradient(ellipse at 80% 90%, rgba(45,36,28,0.06), transparent 42%), linear-gradient(180deg, #F8F3EA 0%, #F4EFE6 50%, #EFE8DC 100%)',
          }}
        />
        <svg
          className="absolute -left-6 bottom-24 h-[22rem] w-[22rem] text-[#8B6914] opacity-[0.07] sm:h-[28rem] sm:w-[28rem]"
          viewBox="0 0 320 320"
          fill="currentColor"
        >
          <path d="M95 70c14 0 25 14 25 32s-11 32-25 32-25-14-25-32 11-32 25-32zm95 18c12 0 22 12 22 28s-10 28-22 28-22-12-22-28 10-28 22-28zM78 150c28 4 48 28 54 56l10 74H112l-8-52-14 18v54H58v-78c0-28 8-54 20-72zm128 10c22 14 32 42 32 70v70h-32v-62c0-18-4-32-14-42l-28 30-12-22 22-28c12-12 22-18 32-16z" />
        </svg>
        <svg
          className="absolute -right-8 top-28 h-[20rem] w-[20rem] text-[#8B6914] opacity-[0.06] sm:h-[26rem] sm:w-[26rem]"
          viewBox="0 0 320 320"
          fill="currentColor"
        >
          <path d="M160 48c18 0 32 16 32 36s-14 36-32 36-32-16-32-36 14-36 32-36zM98 140c28-12 56-12 84 0 28 14 44 44 48 76l8 64h-36l-6-52c-4-22-16-36-30-42l-14 84h-28l-14-84c-14 6-26 20-30 42l-6 52H68l8-64c4-32 20-62 48-76z" />
        </svg>
      </div>

      <div className="relative mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
        {/* Header: title left + quote right */}
        <Reveal>
          <div className="grid items-start gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
            <div>
              <div className="flex items-center gap-2 text-[#C9A227]">
                <FaTrophy className="text-sm" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-[0.28em]">Achievements</p>
              </div>
              <h2
                id="achievements-heading"
                className="mt-2 font-display text-[clamp(2.4rem,5vw,3.75rem)] font-extrabold uppercase leading-[0.95] tracking-tight"
              >
                <span className="text-[#14110E]">Champions </span>
                <span
                  className="bg-gradient-to-b from-[#E8C547] via-[#C9A227] to-[#8B6914] bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: 'text' }}
                >
                  Wall
                </span>
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5C5346] sm:text-[15px]">
                Celebrating wrestlers who brought pride to Kuldeep Malik Sports Academy through
                district, state and national achievements.
              </p>
            </div>

            <aside className="relative rounded-2xl border border-[#E8D9B8] bg-[#F7F0DE] px-5 py-5 shadow-[0_8px_24px_rgba(139,105,20,0.08)] sm:px-6">
              <FaQuoteLeft className="text-2xl text-[#C9A227]/80" aria-hidden />
              <p className="mt-3 font-display text-lg font-semibold leading-snug text-[#2A2118] sm:text-xl">
                Every medal has a story. Every champion, an inspiration.
              </p>
              <div className="mt-4 flex items-center justify-center gap-1.5 text-[#C9A227]" aria-hidden>
                <FaStar className="text-[10px]" />
                <FaStar className="text-[10px]" />
                <FaStar className="text-[10px]" />
              </div>
            </aside>
          </div>
        </Reveal>

        {loading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[28rem] animate-pulse rounded-[1.35rem] bg-[#E8E0D4]" />
            ))}
          </div>
        ) : error ? (
          <p className="mt-12 text-center text-sm text-red-700">{error}</p>
        ) : !items.length ? (
          <div className="mx-auto mt-12 max-w-lg rounded-2xl border border-dashed border-[#D6CBB8] bg-white/70 px-6 py-14 text-center text-sm text-[#5C5346]">
            Achievements will appear here when the Academy adds them.
          </div>
        ) : (
          <div className="mt-12 grid auto-rows-fr gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, index) => (
              <Reveal key={item.id || item._id} delay={Math.min(index * 0.04, 0.2)}>
                <AchievementCard item={item} />
              </Reveal>
            ))}
          </div>
        )}

        {/* Footer badge */}
        <Reveal delay={0.1}>
          <div className="mt-14 flex flex-col items-center">
            <FaCrown className="mb-2 text-lg text-[#C9A227]" aria-hidden />
            <div className="flex items-center gap-2 sm:gap-3">
              <Laurel />
              <div className="rounded-full border border-[#C9A227]/40 bg-[#14110E] px-5 py-2.5 shadow-[0_8px_24px_rgba(20,17,14,0.25)] sm:px-7">
                <p className="font-display text-[11px] font-bold uppercase tracking-[0.22em] text-[#F0D060] sm:text-xs">
                  Pride <span className="mx-1.5 text-[#C9A227]/70">•</span> Discipline{' '}
                  <span className="mx-1.5 text-[#C9A227]/70">•</span> Victory
                </p>
              </div>
              <Laurel flip />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
