import { Link } from 'react-router-dom';
import kuldeepLogo from '../../assets/akhada/coaches/kuldeep-malik.webp';
import useTranslation from '../../hooks/useTranslation';

export default function Logo({ className = '', showText = true, invert = false }) {
  const { t } = useTranslation();
  const nameClass = invert ? 'text-white' : 'text-[#071A2B]';
  const subClass = invert ? 'text-[#F5A400]' : 'text-[#0B3D2E]';

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={kuldeepLogo}
        alt={`${t('brand.name')} ${t('brand.akhada')}`}
        className="h-10 w-10 shrink-0 rounded-full object-cover object-top shadow-[0_2px_10px_rgba(7,26,43,0.14)] sm:h-11 sm:w-11"
      />
      {showText ? (
        <span className={`font-display text-[14px] font-extrabold leading-tight tracking-tight sm:text-[15px] ${nameClass}`}>
          {t('brand.name')}
          <span className={`block text-[11px] font-bold tracking-[0.06em] sm:text-[12px] ${subClass}`}>
            {t('brand.akhada')}
          </span>
        </span>
      ) : null}
    </Link>
  );
}
