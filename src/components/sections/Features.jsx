import {
  FaUsers,
  FaIdCard,
  FaClipboardCheck,
  FaDumbbell,
  FaChartLine,
  FaTrophy,
  FaChalkboardTeacher,
  FaCreditCard,
} from 'react-icons/fa';
import Reveal, { SectionHeading } from '../ui/Reveal';
import { features } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

const icons = [
  FaUsers,
  FaIdCard,
  FaClipboardCheck,
  FaDumbbell,
  FaChartLine,
  FaTrophy,
  FaChalkboardTeacher,
  FaCreditCard,
];

export default function Features() {
  const { t } = useTranslation();

  return (
    <section id="features" className="section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('features.eyebrow')}
            title={t('features.title')}
            highlight={t('features.highlight')}
            subtitle={t('features.subtitle')}
          />
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={item.key} delay={(i % 4) * 0.04}>
                <article className="card flex h-full flex-col p-5">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                    <Icon size={16} />
                  </div>
                  <h3 className="font-display text-[15px] font-semibold text-[#111827]">
                    {t(`features.items.${item.key}.title`)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                    {t(`features.items.${item.key}.text`)}
                  </p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
