import { useEffect, useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import Reveal, { SectionHeading } from '../ui/Reveal';
import useTranslation from '../../hooks/useTranslation';
import { membershipService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

function parseBenefits(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    /* plain text */
  }
  return String(raw)
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Membership() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    const load = async ({ silent = false } = {}) => {
      if (!silent) setLoading(true);
      setError('');
      try {
        const list = await cachedPublicGet('membership-plans', async () => {
          const res = await membershipService.listPublic();
          return res.data.data.membershipPlans || [];
        });
        if (alive) setPlans(list);
      } catch {
        if (alive) setError('Unable to load membership plans right now.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load({ silent: true }));
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  return (
    <section id="membership" className="section bg-[#F8F7F2]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('membership.eyebrow')}
            title={t('membership.title')}
            highlight={t('membership.highlight')}
            subtitle={t('membership.subtitle')}
          />
        </Reveal>

        {loading ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[320px] animate-pulse rounded-md bg-slate-200/70" />
            ))}
          </div>
        ) : error ? (
          <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : plans.length === 0 ? (
          <p className="text-center text-sm text-[#64748B]">Membership plans will appear here soon.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const benefits = parseBenefits(plan.benefits);
              return (
                <Reveal key={plan._id || plan.id} delay={i * 0.06}>
                  <article className="card flex h-full flex-col overflow-hidden p-0">
                    {plan.image ? (
                      <div className="overflow-hidden">
                        <img
                          src={mediaUrl(plan.image)}
                          alt={plan.name}
                          width={640}
                          height={360}
                          className="h-40 w-full object-cover"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg font-semibold text-[#172033]">{plan.name}</h3>
                      {plan.priceLabel ? (
                        <p className="mt-1 text-base font-semibold text-[#071A2B]">{plan.priceLabel}</p>
                      ) : null}
                      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{plan.description}</p>
                      {benefits.length ? (
                        <ul className="mt-4 space-y-2">
                          {benefits.map((benefit) => (
                            <li key={benefit} className="flex items-start gap-2 text-sm text-[#374151]">
                              <FaCheck className="mt-0.5 shrink-0 text-[#071A2B]" size={12} />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
