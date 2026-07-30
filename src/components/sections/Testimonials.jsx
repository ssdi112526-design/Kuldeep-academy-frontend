import { useEffect, useState } from 'react';
import { FaQuoteLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Reveal, { SectionHeading } from '../ui/Reveal';
import { testimonials } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';

export default function Testimonials() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % testimonials.length), 5500);
    return () => clearInterval(id);
  }, []);

  const item = testimonials[index];

  return (
    <section id="testimonials" className="section bg-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('testimonials.eyebrow')}
            title={t('testimonials.title')}
            highlight={t('testimonials.highlight')}
            subtitle={t('testimonials.subtitle')}
          />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="card relative p-8 md:p-10">
            <FaQuoteLeft className="text-2xl text-[#F59E0B]/70" />
            <p className="mt-5 font-display text-xl leading-relaxed text-[#111827] md:text-2xl">
              {t(`testimonials.items.${item.key}.quote`)}
            </p>
            <div className="mt-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EFF6FF] font-display text-lg font-bold text-[#2563EB]">
                  {item.initial}
                </div>
                <div>
                  <p className="font-semibold text-[#111827]">
                    {t(`testimonials.items.${item.key}.name`)}
                  </p>
                  <p className="text-sm text-[#6B7280]">
                    {t(`testimonials.items.${item.key}.role`)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  aria-label={t('testimonials.prev')}
                  className="rounded-full border border-[#E5E7EB] bg-white p-2.5 text-[#111827] hover:bg-[#F8FAFC]"
                  onClick={() => setIndex((i) => (i - 1 + testimonials.length) % testimonials.length)}
                >
                  <FaChevronLeft size={12} />
                </button>
                <button
                  type="button"
                  aria-label={t('testimonials.next')}
                  className="rounded-full border border-[#E5E7EB] bg-white p-2.5 text-[#111827] hover:bg-[#F8FAFC]"
                  onClick={() => setIndex((i) => (i + 1) % testimonials.length)}
                >
                  <FaChevronRight size={12} />
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
