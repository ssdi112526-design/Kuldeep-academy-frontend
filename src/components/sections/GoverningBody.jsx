import Reveal, { SectionHeading } from '../ui/Reveal';
import { governingBodyMembers, societyInfo } from '../../data/society';
import useTranslation from '../../hooks/useTranslation';

const OFFICE_ORDER = ['President', 'Vice President', 'General Secretary', 'Joint Secretary', 'Treasurer'];

export default function GoverningBody() {
  const { t } = useTranslation();
  const officeBearers = governingBodyMembers.filter((m) => OFFICE_ORDER.includes(m.designation));
  const executives = governingBodyMembers.filter((m) => m.designation === 'Executive Member');

  return (
    <section id="governing-body" className="section bg-[#F8F7F2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            number="08"
            eyebrow={t('governingBody.eyebrow')}
            title={t('governingBody.title')}
            highlight={t('governingBody.highlight')}
            subtitle={t('governingBody.subtitle')}
          />
        </Reveal>

        <Reveal delay={0.06}>
          <div className="mx-auto mb-10 max-w-3xl border border-[#E9E7DE] bg-white px-5 py-5 text-center sm:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#D97706]">
              {societyInfo.documentTitle} · {societyInfo.filingYear}
            </p>
            <p className="mt-2 font-display text-lg font-bold text-[#071A2B] sm:text-xl">
              {societyInfo.name}
            </p>
            <p className="mt-2 text-sm text-[#64748B]">
              {t('governingBody.asOnLabel')}: {societyInfo.governingBodyAsOn}
            </p>
            <p className="mt-1 text-xs text-[#64748B] sm:text-sm">
              {t('governingBody.registrationLabel')}: {societyInfo.registrationNo} ·{' '}
              {societyInfo.registrationDate}
            </p>
          </div>
        </Reveal>

        {/* Desktop institutional table */}
        <Reveal delay={0.1}>
          <div className="hidden overflow-hidden border border-[#E9E7DE] bg-white md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="bg-[#0B3D2E] text-white">
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold tracking-wide">
                      {t('governingBody.cols.membershipNo')}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold tracking-wide">
                      {t('governingBody.cols.name')}
                    </th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold tracking-wide">
                      {t('governingBody.cols.designation')}
                    </th>
                    <th className="px-4 py-3.5 font-semibold tracking-wide">{t('governingBody.cols.address')}</th>
                    <th className="whitespace-nowrap px-4 py-3.5 font-semibold tracking-wide">
                      {t('governingBody.cols.appointed')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {governingBodyMembers.map((m, i) => (
                    <tr
                      key={m.membershipNo}
                      className={`border-t border-[#E9E7DE] ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8F7F2]/80'}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#D97706]">
                        {m.membershipNo}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-[#071A2B]">{m.name}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[#102033]">{m.designation}</td>
                      <td className="max-w-xs px-4 py-3.5 text-[#64748B]">{m.address}</td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[#64748B]">{m.appointmentDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        {/* Mobile: office bearers then executives */}
        <Reveal delay={0.1}>
          <div className="space-y-6 md:hidden">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D97706]">
                Office Bearers
              </p>
              <div className="grid gap-3">
                {officeBearers.map((m) => (
                  <article key={m.membershipNo} className="border border-[#E9E7DE] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#D97706]">
                      {t('governingBody.cols.membershipNo')} {m.membershipNo}
                    </p>
                    <h3 className="mt-1 break-words font-display text-base font-bold text-[#071A2B]">{m.name}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-[#172033]">{m.designation}</p>
                    <dl className="mt-3 space-y-2 border-t border-[#E9E7DE] pt-3 text-sm">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                          {t('governingBody.cols.address')}
                        </dt>
                        <dd className="mt-0.5 break-words text-[#172033]">{m.address}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                          {t('governingBody.cols.appointed')}
                        </dt>
                        <dd className="mt-0.5 text-[#172033]">{m.appointmentDate}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D97706]">
                Executive Members
              </p>
              <div className="grid gap-3">
                {executives.map((m) => (
                  <article key={m.membershipNo} className="border border-[#E9E7DE] bg-white p-4">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-[#D97706]">
                      {t('governingBody.cols.membershipNo')} {m.membershipNo}
                    </p>
                    <h3 className="mt-1 break-words font-display text-base font-bold text-[#071A2B]">{m.name}</h3>
                    <p className="mt-0.5 text-sm font-semibold text-[#172033]">{m.designation}</p>
                    <dl className="mt-3 space-y-2 border-t border-[#E9E7DE] pt-3 text-sm">
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                          {t('governingBody.cols.address')}
                        </dt>
                        <dd className="mt-0.5 break-words text-[#172033]">{m.address}</dd>
                      </div>
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                          {t('governingBody.cols.appointed')}
                        </dt>
                        <dd className="mt-0.5 text-[#172033]">{m.appointmentDate}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
