export const MEDAL_OPTIONS = [
  { key: 'Gold', label: 'Gold' },
  { key: 'Silver', label: 'Silver' },
  { key: 'Bronze', label: 'Bronze' },
  { key: 'Other', label: 'None' },
];

export function normalizeMedal(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  if (lower === 'gold' || lower === '1st' || lower === 'first') return 'Gold';
  if (lower === 'silver' || lower === '2nd' || lower === 'second') return 'Silver';
  if (lower === 'bronze' || lower === '3rd' || lower === 'third') return 'Bronze';
  if (lower === 'none' || lower === 'other' || lower === 'custom') return 'Other';
  if (MEDAL_OPTIONS.some((m) => m.key === raw)) return raw;
  return raw;
}

export const MEDAL_BADGE_STYLES = {
  Gold: {
    wrap: 'border-amber-300/80 bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 text-amber-950',
    glow: 'shadow-[0_0_18px_rgba(245,158,11,0.45)]',
    icon: '🥇',
  },
  Silver: {
    wrap: 'border-slate-300/90 bg-gradient-to-br from-slate-100 via-slate-200 to-slate-400 text-slate-900',
    glow: 'shadow-[0_0_16px_rgba(148,163,184,0.5)]',
    icon: '🥈',
  },
  Bronze: {
    wrap: 'border-orange-400/70 bg-gradient-to-br from-orange-200 via-amber-600 to-orange-800 text-orange-50',
    glow: 'shadow-[0_0_16px_rgba(194,65,12,0.4)]',
    icon: '🥉',
  },
  Other: {
    wrap: 'border-[#C9A227]/50 bg-gradient-to-br from-[#2A2118] to-[#1A1410] text-[#F5E6C8]',
    glow: 'shadow-[0_0_14px_rgba(201,162,39,0.35)]',
    icon: '🏆',
  },
};
