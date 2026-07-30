import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaFacebookF, FaLinkedinIn, FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { companyInfo, footerProgramKeys, navLinks, socialLinks } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

const socialIconMap = {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
};

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-[#E5E7EB] bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-[#6B7280]">{t('footer.tagline')}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socialLinks.map((social) => {
              const Icon = socialIconMap[social.icon];
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E7EB] text-[#6B7280] transition hover:border-[#2563EB]/40 hover:text-[#2563EB]"
                >
                  <Icon size={14} />
                </a>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-[#111827]">
            {t('footer.quickLinks')}
          </h3>
          <ul className="space-y-2.5 text-sm text-[#6B7280]">
            {navLinks.slice(0, 6).map((item) => (
              <li key={item.href}>
                <Link to={item.href} className="transition hover:text-[#111827]">
                  {t(item.labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-[#111827]">
            {t('footer.programs')}
          </h3>
          <ul className="space-y-2.5 text-sm text-[#6B7280]">
            {footerProgramKeys.map((key) => (
              <li key={key}>
                <Link to="/#programs" className="transition hover:text-[#111827]">
                  {t(`footer.programItems.${key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-[#111827]">
            {t('footer.contact')}
          </h3>
          <ul className="space-y-3 text-sm text-[#6B7280]">
            <li className="flex gap-3">
              <FaMapMarkerAlt className="mt-1 shrink-0 text-[#F59E0B]" />
              <span>{companyInfo.address}</span>
            </li>
            <li className="flex items-center gap-3">
              <FaPhoneAlt className="shrink-0 text-[#F59E0B]" />
              <a href={`tel:${companyInfo.phones[0].replace(/\s/g, '')}`} className="hover:text-[#111827]">
                {companyInfo.phones[0]}
              </a>
            </li>
            <li className="flex items-center gap-3">
              <FaEnvelope className="shrink-0 text-[#F59E0B]" />
              <a href={`mailto:${companyInfo.email}`} className="hover:text-[#111827]">
                {companyInfo.email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#E5E7EB]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-[#9CA3AF] sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {t('brand.name')} {t('brand.akhada')}. {t('footer.rights')}
          </p>
          <div className="flex gap-5">
            <Link to="/#gallery" className="hover:text-[#111827]">
              {t('footer.gallery')}
            </Link>
            <Link to="/terms" className="hover:text-[#111827]">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-[#111827]">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
