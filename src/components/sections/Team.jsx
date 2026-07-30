import SectionHeading from '../ui/SectionHeading';
import { getIcon } from '../../utils/icons';

export default function Team({ team = [] }) {
  return (
    <section id="about" className="bg-surface py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Our Team"
          title="Our Expert Team"
          subtitle="Our experienced recovery professionals ensure secure, legal and timely asset recovery across India."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => {
            const Icon = getIcon(member.icon);
            return (
              <article
                key={member.role}
                className="rounded-2xl border border-slate-100 bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-light text-brand">
                  <Icon size={28} />
                </div>
                <h3 className="text-lg font-bold text-ink">{member.role}</h3>
                <p className="mt-1 text-sm font-semibold text-brand">{member.experience}</p>
                <p className="mt-3 text-sm text-muted">{member.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
