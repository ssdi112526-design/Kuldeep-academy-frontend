import { FaArrowRight } from 'react-icons/fa';
import SectionHeading from '../ui/SectionHeading';
import { getIcon } from '../../utils/icons';

export default function Services({ services = [] }) {
  return (
    <section id="features" className="bg-surface py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What We Do"
          title="Our Services"
          subtitle="Professional, compliant, and efficient asset recovery and management solutions"
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = getIcon(service.icon);
            return (
              <article
                key={service.title}
                className="group flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(37,99,235,0.12)]"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand">
                  <Icon size={22} />
                </div>
                <h3 className="text-lg font-bold text-ink">{service.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{service.description}</p>
                <a
                  href="#contact"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-brand group-hover:gap-3"
                >
                  Learn More <FaArrowRight size={12} />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
