import { useState } from 'react';
import Reveal from '../ui/Reveal';
import ValidationPopup from '../ui/ValidationPopup';
import useTranslation from '../../hooks/useTranslation';
import { useToast } from '../../context/ToastContext';
import { contactService } from '../../services';

const EMPTY = { name: '', email: '', phone: '', message: '' };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,18}$/;

const inputClass =
  'mt-1.5 w-full rounded-xl border border-[#E7E0D4] bg-white px-4 py-3 text-[#1A120B] outline-none transition placeholder:text-[#A8A29E] focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20';

export default function Inquire() {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (!form.name.trim()) return t('inquire.errors.name');
    if (!PHONE_REGEX.test(form.phone.trim())) return t('inquire.errors.phone');
    if (!EMAIL_REGEX.test(form.email.trim())) return t('inquire.errors.email');
    if (!form.message.trim() || form.message.trim().length < 8) return t('inquire.errors.message');
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setValidationPopup({ open: true, title: t('inquire.validationTitle'), message: err });
      return;
    }
    setLoading(true);
    try {
      await contactService.create({
        fullName: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        serviceRequired: 'General Inquiry',
        message: form.message.trim(),
      });
      toast.success(t('inquire.success'));
      setForm(EMPTY);
    } catch {
      toast.error(t('inquire.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="inquire" className="relative overflow-hidden bg-[#F7F3EC] py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8B5E3C]">
              {t('inquire.eyebrow')}
            </p>
            <h2 className="mt-3 font-display text-[clamp(1.85rem,4vw,2.75rem)] font-extrabold tracking-tight text-[#1A120B]">
              {t('inquire.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#57534E]">
              {t('inquire.subtitle')}
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.06}>
          <form
            onSubmit={onSubmit}
            className="rounded-[20px] border border-[#E7E0D4] bg-white p-6 shadow-[0_12px_40px_rgba(26,18,11,0.06)] sm:p-8"
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-[#1A120B]">
                {t('inquire.name')}
                <input
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  className={inputClass}
                  placeholder={t('inquire.namePlaceholder')}
                  autoComplete="name"
                />
              </label>
              <label className="block text-sm font-semibold text-[#1A120B]">
                {t('inquire.phone')}
                <input
                  name="phone"
                  value={form.phone}
                  onChange={onChange}
                  className={inputClass}
                  placeholder={t('inquire.phonePlaceholder')}
                  autoComplete="tel"
                />
              </label>
            </div>
            <label className="mt-5 block text-sm font-semibold text-[#1A120B]">
              {t('inquire.email')}
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={onChange}
                className={inputClass}
                placeholder={t('inquire.emailPlaceholder')}
                autoComplete="email"
              />
            </label>
            <label className="mt-5 block text-sm font-semibold text-[#1A120B]">
              {t('inquire.message')}
              <textarea
                name="message"
                rows={5}
                value={form.message}
                onChange={onChange}
                className={inputClass}
                placeholder={t('inquire.messagePlaceholder')}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-[#1A120B] text-[13px] font-bold uppercase tracking-[0.08em] text-white transition hover:bg-[#0C0A09] disabled:opacity-60 sm:w-auto sm:px-10"
            >
              {loading ? t('inquire.sending') : t('inquire.submit')}
            </button>
          </form>
        </Reveal>
      </div>

      <ValidationPopup
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        onClose={() => setValidationPopup({ open: false, title: '', message: '' })}
      />
    </section>
  );
}
