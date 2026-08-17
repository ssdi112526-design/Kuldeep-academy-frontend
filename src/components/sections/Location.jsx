import { useEffect, useState } from 'react';
import { FaMapMarkerAlt, FaDirections } from 'react-icons/fa';
import Reveal from '../ui/Reveal';
import { companyInfo as fallbackCompany } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';
import { attendanceSettingsService, siteSettingsService } from '../../services';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

const FALLBACK_MAP =
  'https://maps.google.com/maps?q=Bhatgaon%20Road%20Near%20Guru%20Sadan%20school%20Barwasni%20Sonipat%20Haryana&t=&z=15&ie=UTF8&iwloc=&output=embed';

export default function Location() {
  const { t } = useTranslation();
  const [location, setLocation] = useState(null);
  const [address, setAddress] = useState(fallbackCompany.address);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await cachedPublicGet(
          'akhada-location',
          async () => {
            const res = await attendanceSettingsService.getPublicLocation();
            return res.data?.data || null;
          },
          15_000
        );
        if (!cancelled) setLocation(data);
      } catch {
        if (!cancelled) setLocation(null);
      }
    };
    load();
    return onPublicCacheBust(() => load());
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const value = await cachedPublicGet('site-settings', async () => {
          const res = await siteSettingsService.getPublic();
          return res.data?.data?.siteSettings?.value || null;
        });
        if (cancelled || !value?.company?.address) return;
        const cmsAddress = String(value.company.address || '');
        if (/karawal\s*nagar|raghunandan/i.test(cmsAddress)) return;
        setAddress(cmsAddress);
      } catch {
        /* keep fallback */
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasCoords =
    location?.configured && Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude));
  const mapSrc = hasCoords
    ? `https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`
    : FALLBACK_MAP;
  const directionsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${location.latitude},${location.longitude}`
    : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

  return (
    <section id="location" className="relative overflow-hidden bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8B5E3C]">
              {t('location.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold tracking-tight text-[#1A120B]">
              {t('location.title')}
            </h2>
          </div>
        </Reveal>

        <div className="grid items-stretch gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <Reveal>
            <div className="flex h-full flex-col justify-center rounded-[20px] border border-[#E7E0D4] bg-[#F7F3EC] p-7 sm:p-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1A120B] text-[#C9A227]">
                <FaMapMarkerAlt />
              </div>
              <h3 className="mt-5 font-display text-xl font-bold text-[#1A120B]">{t('location.addressLabel')}</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-[#57534E]">{address}</p>
              <a
                href={directionsHref}
                target="_blank"
                rel="noreferrer"
                className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#1A120B] px-5 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#0C0A09]"
              >
                <FaDirections />
                {t('location.directions')}
              </a>
            </div>
          </Reveal>

          <Reveal delay={0.06}>
            <div className="overflow-hidden rounded-[20px] border border-[#E7E0D4] shadow-[0_12px_40px_rgba(26,18,11,0.06)]">
              <iframe
                title={t('location.mapTitle')}
                src={mapSrc}
                className="h-[320px] w-full sm:h-[380px]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
