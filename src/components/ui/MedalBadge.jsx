import { MEDAL_BADGE_STYLES, normalizeMedal } from '../../utils/medals';

/** Professional medal badge synced to stored medal value */
export default function MedalBadge({ medal, className = '', size = 'md', position = 'overlay' }) {
  const key = normalizeMedal(medal);
  if (!key) return null;

  const style = MEDAL_BADGE_STYLES[key] || MEDAL_BADGE_STYLES.Other;
  const sizeClass =
    size === 'lg'
      ? 'gap-1.5 px-3 py-1.5 text-[11px] sm:px-3.5 sm:text-xs'
      : size === 'sm'
        ? 'gap-1 px-2 py-0.5 text-[9px]'
        : 'gap-1.5 px-2.5 py-1 text-[10px] sm:text-[11px]';

  const positionClass =
    position === 'overlay'
      ? 'pointer-events-none absolute bottom-2.5 left-2.5 z-[3] max-w-[calc(100%-1.25rem)]'
      : 'inline-flex max-w-full';

  return (
    <span
      className={`${positionClass} inline-flex items-center rounded-md border font-extrabold uppercase tracking-[0.1em] ${sizeClass} ${style.wrap} ${style.glow} ${className}`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          key === 'Gold'
            ? 'bg-amber-700'
            : key === 'Silver'
              ? 'bg-slate-600'
              : key === 'Bronze'
                ? 'bg-orange-950'
                : 'bg-[#C9A227]'
        }`}
        aria-hidden
      />
      <span className="truncate">{key === 'Other' ? medal || 'Achievement' : key}</span>
    </span>
  );
}
