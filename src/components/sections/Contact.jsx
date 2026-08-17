import { useEffect, useMemo, useState } from 'react';
import {
  FaCheckCircle,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaFacebookF,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
} from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import Button from '../ui/Button';
import Reveal, { SectionHeading } from '../ui/Reveal';
import ValidationPopup from '../ui/ValidationPopup';
import { companyInfo as fallbackCompany, socialLinks as fallbackSocial } from '../../data/akhada';
import useTranslation from '../../hooks/useTranslation';
import { useToast } from '../../context/ToastContext';
import { attendanceSettingsService, contactService, siteSettingsService } from '../../services';
import { cachedPublicGet, onPublicCacheBust } from '../../utils/publicCache';

const socialIconMap = {
  FaFacebookF,
  FaXTwitter,
  FaLinkedinIn,
  FaInstagram,
  FaYoutube,
};

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  message: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[+\d][\d\s-]{7,18}$/;
const FALLBACK_MAP =
  'https://maps.google.com/maps?q=Bhatgaon%20Road%20Near%20Guru%20Sadan%20school%20Barwasni%20Sonipat%20Haryana&t=&z=15&ie=UTF8&iwloc=&output=embed';

const inputBase =
  'mt-1.5 w-full rounded-[12px] border bg-white px-4 py-3 text-[#102033] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20';
const inputOk = 'border-[#E9E7DE]';
const inputErr = 'border-red-400 focus:border-red-500';

export default function Contact() {
  const { t } = useTranslation();
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });
  const [location, setLocation] = useState(null);
  const [companyInfo, setCompanyInfo] = useState(fallbackCompany);
  const [socialLinks, setSocialLinks] = useState(fallbackSocial);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await cachedPublicGet(
          'akhada-location',
          async () => {
            const res = await attendanceSettingsService.getPublicLocation();
            return res.data?.data || null;
          },
          15_000
        );
        if (!cancelled) setLocation(data);
      } catch {
        if (!cancelled) setLocation(null);
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const value = await cachedPublicGet('site-settings', async () => {
          const res = await siteSettingsService.getPublic();
          return res.data?.data?.siteSettings?.value || null;
        });
        if (cancelled || !value) return;
        if (value.company) {
          const cmsName = String(value.company.name || '');
          const cmsAddress = String(value.company.address || '');
          const stale =
            /raghunandan/i.test(cmsName) ||
            /karawal\s*nagar/i.test(cmsAddress) ||
            /raghunandanakhada/i.test(String(value.company.email || ''));
          setCompanyInfo({
            name: stale ? fallbackCompany.name : value.company.name || fallbackCompany.name,
            address: stale ? fallbackCompany.address : value.company.address || fallbackCompany.address,
            phones:
              !stale && Array.isArray(value.company.phones) && value.company.phones.length
                ? value.company.phones
                : fallbackCompany.phones,
            email: stale ? fallbackCompany.email : value.company.email || fallbackCompany.email,
          });
        }
        if (Array.isArray(value.social) && value.social.length) {
          setSocialLinks(value.social);
        }
      } catch {
        /* keep fallbacks */
      }
    };
    load();
    const unsub = onPublicCacheBust(() => load());
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  const mapSrc = useMemo(() => {
    const lat = Number(location?.latitude);
    const lng = Number(location?.longitude);
    if (location?.configured && Number.isFinite(lat) && Number.isFinite(lng)) {
      return `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }
    return FALLBACK_MAP;
  }, [location]);
  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = () => {
    const errors = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const message = form.message.trim();

    if (!name) errors.name = t('contact.errors.nameRequired');
    else if (name.length < 2) errors.name = t('contact.errors.nameShort');

    if (!phone) errors.phone = t('contact.errors.phoneRequired');
    else if (!PHONE_REGEX.test(phone)) errors.phone = t('contact.errors.phoneInvalid');

    if (!email) errors.email = t('contact.errors.emailRequired');
    else if (!EMAIL_REGEX.test(email)) errors.email = t('contact.errors.emailInvalid');

    if (!message) errors.message = t('contact.errors.messageRequired');
    else if (message.length < 5) errors.message = t('contact.errors.messageShort');

    return errors;
  };

  const showValidationAlert = (errors) => {
    const order = ['name', 'phone', 'email', 'message'];
    const firstKey = order.find((key) => errors[key]);
    const message = firstKey ? errors[firstKey] : t('contact.errors.generic');
    setValidationPopup({
      open: true,
      title: t('contact.errors.title'),
      message,
    });
    toast.error(message);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      showValidationAlert(errors);
      const firstId = Object.keys(errors)[0];
      document.getElementById(`contact-${firstId}`)?.focus();
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
      setForm(EMPTY);
      setFieldErrors({});
      setShowSuccess(true);
      toast.success(t('contact.sent'));
    } catch (err) {
      const apiErrors = err?.response?.data?.errors;
      const msg =
        (Array.isArray(apiErrors) && apiErrors[0]) ||
        err?.response?.data?.message ||
        t('contact.errors.submitFailed');
      const text = typeof msg === 'string' ? msg : t('contact.errors.submitFailed');
      setValidationPopup({
        open: true,
        title: t('contact.errors.title'),
        message: text,
      });
      toast.error(text);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (key) => `${inputBase} ${fieldErrors[key] ? inputErr : inputOk}`;

  return (
    <section id="contact" className="section bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow={t('contact.eyebrow')}
            title={t('contact.title')}
            highlight={t('contact.highlight')}
            subtitle={t('contact.subtitle')}
          />
        </Reveal>

        <div className="grid gap-5 lg:grid-cols-2">
          <Reveal>
            <form onSubmit={onSubmit} className="card p-6 md:p-8" noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-[#374151]">
                  {t('contact.name')}
                  <input
                    id="contact-name"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={fieldClass('name')}
                    placeholder={t('contact.namePlaceholder')}
                  />
                  {fieldErrors.name ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.name}</span>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-[#374151]">
                  {t('contact.phone')}
                  <input
                    id="contact-phone"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    className={fieldClass('phone')}
                    placeholder={t('contact.phonePlaceholder')}
                  />
                  {fieldErrors.phone ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.phone}</span>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-[#374151] sm:col-span-2">
                  {t('contact.email')}
                  <input
                    id="contact-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={fieldClass('email')}
                    placeholder={t('contact.emailPlaceholder')}
                  />
                  {fieldErrors.email ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.email}</span>
                  ) : null}
                </label>

                <label className="block text-sm font-medium text-[#374151] sm:col-span-2">
                  {t('contact.message')}
                  <textarea
                    id="contact-message"
                    rows={4}
                    value={form.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    className={`${fieldClass('message')} resize-none`}
                    placeholder={t('contact.messagePlaceholder')}
                  />
                  {fieldErrors.message ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.message}</span>
                  ) : null}
                </label>
              </div>

              <Button type="submit" disabled={loading} className="mt-5 w-full sm:w-auto">
                {loading ? '...' : t('contact.send')}
              </Button>
            </form>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="flex h-full flex-col gap-5">
              <div className="card p-6">
                <ul className="space-y-4 text-sm text-[#64748B]">
                  <li className="flex gap-3">
                    <FaMapMarkerAlt className="mt-1 shrink-0 text-[#D97706]" />
                    <span>{companyInfo.address}</span>
                  </li>
                  {(companyInfo.phones || []).map((phone) => (
                    <li key={phone} className="flex items-center gap-3">
                      <FaPhoneAlt className="shrink-0 text-[#D97706]" />
                      <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-[#172033]">
                        {phone}
                      </a>
                    </li>
                  ))}
                  {companyInfo.email ? (
                    <li className="flex items-center gap-3">
                      <FaEnvelope className="shrink-0 text-[#D97706]" />
                      <a href={`mailto:${companyInfo.email}`} className="hover:text-[#172033]">
                        {companyInfo.email}
                      </a>
                    </li>
                  ) : null}
                </ul>
                <div className="mt-5 flex gap-2">
                  {socialLinks.map((social) => {
                    const Icon = socialIconMap[social.icon];
                    if (!Icon) return null;
                    return (
                      <a
                        key={social.label || social.href}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E9E7DE] bg-white text-[#64748B] transition hover:border-[#0B3D2E]/40 hover:text-[#0B3D2E]"
                      >
                        <Icon size={14} />
                      </a>
                    );
                  })}
                </div>
              </div>
              <div className="min-h-[240px] flex-1 overflow-hidden rounded-md border border-[#E9E7DE] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <iframe
                  title={t('contact.mapTitle')}
                  src={mapSrc}
                  className="h-full min-h-[240px] w-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      <ValidationPopup
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        onClose={() => setValidationPopup({ open: false, title: '', message: '' })}
      />

      {showSuccess ? (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#172033]/55 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-success-title"
          onClick={() => setShowSuccess(false)}
        >
          <div
            className="w-full max-w-md rounded-md bg-white p-8 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-500">
              <FaCheckCircle size={36} />
            </div>
            <h3 id="contact-success-title" className="mt-5 font-display text-xl font-bold text-[#172033]">
              {t('contact.successTitle')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{t('contact.successBody')}</p>
            <Button type="button" className="mt-6 w-full sm:w-auto" onClick={() => setShowSuccess(false)}>
              {t('contact.successClose')}
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
