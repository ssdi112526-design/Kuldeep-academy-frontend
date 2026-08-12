import { ACHIEVEMENT_BADGE_STYLES, resolveAchievement } from '../../utils/galleryAchievements';

/** Premium sports achievement badge for gallery cards / lightbox */
export default function GalleryAchievementBadge({ item, className = '', size = 'sm' }) {
  const achievement = resolveAchievement(item);
  if (!achievement) return null;

  const style = ACHIEVEMENT_BADGE_STYLES[achievement.type] || ACHIEVEMENT_BADGE_STYLES.champion;
  const sizeClass =
    size === 'lg'
      ? 'gap-1.5 px-3 py-1.5 text-[11px] sm:px-3.5 sm:text-xs'
      : 'gap-1 px-2 py-1 text-[8px] sm:gap-1.5 sm:px-2.5 sm:py-1 sm:text-[10px]';

  return (
    <span
      className={`pointer-events-none absolute left-2.5 top-2.5 z-[3] inline-flex max-w-[calc(100%-1.25rem)] items-center rounded-md border font-extrabold uppercase tracking-[0.08em] ${sizeClass} ${style.wrap} ${style.glow} ${className}`}
    >
      <span className="shrink-0 text-[1.05em] leading-none drop-shadow-sm" aria-hidden>
        {achievement.icon}
      </span>
      <span className="truncate">{achievement.label}</span>
    </span>
  );
}
