import { FaMapMarkerAlt } from 'react-icons/fa';
import SectionHeading from '../ui/SectionHeading';

export default function Coverage({ coverage = [] }) {
  return (
    <section id="pricing" className="bg-surface py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Active Coverage Areas"
          title="Pan-India Recovery Network"
          subtitle="States and districts where our recovery teams are currently deployed across India"
        />

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {coverage.map((area) => (
            <article
              key={`${area.state}-${area.city}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
            >
              <div className="flex min-w-0 items-start gap-2.5">
                <FaMapMarkerAlt className="mt-1 shrink-0 text-brand" size={14} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-bold text-ink">{area.state}</h3>
                    {area.isHQ && (
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-brand">
                        HQ
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted">{area.city}</p>
                </div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  area.status === 'Growing'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                {area.status}
              </span>
            </article>
          ))}

          <article className="flex items-center justify-center rounded-xl border border-dashed border-brand/40 bg-brand-light px-4 py-3">
            <div className="text-center">
              <p className="text-sm font-bold text-brand">& More…</p>
              <p className="text-xs font-medium text-brand/80">Pan India</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
