import kuldeepLogo from '../../assets/akhada/coaches/kuldeep-malik.webp';
import useTranslation from '../../hooks/useTranslation';

/** Brand mark: Kuldeep Malik portrait as the academy logo. */
export default function DualBrandLogos({
  className = '',
  size = 'md',
  showText = false,
  invert = false,
}) {
  const { t } = useTranslation();
  const sizes = {
    sm: 'h-9 w-9 sm:h-10 sm:w-10',
    md: 'h-10 w-10 sm:h-11 sm:w-11',
    lg: 'h-12 w-12 sm:h-14 sm:w-14',
  };
  const box = sizes[size] || sizes.md;
  const nameClass = invert ? 'text-white' : 'text-[#1A120B]';
  const subClass = invert ? 'text-[#C9A227]' : 'text-[#8B5E3C]';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 ${className}`}>
      <img
        src={kuldeepLogo}
        alt={t('brand.name')}
        width={56}
        height={56}
        decoding="async"
        fetchPriority="low"
        className={`${box} shrink-0 rounded-full object-cover object-top shadow-[0_2px_10px_rgba(0,0,0,0.25)] ring-1 ring-white/25`}
      />
      {showText ? (
        <span className={`font-display text-[13px] font-extrabold leading-tight tracking-tight sm:text-[15px] ${nameClass}`}>
          {t('brand.name')}
          <span className={`block text-[10px] font-bold uppercase tracking-[0.12em] sm:text-[11px] ${subClass}`}>
            {t('brand.akhada')}
          </span>
        </span>
      ) : null}
    </div>
  );
}
