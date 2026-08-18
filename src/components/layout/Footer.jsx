import { Link } from 'react-router-dom';
import DualBrandLogos from '../ui/DualBrandLogos';
import { companyInfo, publicFooterLinks } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-white/10 bg-[#0C0A09] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 lg:py-12">
        <div className="max-w-md">
          <DualBrandLogos size="md" showText invert />
          <p className="mt-4 text-sm leading-relaxed text-[#A8A29E]">{t('footer.tagline')}</p>
          <p className="mt-2 text-xs text-[#78716C]">{companyInfo.name}</p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {publicFooterLinks.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className="text-[13px] font-semibold text-[#D6D3D1] transition hover:text-[#C9A227]"
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[11px] text-[#78716C]">
      Copyright Act {new Date().getFullYear()} {companyInfo.name}
      </div>
    </footer>
  );
}
