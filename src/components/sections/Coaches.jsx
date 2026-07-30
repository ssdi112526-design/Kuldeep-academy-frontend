import { FaInstagram, FaYoutube } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Reveal from '../ui/Reveal';
import useTranslation from '../../hooks/useTranslation';
import { championCoaches } from '../../data/akhada';

export default function Coaches() {
  const { t } = useTranslation();

  return (
    <section
      id="coaches"
      className="relative overflow-hidden section bg-gradient-to-b from-[#FBF8F1] via-[#FFFcf7] to-white"
    >
      {/* Soft traditional texture / decorative glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, #D4AF37 0.8px, transparent 0.9px), radial-gradient(circle at 80% 60%, #8B5E3C 0.7px, transparent 0.8px)',
          backgroundSize: '28px 28px, 36px 36px',
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#D4AF37]/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-[#8B5E3C]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-white/80 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B8860B] shadow-[0_4px_14px_rgba(212,175,55,0.12)] backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
              {t('coaches.badge')}
            </span>
            <h2 className="mt-4 font-display text-[clamp(1.85rem,3.8vw,2.75rem)] font-bold leading-tight tracking-tight text-[#1A120B]">
              {t('coaches.titleLine1')}{' '}
              <span className="bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#8B5E3C] bg-clip-text text-transparent">
                {t('coaches.titleLine2')}
              </span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-[#6B5E52] md:text-base">
              {t('coaches.subtitle')}
            </p>
          </div>
        </Reveal>

        <div className="grid grid-cols-1 gap-x-6 gap-y-16 sm:grid-cols-2 xl:grid-cols-4">
          {championCoaches.map((coach, index) => (
            <Reveal key={coach.key} delay={index * 0.08}>
              <article className="group relative pt-16">
                {/* Overlapping circular portrait */}
                <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2">
                  <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-[#F5E6A6] via-[#D4AF37] to-[#8B5E3C] opacity-90 shadow-[0_0_28px_rgba(212,175,55,0.35)] transition duration-[400ms] group-hover:shadow-[0_0_36px_rgba(212,175,55,0.55)]" />
                    <div className="relative h-[150px] w-[150px] overflow-hidden rounded-full border-[3px] border-white bg-[#FBF8F1] shadow-[0_12px_28px_rgba(26,18,11,0.18)] md:h-[180px] md:w-[180px]">
                      <img
                        src={coach.image}
                        alt={t(`coaches.items.${coach.key}.name`)}
                        className="h-full w-full object-cover object-top transition duration-[400ms] ease-out group-hover:scale-110"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                {/* Glass card */}
                <div className="relative overflow-hidden rounded-[28px] border border-white/70 bg-white/55 px-5 pb-6 pt-[100px] shadow-[0_14px_40px_rgba(26,18,11,0.08)] backdrop-blur-xl transition duration-[400ms] ease-out group-hover:-translate-y-2 group-hover:border-[#D4AF37]/40 group-hover:shadow-[0_22px_50px_rgba(212,175,55,0.22)] md:pt-[110px]">
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#D4AF37]/10 to-transparent opacity-0 transition duration-[400ms] group-hover:opacity-100"
                    aria-hidden
                  />

                  <div className="relative text-center">
                    <h3 className="font-display text-lg font-bold tracking-tight text-[#1A120B]">
                      {t(`coaches.items.${coach.key}.name`)}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-[#B8860B]">
                      {t(`coaches.items.${coach.key}.role`)}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                      <span className="rounded-full border border-[#D4AF37]/30 bg-[#FFF9E8] px-3 py-1 text-[11px] font-semibold text-[#8B5E3C]">
                        {t(`coaches.items.${coach.key}.experience`)}
                      </span>
                      <span className="rounded-full border border-[#E8DFD0] bg-white/80 px-3 py-1 text-[11px] font-semibold text-[#5C4A3A]">
                        {t(`coaches.items.${coach.key}.specialty`)}
                      </span>
                    </div>

                    <p className="mt-4 text-[13px] leading-relaxed text-[#6B5E52]">
                      {t(`coaches.items.${coach.key}.bio`)}
                    </p>

                    <div className="mt-5 flex items-center justify-center gap-2">
                      {[FaInstagram, FaYoutube, FaXTwitter].map((Icon, i) => (
                        <span
                          key={i}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E8DFD0] bg-white/70 text-[#8B5E3C] transition duration-[400ms] hover:border-[#D4AF37] hover:text-[#B8860B]"
                          aria-hidden
                        >
                          <Icon size={13} />
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
