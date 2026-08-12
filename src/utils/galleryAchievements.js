/** Shared gallery achievement badge types for public + admin UI */

export const GALLERY_ACHIEVEMENTS = [
  { value: 'none', label: 'None' },
  { value: 'gold', label: 'Gold Medalist', icon: '🥇', short: 'Gold Medalist' },
  { value: 'silver', label: 'Silver Medalist', icon: '🥈', short: 'Silver Medalist' },
  { value: 'bronze', label: 'Bronze Medalist', icon: '🥉', short: 'Bronze Medalist' },
  { value: 'champion', label: 'Champion', icon: '🏆', short: 'Champion' },
  { value: 'national', label: 'National Medalist', icon: '⭐', short: 'National Medalist' },
  { value: 'state', label: 'State Medalist', icon: '⭐', short: 'State Medalist' },
  { value: 'winner', label: 'Competition Winner', icon: '🏆', short: 'Competition Winner' },
];

const byValue = Object.fromEntries(GALLERY_ACHIEVEMENTS.map((a) => [a.value, a]));

export function normalizeAchievementType(value) {
  const key = String(value || 'none').trim().toLowerCase();
  return byValue[key] ? key : 'none';
}

export function resolveAchievement(item) {
  if (!item) return null;
  const type = normalizeAchievementType(item.achievementType);
  if (type === 'none') return null;
  const meta = byValue[type];
  const custom = String(item.achievementLabel || '').trim();
  const label =
    custom && !GALLERY_ACHIEVEMENTS.some((a) => a.value !== type && a.short === custom)
      ? custom
      : meta.short;
  return { type, label, icon: meta.icon };
}

/** Premium sports-medal badge treatments */
export const ACHIEVEMENT_BADGE_STYLES = {
  gold: {
    wrap: 'border-[#F0D060]/85 bg-[linear-gradient(135deg,#5C4810_0%,#C9A227_45%,#3D2E08_100%)] text-[#FFF6D0]',
    glow: 'shadow-[0_4px_18px_rgba(201,162,39,0.55)]',
  },
  silver: {
    wrap: 'border-[#E8EAED]/80 bg-[linear-gradient(135deg,#4B5563_0%,#C8CDD4_48%,#1F2937_100%)] text-white',
    glow: 'shadow-[0_4px_18px_rgba(180,190,200,0.45)]',
  },
  bronze: {
    wrap: 'border-[#E0A878]/80 bg-[linear-gradient(135deg,#5C3317_0%,#C48A5A_48%,#2A160C_100%)] text-[#FFE4C8]',
    glow: 'shadow-[0_4px_18px_rgba(180,110,60,0.45)]',
  },
  champion: {
    wrap: 'border-[#F0D060]/90 bg-[linear-gradient(135deg,#2A1F08_0%,#C9A227_40%,#7A5C12_70%,#1A1208_100%)] text-[#FFF4C2]',
    glow: 'shadow-[0_6px_22px_rgba(201,162,39,0.6)]',
  },
  national: {
    wrap: 'border-[#F0D060]/70 bg-[linear-gradient(135deg,#1C1917_0%,#3D2E08_50%,#0C0A09_100%)] text-[#F5E6B8]',
    glow: 'shadow-[0_4px_16px_rgba(201,162,39,0.35)]',
  },
  state: {
    wrap: 'border-amber-200/50 bg-[linear-gradient(135deg,#1C1917_0%,#44403C_50%,#0C0A09_100%)] text-[#F5F5F4]',
    glow: 'shadow-[0_4px_14px_rgba(0,0,0,0.4)]',
  },
  winner: {
    wrap: 'border-[#C9A227]/75 bg-[linear-gradient(135deg,#1C1917_0%,#8B6914_55%,#0C0A09_100%)] text-[#F0D060]',
    glow: 'shadow-[0_4px_18px_rgba(201,162,39,0.4)]',
  },
};
