import { Link } from 'react-router-dom';
import logoImg from '../../assets/logo.png';
import useTranslation from '../../hooks/useTranslation';

export default function Logo({ className = '', showText = true }) {
  const { t } = useTranslation();
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={logoImg}
        alt={t('brand.name') + ' ' + t('brand.akhada')}
        className="h-11 w-11 shrink-0 rounded-full object-contain shadow-[0_2px_10px_rgba(7,26,53,0.12)]"
      />
      {showText && (
        <span className="font-display text-[15px] font-bold leading-tight tracking-tight text-[#071A35] sm:text-base">
          {t('brand.name')}
          <span className="block text-[12px] font-semibold tracking-[0.04em] text-[#2563EB] sm:text-[13px]">
            {t('brand.akhada')}
          </span>
        </span>
      )}
    </Link>
  );
}
