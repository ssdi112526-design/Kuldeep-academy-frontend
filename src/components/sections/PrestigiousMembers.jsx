import Reveal from '../ui/Reveal';
import { prestigiousMembers } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function PrestigiousMembers() {
  const { t } = useTranslation();

  return (
    <section id="prestigious-members" className="relative overflow-hidden bg-[#0C0A09] py-20 text-white sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#C9A227]">
              {t('members.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold tracking-tight">
              {t('members.title')}
            </h2>
            <p className="mt-4 text-[15px] leading-relaxed text-[#A8A29E]">{t('members.subtitle')}</p>
          </div>
        </Reveal>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
          {prestigiousMembers.map((member, index) => (
            <Reveal key={member.key} delay={index * 0.08}>
              <article className="group overflow-hidden rounded-[18px] border border-white/10 bg-[#1C1917]">
                <div className="relative aspect-[16/11] overflow-hidden">
                  <img
                    src={member.image}
                    alt={t(`members.items.${member.key}.name`)}
                    loading="lazy"
                    className={`h-full w-full object-cover transition duration-500 group-hover:scale-[1.03] ${member.objectPosition || 'object-center'}`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0C0A09] via-[#0C0A09]/20 to-transparent" />
                </div>
                <div className="px-6 py-6 sm:px-8 sm:py-7">
                  <h3 className="font-display text-2xl font-extrabold tracking-tight">
                    {t(`members.items.${member.key}.name`)}
                  </h3>
                  <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-[#C9A227]">
                    {t(`members.items.${member.key}.role`)}
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-[#A8A29E]">
                    {t(`members.items.${member.key}.bio`)}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
