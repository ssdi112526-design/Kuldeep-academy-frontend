import { FaMedal, FaStar, FaTrophy } from 'react-icons/fa';
import { normalizeMedal } from '../../utils/medals';

const PRESETS = {
  Gold: {
    label: 'Gold Medalist',
    short: 'GOLD',
    Icon: FaMedal,
    shield:
      'from-[#FFF1B0] via-[#E8C547] to-[#9A7210] text-[#3D2A08] shadow-[0_8px_20px_rgba(154,114,16,0.45)]',
    rim: 'border-[#8B6914]/50',
    star: 'text-[#7A5A12]',
    pin: 'from-[#FFF3C4] via-[#E8C547] to-[#A67C1A]',
    pinRing: 'ring-[#8B6914]/40',
    pinIcon: 'text-[#5C3D0A]',
    tip: '#8B6914',
  },
  Silver: {
    label: 'Silver Medalist',
    short: 'SILVER',
    Icon: FaMedal,
    shield:
      'from-[#F8FAFC] via-[#D1D5DB] to-[#6B7280] text-[#111827] shadow-[0_8px_20px_rgba(75,85,99,0.35)]',
    rim: 'border-slate-400/70',
    star: 'text-slate-700',
    pin: 'from-white via-[#D1D5DB] to-[#64748B]',
    pinRing: 'ring-slate-400/50',
    pinIcon: 'text-slate-800',
    tip: '#475569',
  },
  Bronze: {
    label: 'Bronze Medalist',
    short: 'BRONZE',
    Icon: FaMedal,
    shield:
      'from-[#F6C9A0] via-[#D97706] to-[#7C2D12] text-[#FFF7ED] shadow-[0_8px_20px_rgba(124,45,18,0.4)]',
    rim: 'border-orange-900/40',
    star: 'text-[#FFEDD5]',
    pin: 'from-[#FDBA74] via-[#D97706] to-[#9A3412]',
    pinRing: 'ring-orange-900/35',
    pinIcon: 'text-[#FFF7ED]',
    tip: '#7C2D12',
  },
  Other: {
    label: 'Champion',
    short: 'CHAMP',
    Icon: FaMedal,
    shield:
      'from-[#2A2118] via-[#1A1410] to-[#0C0A09] text-[#F5E6C8] shadow-[0_8px_20px_rgba(0,0,0,0.4)]',
    rim: 'border-[#C9A227]/50',
    star: 'text-[#C9A227]',
    pin: 'from-[#E8C547] via-[#C9A227] to-[#8B6914]',
    pinRing: 'ring-[#C9A227]/40',
    pinIcon: 'text-[#1A1410]',
    tip: '#6B4F0F',
  },
};

/** Top-right metallic shield badge */
export default function ChampionMedalBadge({ medal, className = '' }) {
  const key = normalizeMedal(medal);
  if (!key) return null;
  const preset = PRESETS[key] || PRESETS.Other;

  return (
    <div
      className={`pointer-events-none absolute right-2.5 top-2.5 z-[4] sm:right-3 sm:top-3 ${className}`}
      aria-label={preset.label}
    >
      <div
        className={`relative flex w-[4.75rem] flex-col items-center border bg-gradient-to-b px-1.5 pb-3.5 pt-1.5 sm:w-[5.4rem] sm:px-2 sm:pb-4 sm:pt-2 ${preset.rim} ${preset.shield}`}
        style={{
          clipPath: 'polygon(6% 0, 94% 0, 100% 12%, 100% 72%, 50% 100%, 0 72%, 0 12%)',
        }}
      >
        <span className="text-center text-[7px] font-extrabold uppercase leading-[1.12] tracking-[0.05em] sm:text-[8px]">
          {preset.label.split(' ').map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </span>
        <FaStar className={`mt-1 text-[8px] sm:mt-1.5 sm:text-[9px] ${preset.star}`} aria-hidden />
      </div>
    </div>
  );
}

/** Top-left circular medal pin (medal icon, not trophy) */
export function ChampionRibbonPin({ medal, className = '' }) {
  const key = normalizeMedal(medal) || 'Other';
  const preset = PRESETS[key] || PRESETS.Other;
  const { Icon } = preset;

  return (
    <div
      className={`pointer-events-none absolute left-2.5 top-2.5 z-[4] sm:left-3 sm:top-3 ${className}`}
      aria-hidden
    >
      <div className="flex flex-col items-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-b shadow-[0_4px_12px_rgba(0,0,0,0.35)] ring-2 sm:h-11 sm:w-11 ${preset.pin} ${preset.pinRing}`}
        >
          <Icon className={`text-sm drop-shadow-sm sm:text-[15px] ${preset.pinIcon}`} />
        </div>
        <span
          className="mt-0.5 h-0 w-0 border-l-[7px] border-r-[7px] border-t-[8px] border-l-transparent border-r-transparent"
          style={{ borderTopColor: preset.tip }}
        />
      </div>
    </div>
  );
}

export function medalHeadline(medal) {
  const key = normalizeMedal(medal);
  if (!key) return 'Achiever';
  return (PRESETS[key] || PRESETS.Other).label;
}

export function MedalTypeIcon({ medal, className = '' }) {
  const key = normalizeMedal(medal) || 'Other';
  const preset = PRESETS[key] || PRESETS.Other;
  const { Icon } = preset;
  return <Icon className={className} aria-hidden />;
}
