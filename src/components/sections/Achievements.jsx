import { useEffect, useMemo, useState } from 'react';
import {
  FaAward,
  FaCalendarAlt,
  FaChartBar,
  FaNewspaper,
  FaShieldAlt,
  FaSyncAlt,
  FaTrophy,
} from 'react-icons/fa';
import Reveal from '../ui/Reveal';
import MedalBadge from '../ui/MedalBadge';
import { medalHeadline } from '../ui/ChampionMedalBadge';
import { playerAchievementPublicService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';
import { normalizeMedal } from '../../utils/medals';

const LEVEL_ROWS = [
  { key: 'asian', label: 'Asian Level' },
  { key: 'national', label: 'National Level' },
  { key: 'state', label: 'State Level' },
  { key: 'district', label: 'District Level' },
];

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function levelLabel(level) {
  return LEVEL_ROWS.find((row) => row.key === level)?.label || null;
}

function achievementHeadline(item) {
  if (item.title?.trim()) return item.title.trim();
  const parts = [item.playerName, item.weightCategory].filter(Boolean);
  return parts.join(' — ') || 'Achievement';
}

function achievementDetails(item) {
  if (item.description?.trim()) return item.description.trim();
  const bits = [
    item.competition || item.tournamentName,
    levelLabel(item.level),
    normalizeMedal(item.medal) ? `${normalizeMedal(item.medal)} medal` : null,
  ].filter(Boolean);
  return bits.join(' — ') || 'Representing Kuldeep Malik Sports Academy with pride.';
}

function playerLine(item) {
  return [item.playerName, item.weightCategory, item.ageCategory].filter(Boolean).join(' ');
}

function metaLine(item) {
  return [levelLabel(item.level), formatDate(item.achievedOn)].filter((v) => v && v !== '—').join(' • ');
}

function rowTotal(levelData) {
  return (levelData?.gold || 0) + (levelData?.silver || 0) + (levelData?.bronze || 0);
}

function LaurelDivider() {
  return (
    <div className="mt-5 flex items-center justify-center gap-3" aria-hidden>
      <span className="h-px w-16 bg-gradient-to-r from-transparent to-[#C9A227]/70 sm:w-24" />
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#C9A227]/40 bg-[#1A1410] text-[#E8C547] shadow-[0_0_18px_rgba(201,162,39,0.2)]">
        <FaAward className="text-sm" />
      </div>
      <span className="h-px w-16 bg-gradient-to-l from-transparent to-[#C9A227]/70 sm:w-24" />
    </div>
  );
}

function PanelCard({ children, className = '' }) {
  return (
    <div
      className={`min-w-0 w-full rounded-[1.15rem] border border-[#C9A227]/25 bg-[#14110E]/95 shadow-[0_18px_50px_rgba(0,0,0,0.28)] ${className}`}
    >
      {children}
    </div>
  );
}

function MedalGlyph({ type }) {
  if (type === 'trophy') {
    return (
      <svg viewBox="0 0 80 80" className="h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]" aria-hidden>
        <defs>
          <linearGradient id="trophyGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFF3C4" />
            <stop offset="45%" stopColor="#E8C547" />
            <stop offset="100%" stopColor="#8B6914" />
          </linearGradient>
        </defs>
        <path d="M24 18h32c1 10 2 18-4 26-4 5-10 8-12 9-2-1-8-4-12-9-6-8-5-16-4-26z" fill="url(#trophyGold)" />
        <path d="M24 20c-8 2-12 10-10 18 2 7 8 10 14 10" fill="none" stroke="#C9A227" strokeWidth="3" />
        <path d="M56 20c8 2 12 10 10 18-2 7-8 10-14 10" fill="none" stroke="#C9A227" strokeWidth="3" />
        <rect x="36" y="52" width="8" height="10" rx="1" fill="#C9A227" />
        <path d="M28 66h24l-3-4H31z" fill="#E8C547" />
        <ellipse cx="40" cy="18" rx="10" ry="4" fill="#FFF3C4" />
      </svg>
    );
  }

  const palettes = {
    gold: { a: '#FFF3C4', b: '#E8C547', c: '#8B6914', ribbon: '#B45309', star: '#7A5A12' },
    silver: { a: '#FFFFFF', b: '#D1D5DB', c: '#64748B', ribbon: '#475569', star: '#334155' },
    bronze: { a: '#F6C9A0', b: '#D97706', c: '#7C2D12', ribbon: '#9A3412', star: '#FFEDD5' },
  };
  const p = palettes[type] || palettes.gold;

  return (
    <svg viewBox="0 0 80 80" className="h-14 w-14 sm:h-[4.5rem] sm:w-[4.5rem]" aria-hidden>
      <defs>
        <linearGradient id={`${type}Medal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={p.a} />
          <stop offset="50%" stopColor={p.b} />
          <stop offset="100%" stopColor={p.c} />
        </linearGradient>
      </defs>
      <path d="M28 8h10l4 18H32z" fill={p.ribbon} />
      <path d="M42 8h10l-6 18h-10z" fill={p.ribbon} opacity="0.85" />
      <circle cx="40" cy="48" r="22" fill={`url(#${type}Medal)`} stroke={p.c} strokeWidth="2" />
      <circle cx="40" cy="48" r="16" fill="none" stroke={p.a} strokeWidth="1.6" opacity="0.7" />
      <path
        d="M40 36l2.6 6.4 7 .6-5.3 4.6 1.6 6.8L40 51.2 34.1 54.4l1.6-6.8-5.3-4.6 7-.6z"
        fill={p.star}
      />
    </svg>
  );
}

function MedalTotalCard({ label, value, type, tone }) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-[#C9A227]/20 bg-[#0F0C09] px-2 py-3 text-center transition duration-300 hover:border-[#C9A227]/40 hover:shadow-[0_0_20px_rgba(201,162,39,0.12)] sm:px-3 sm:py-4">
      <p className={`text-[9px] font-bold uppercase tracking-[0.16em] sm:text-[10px] sm:tracking-[0.2em] ${tone}`}>
        {label}
      </p>
      <div className="mt-2 flex h-14 w-14 items-center justify-center drop-shadow-[0_8px_16px_rgba(0,0,0,0.45)] sm:h-[4.75rem] sm:w-[4.75rem]">
        <MedalGlyph type={type} />
      </div>
      <p className="mt-2 font-display text-2xl font-extrabold leading-none text-white sm:text-3xl">{value}</p>
    </div>
  );
}

function hasAchievementImage(item) {
  return Boolean(String(item?.image || '').trim());
}

function isActiveAchievement(item) {
  return item?.showOnWebsite !== false;
}

function AchievementMomentCard({ item }) {
  const photo = mediaUrl(item.image);
  const [imgFailed, setImgFailed] = useState(false);
  const showPhoto = Boolean(photo) && !imgFailed;

  return (
    <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#C9A227]/20 bg-[#14110E] shadow-[0_14px_40px_rgba(0,0,0,0.22)] transition duration-300 hover:-translate-y-1 hover:border-[#C9A227]/45 hover:shadow-[0_18px_48px_rgba(201,162,39,0.14)]">
      <div className="relative shrink-0">
        <div className="relative aspect-[4/3] overflow-hidden bg-[#0C0A09]">
          {showPhoto ? (
            <img
              src={photo}
              alt={achievementHeadline(item)}
              loading="lazy"
              decoding="async"
              onError={() => setImgFailed(true)}
              className="absolute inset-0 h-full w-full object-cover object-center transition duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#1A1410] to-[#0C0A09]">
              <FaTrophy className="text-4xl text-[#C9A227]/35" aria-hidden />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
        <div className="absolute -bottom-4 left-1/2 z-10 -translate-x-1/2">
          <MedalBadge medal={item.medal} position="inline" size="md" />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col px-3 pb-5 pt-8 sm:px-5">
        <p className="text-center text-xs font-bold uppercase tracking-[0.06em] text-[#E8C547] sm:text-sm sm:tracking-[0.08em]">
          {medalHeadline(item.medal)}
        </p>
        <h3 className="mt-2 break-words text-center font-display text-base font-bold leading-tight text-white sm:text-lg">
          {achievementHeadline(item)}
        </h3>
        {playerLine(item) ? (
          <p className="mt-2 break-words text-center text-sm font-semibold text-[#F1E6D1]">{playerLine(item)}</p>
        ) : null}
        {item.competition || item.tournamentName ? (
          <p className="mt-1 break-words text-center text-sm text-[#D6CBB8]">
            {item.competition || item.tournamentName}
          </p>
        ) : null}
        {metaLine(item) ? (
          <p className="mt-2 text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[#B9AA92] sm:text-xs sm:tracking-[0.06em]">
            {metaLine(item)}
          </p>
        ) : null}
        {item.description ? (
          <p className="mt-3 line-clamp-3 break-words text-center text-sm leading-relaxed text-[#B9AA92]">
            {item.description}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function HighlightRowCard({ item }) {
  return (
    <article className="rounded-xl border border-[#C9A227]/15 bg-[#0F0C09] p-3.5">
      <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#C9A227]">
        <FaCalendarAlt className="shrink-0 text-[10px]" aria-hidden />
        {formatDate(item.achievedOn)}
      </p>
      <h3 className="mt-1.5 break-words font-semibold leading-snug text-white">{achievementHeadline(item)}</h3>
      <p className="mt-1 break-words text-sm leading-relaxed text-[#B9AA92]">{achievementDetails(item)}</p>
    </article>
  );
}

function MedalColHead({ short, full }) {
  return (
    <>
      <span className="sm:hidden">{short}</span>
      <span className="hidden sm:inline">{full}</span>
    </>
  );
}

export default function Achievements() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    gold: 0,
    silver: 0,
    bronze: 0,
    levels: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const data = await cachedPublicGet('player-achievements-dashboard-v4', async () => {
          const res = await playerAchievementPublicService.listPublic();
          return res.data?.data || { achievements: [], summary: {} };
        });
        if (!alive) return;
        setItems(data.achievements || []);
        setSummary(
          data.summary || {
            total: 0,
            gold: 0,
            silver: 0,
            bronze: 0,
            levels: {},
          }
        );
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

  const levelTotals = useMemo(() => {
    const totals = { gold: 0, silver: 0, bronze: 0, total: 0 };
    for (const row of LEVEL_ROWS) {
      const level = summary.levels?.[row.key] || {};
      totals.gold += level.gold || 0;
      totals.silver += level.silver || 0;
      totals.bronze += level.bronze || 0;
    }
    totals.total = totals.gold + totals.silver + totals.bronze;
    return totals;
  }, [summary.levels]);

  const momentItems = useMemo(
    () => items.filter((item) => isActiveAchievement(item) && hasAchievementImage(item)),
    [items]
  );

  return (
    <section
      id="achievements"
      className="relative overflow-x-hidden overflow-y-hidden bg-[#090807] py-12 sm:py-16 lg:py-20"
      aria-labelledby="achievements-heading"
    >
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(201,162,39,0.14), transparent 32%), radial-gradient(circle at 15% 80%, rgba(201,162,39,0.08), transparent 24%), linear-gradient(180deg, #0C0A08 0%, #090807 100%)',
        }}
      />

      <div className="relative mx-auto max-w-[92rem] px-3 sm:px-6 lg:px-8">
        <Reveal>
          <div className="px-1 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#E8C547] sm:text-[11px] sm:tracking-[0.32em]">
              ACHIEVEMENTS
            </p>
            <h2
              id="achievements-heading"
              className="mt-3 font-display text-[clamp(1.7rem,8vw,3.4rem)] font-extrabold leading-tight tracking-tight text-white"
            >
              Our Proud Achievements
            </h2>
            <p className="mx-auto mt-4 max-w-2xl px-1 text-sm leading-relaxed text-[#D6CBB8] sm:text-[15px]">
              Milestones, medals and moments that define our legacy.
            </p>
            <LaurelDivider />
          </div>
        </Reveal>

        {loading ? (
          <div className="mt-10 space-y-6">
            <div className="grid gap-6 lg:grid-cols-[1.58fr_1fr]">
              <div className="h-[26rem] animate-pulse rounded-[1.15rem] bg-white/5" />
              <div className="h-[26rem] animate-pulse rounded-[1.15rem] bg-white/5" />
            </div>
            <div className="h-64 animate-pulse rounded-[1.15rem] bg-white/5" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-[1.15rem] bg-white/5" />
              ))}
            </div>
          </div>
        ) : error ? (
          <p className="mt-12 text-center text-sm text-red-300">{error}</p>
        ) : (
          <>
            <div className="mt-10 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.58fr)_minmax(0,1fr)] lg:items-stretch">
              <Reveal className="min-w-0">
                <PanelCard className="h-full p-3 sm:p-5">
                  <div className="flex items-start gap-3 border-b border-[#C9A227]/15 pb-4 sm:items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C9A227]/10 text-[#E8C547] sm:h-10 sm:w-10">
                      <FaNewspaper aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-white sm:text-lg">
                        Achievement Highlights
                      </p>
                      <p className="text-xs text-[#B9AA92]">(News &amp; Milestones)</p>
                    </div>
                  </div>

                  {items.length ? (
                    <>
                      <div className="mt-4 space-y-3 md:hidden">
                        {items.map((item) => (
                          <HighlightRowCard key={item.id || item._id} item={item} />
                        ))}
                      </div>
                      <div className="mt-4 hidden overflow-x-auto md:block">
                        <table className="w-full text-left text-sm">
                          <thead>
                            <tr className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E8C547]">
                              <th className="px-3 py-3">Date</th>
                              <th className="px-3 py-3">Achievement</th>
                              <th className="px-3 py-3">Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item) => (
                              <tr
                                key={item.id || item._id}
                                className="border-t border-white/8 align-top text-[#ECE3D4] transition hover:bg-white/[0.02]"
                              >
                                <td className="whitespace-nowrap px-3 py-4 text-[#D6CBB8]">
                                  <span className="inline-flex items-center gap-2">
                                    <FaCalendarAlt className="text-[10px] text-[#C9A227]" aria-hidden />
                                    {formatDate(item.achievedOn)}
                                  </span>
                                </td>
                                <td className="px-3 py-4 font-semibold text-white">
                                  {achievementHeadline(item)}
                                </td>
                                <td className="px-3 py-4 text-[#B9AA92]">{achievementDetails(item)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <p className="px-2 py-10 text-center text-sm text-[#B9AA92]">
                      Achievements will appear here when the Academy adds them.
                    </p>
                  )}
                </PanelCard>
              </Reveal>

              <Reveal className="min-w-0" delay={0.05}>
                <PanelCard className="h-full p-3 sm:p-5">
                  <div className="flex items-start gap-3 border-b border-[#C9A227]/15 pb-4 sm:items-center">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C9A227]/10 text-[#E8C547] sm:h-10 sm:w-10">
                      <FaTrophy aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display text-base font-bold text-white sm:text-lg">Total Medals</p>
                      <p className="text-xs text-[#B9AA92]">(All Time)</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
                    <MedalTotalCard
                      label="Gold"
                      value={summary.gold || 0}
                      type="gold"
                      tone="text-[#E8C547]"
                    />
                    <MedalTotalCard
                      label="Silver"
                      value={summary.silver || 0}
                      type="silver"
                      tone="text-slate-300"
                    />
                    <MedalTotalCard
                      label="Bronze"
                      value={summary.bronze || 0}
                      type="bronze"
                      tone="text-orange-300"
                    />
                    <MedalTotalCard
                      label="Total"
                      value={summary.total || 0}
                      type="trophy"
                      tone="text-[#E8C547]"
                    />
                  </div>

                  <div className="mt-4 rounded-xl border border-[#C9A227]/20 bg-[#0F0C09] px-3 py-3 text-xs leading-relaxed text-[#CBBEAA] sm:px-4">
                    <span className="mr-2 inline-flex text-[#E8C547]">
                      <FaAward aria-hidden />
                    </span>
                    A proud tally of medals earned across every level of competition
                  </div>
                </PanelCard>
              </Reveal>
            </div>

            <Reveal className="min-w-0" delay={0.08}>
              <div className="mt-5 grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_17rem]">
                <PanelCard className="overflow-hidden">
                  <div className="flex items-start gap-3 border-b border-[#C9A227]/15 px-3 py-4 sm:items-center sm:px-5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C9A227]/10 text-[#E8C547] sm:h-10 sm:w-10">
                      <FaChartBar aria-hidden />
                    </div>
                    <p className="min-w-0 font-display text-base font-bold leading-snug text-white sm:text-lg">
                      Medal Tally by Level
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed text-left text-[11px] sm:text-sm">
                      <thead className="bg-[#C9A227]/12 text-[10px] font-bold uppercase tracking-[0.08em] text-[#F4E3B0] sm:text-[11px] sm:tracking-[0.14em]">
                        <tr>
                          <th className="w-[36%] px-2 py-2.5 sm:px-5 sm:py-3">Level</th>
                          <th className="w-[16%] px-1 py-2.5 text-center sm:px-4 sm:py-3">
                            <MedalColHead short="G" full="Gold" />
                          </th>
                          <th className="w-[16%] px-1 py-2.5 text-center sm:px-4 sm:py-3">
                            <MedalColHead short="S" full="Silver" />
                          </th>
                          <th className="w-[16%] px-1 py-2.5 text-center sm:px-4 sm:py-3">
                            <MedalColHead short="B" full="Bronze" />
                          </th>
                          <th className="w-[16%] px-1 py-2.5 text-center sm:px-4 sm:py-3">
                            <MedalColHead short="T" full="Total" />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {LEVEL_ROWS.map((row) => {
                          const level = summary.levels?.[row.key] || {};
                          return (
                            <tr key={row.key} className="border-t border-white/8 text-[#F1E6D1]">
                              <td className="truncate px-2 py-3 font-medium sm:px-5 sm:py-3.5">{row.label}</td>
                              <td className="px-1 py-3 text-center sm:px-4 sm:py-3.5">{level.gold || 0}</td>
                              <td className="px-1 py-3 text-center sm:px-4 sm:py-3.5">{level.silver || 0}</td>
                              <td className="px-1 py-3 text-center sm:px-4 sm:py-3.5">{level.bronze || 0}</td>
                              <td className="px-1 py-3 text-center font-semibold text-[#E8C547] sm:px-4 sm:py-3.5">
                                {rowTotal(level)}
                              </td>
                            </tr>
                          );
                        })}
                        <tr className="border-t border-[#C9A227]/25 bg-[#C9A227]/8 font-bold text-white">
                          <td className="px-2 py-3 sm:px-5 sm:py-3.5">TOTAL</td>
                          <td className="px-1 py-3 text-center text-[#E8C547] sm:px-4 sm:py-3.5">{levelTotals.gold}</td>
                          <td className="px-1 py-3 text-center text-[#E8C547] sm:px-4 sm:py-3.5">{levelTotals.silver}</td>
                          <td className="px-1 py-3 text-center text-[#E8C547] sm:px-4 sm:py-3.5">{levelTotals.bronze}</td>
                          <td className="px-1 py-3 text-center text-[#E8C547] sm:px-4 sm:py-3.5">{levelTotals.total}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </PanelCard>

                <PanelCard className="flex items-center justify-center p-4 text-center sm:p-5 lg:min-h-full">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#C9A227]/30 bg-[#C9A227]/10 text-xl text-[#E8C547] sm:h-14 sm:w-14 sm:text-2xl">
                      <FaSyncAlt aria-hidden />
                    </div>
                    <p className="mt-4 text-sm leading-relaxed text-[#D6CBB8]">
                      All totals are
                      <span className="mt-1 block font-display text-lg font-extrabold uppercase tracking-[0.08em] text-[#E8C547] sm:text-xl sm:tracking-[0.12em]">
                        Automatic
                      </span>
                      and update instantly based on the data.
                    </p>
                  </div>
                </PanelCard>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-10 text-center">
                <h3 className="px-1 font-display text-[clamp(1.35rem,6vw,2.2rem)] font-extrabold leading-tight text-white">
                  Our Achievement Moments
                </h3>
                <p className="mx-auto mt-3 max-w-2xl px-1 text-sm leading-relaxed text-[#D6CBB8]">
                  Celebrating the victories, milestones and unforgettable moments of our wrestlers.
                </p>
              </div>
            </Reveal>

            {momentItems.length ? (
              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                {momentItems.map((item, index) => (
                  <Reveal
                    key={`moment-${item.id || item._id}`}
                    className="min-w-0"
                    delay={Math.min(index * 0.04, 0.2)}
                  >
                    <AchievementMomentCard item={item} />
                  </Reveal>
                ))}
              </div>
            ) : null}

            <Reveal delay={0.12}>
              <div className="mt-6 flex flex-col items-center justify-center gap-2 rounded-xl bg-[#F4E8CF] px-4 py-3.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] sm:flex-row sm:gap-3 sm:px-5 sm:py-4">
                <FaShieldAlt className="shrink-0 text-[#8B6914]" aria-hidden />
                <p className="font-display text-sm font-bold leading-snug tracking-[0.02em] text-[#2A2118] sm:text-base sm:tracking-[0.04em]">
                  Managed with care. Updated with pride.
                </p>
              </div>
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
