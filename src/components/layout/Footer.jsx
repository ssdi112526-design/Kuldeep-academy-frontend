import { useEffect, useState } from 'react';
import { FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaFacebookF, FaLinkedinIn, FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { companyInfo as fallbackCompany, navGroups, socialLinks as fallbackSocial } from '../../data/akhada';
import { societyInfo } from '../../data/society';
import useTranslation from '../../hooks/useTranslation';
import { siteSettingsService } from '../../services';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

const socialIconMap = {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
};

export default function Footer() {
  const { t } = useTranslation();
  const [companyInfo, setCompanyInfo] = useState(fallbackCompany);
  const [socialLinks, setSocialLinks] = useState(fallbackSocial);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const value = await cachedPublicGet('site-settings', async () => {
          const res = await siteSettingsService.getPublic();
          return res.data?.data?.siteSettings?.value || null;
        });
        if (cancelled || !value) return;
        if (value.company) {
          const cmsName = String(value.company.name || '');
          const cmsAddress = String(value.company.address || '');
          const stale =
            /raghunandan/i.test(cmsName) ||
            /karawal\s*nagar/i.test(cmsAddress) ||
            /raghunandanakhada/i.test(String(value.company.email || ''));
          setCompanyInfo({
            name: stale ? fallbackCompany.name : value.company.name || fallbackCompany.name,
            address: stale ? fallbackCompany.address : value.company.address || fallbackCompany.address,
            phones:
              !stale && Array.isArray(value.company.phones) && value.company.phones.length
                ? value.company.phones
                : fallbackCompany.phones,
            email: stale ? fallbackCompany.email : value.company.email || fallbackCompany.email,
          });
        }
        if (Array.isArray(value.social) && value.social.length) {
          setSocialLinks(value.social);
        }
      } catch {
        /* keep fallbacks */
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const linkCols = navGroups.filter((g) => g.children);

  return (
    <footer className="bg-[#071A2B] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-6 lg:px-8">
        <div className="lg:col-span-2">
          <Logo invert />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65">{t('footer.tagline')}</p>
          <p className="mt-4 text-xs leading-relaxed text-white/45">
            {societyInfo.name}
            <br />
            {t('about.registration.regNo')}: {societyInfo.registrationNo}
            <br />
            {t('about.registration.regDate')}: {societyInfo.registrationDate}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {socialLinks.map((social) => {
              const Icon = socialIconMap[social.icon];
              if (!Icon) return null;
              return (
                <a
                  key={social.label || social.href}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={social.label}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-white/15 text-white/70 transition hover:border-[#D97706]/60 hover:text-[#D97706]"
                >
                  <Icon size={14} />
                </a>
              );
            })}
          </div>
        </div>

        {linkCols.map((group) => (
          <div key={group.id}>
            <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#D97706]">
              {t(group.labelKey)}
            </h3>
            <ul className="space-y-2.5 text-sm text-white/65">
              {group.children.map((item) => (
                <li key={item.href + item.labelKey}>
                  <Link to={item.href} className="transition hover:text-white">
                    {t(item.labelKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-4 font-display text-xs font-bold uppercase tracking-[0.18em] text-[#D97706]">
            {t('footer.contact')}
          </h3>
          <ul className="space-y-3 text-sm text-white/65">
            <li className="flex gap-3">
              <FaMapMarkerAlt className="mt-1 shrink-0 text-[#D97706]" />
              <span className="break-words">{companyInfo.address}</span>
            </li>
            {(companyInfo.phones || []).slice(0, 1).map((phone) => (
              <li key={phone} className="flex items-center gap-3">
                <FaPhoneAlt className="shrink-0 text-[#D97706]" />
                <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white">
                  {phone}
                </a>
              </li>
            ))}
            {companyInfo.email ? (
              <li className="flex items-center gap-3">
                <FaEnvelope className="shrink-0 text-[#D97706]" />
                <a href={`mailto:${companyInfo.email}`} className="hover:text-white">
                  {companyInfo.email}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-white/45 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {t('brand.name')} {t('brand.akhada')}. {t('footer.rights')}
          </p>
          <div className="flex gap-5">
            <Link to="/#gallery" className="hover:text-white">
              {t('footer.gallery')}
            </Link>
            <Link to="/terms" className="hover:text-white">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-white">
              {t('footer.terms')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
