import { useEffect, useState } from 'react';
import Reveal from '../ui/Reveal';
import { aboutPillars, images } from '../../data/akhada';
import { societyInfo } from '../../data/society';
import useTranslation from '../../hooks/useTranslation';
import { siteSettingsService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

export default function About() {
  const { t, language } = useTranslation();
  const [about, setAbout] = useState(null);
  const sidePillars = aboutPillars.filter((item) => item.key !== 'discipline');
  const disciplineQuotes = t('about.disciplineQuotes') || [];
  const isHi = language === 'hi';
  const aboutImage = about?.image ? mediaUrl(about.image) : images.about;
  const title = (isHi ? about?.titleHi : about?.titleEn) || t('about.title');
  const highlight = (isHi ? about?.highlightHi : about?.highlightEn) || t('about.highlight');
  const subtitle = (isHi ? about?.subtitleHi : about?.subtitleEn) || t('about.subtitle');
  const featureQuote = Array.isArray(disciplineQuotes) && disciplineQuotes.length ? disciplineQuotes[0] : '';
  const restQuotes = Array.isArray(disciplineQuotes) ? disciplineQuotes.slice(1) : [];

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const value = await cachedPublicGet('site-settings', async () => {
          const res = await siteSettingsService.getPublic();
          return res.data?.data?.siteSettings?.value || null;
        });
        if (alive && value?.about) {
          const aboutValue = { ...value.about };
          const stale =
            /raghunandan/i.test(String(aboutValue.subtitleEn || '')) ||
            /रघुनांदन|रघुनंदन/i.test(String(aboutValue.subtitleHi || ''));
          if (stale) {
            delete aboutValue.subtitleEn;
            delete aboutValue.subtitleHi;
          }
          setAbout(aboutValue);
        }
      } catch {
        /* keep defaults */
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return (
    <section id="about" className="section bg-[#F8F7F2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
          <Reveal className="lg:col-span-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D97706]">02 · {t('about.eyebrow')}</p>
            <h2 className="mt-3 font-display text-[clamp(2.2rem,4.5vw,3.6rem)] font-extrabold leading-[1.08] tracking-tight text-[#071A2B]">
              {title} <span className="text-[#D97706]">{highlight}</span>
            </h2>
            <div className="accent-rule mt-5" aria-hidden />
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-[#64748B] md:text-base">{subtitle}</p>
            <p
              className="mt-6 border-l-2 border-[#D97706] pl-4 font-display text-sm font-semibold leading-relaxed text-[#0B3D2E]"
              lang="sa"
              aria-label={t('about.mantraLabel')}
            >
              ॥ {t('about.mantra')} ॥
            </p>
          </Reveal>

          <Reveal delay={0.08} className="lg:col-span-7">
            <img
              src={aboutImage}
              alt={t('about.imageAlt')}
              width={960}
              height={720}
              loading="lazy"
              decoding="async"
              className="h-full min-h-[280px] w-full rounded-[14px] object-cover object-[center_18%] shadow-[0_18px_40px_rgba(7,26,43,0.12)] sm:min-h-[360px]"
            />
          </Reveal>
        </div>

        {/* Institutional strip */}
        <Reveal delay={0.06}>
          <div className="mt-10 grid gap-4 border border-[#E9E7DE] bg-white p-5 sm:grid-cols-2 lg:grid-cols-4 lg:p-6">
            {[
              { label: t('about.registration.society'), value: societyInfo.name },
              { label: t('about.registration.regNo'), value: societyInfo.registrationNo },
              { label: t('about.registration.regDate'), value: societyInfo.registrationDate },
              { label: t('about.registration.office'), value: societyInfo.registeredOffice },
            ].map((row) => (
              <div key={row.label} className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#D97706]">{row.label}</p>
                <p className="mt-1.5 break-words text-sm font-semibold leading-snug text-[#071A2B]">{row.value}</p>
              </div>
            ))}
          </div>
        </Reveal>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {sidePillars.map((item, i) => (
            <Reveal key={item.key} delay={i * 0.05}>
              <article className="border border-[#E9E7DE] bg-white p-5 transition hover:border-[#D97706]/35">
                <p className="text-[11px] font-bold tracking-[0.18em] text-[#D97706]">0{i + 1}</p>
                <h3 className="mt-2 font-display text-lg font-bold text-[#071A2B]">
                  {t(`about.pillars.${item.key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                  {t(`about.pillars.${item.key}.text`)}
                </p>
              </article>
            </Reveal>
          ))}
        </div>

        {/* Discipline — editorial asymmetric */}
        <Reveal delay={0.08}>
          <div className="mt-12 border border-[#E9E7DE] bg-[#071A2B] p-6 text-white sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#D97706]">
                  {t('about.pillars.discipline.title')}
                </p>
                <h3 className="mt-3 font-display text-[clamp(1.8rem,3.5vw,2.75rem)] font-extrabold leading-tight">
                  {t('about.disciplineQuotesTitle')}
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/65">
                  {t('about.pillars.discipline.text')}
                </p>
                {featureQuote ? (
                  <blockquote className="mt-8 border-l-2 border-[#D97706] pl-4">
                    <p className="font-display text-lg font-semibold leading-snug text-white sm:text-xl">
                      “{featureQuote}”
                    </p>
                    <p className="mt-3 text-[11px] font-bold tracking-[0.18em] text-[#C99A2E]">01</p>
                  </blockquote>
                ) : null}
              </div>
              <ul className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
                {restQuotes.map((quote, i) => (
                  <li
                    key={i}
                    className="border border-white/10 bg-white/[0.03] p-4 transition hover:border-[#D97706]/40"
                  >
                    <p className="text-[11px] font-bold tracking-[0.16em] text-[#D97706]">
                      {String(i + 2).padStart(2, '0')}
                    </p>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/80 sm:text-sm">{quote}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
