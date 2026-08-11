import { useCallback, useEffect, useState } from 'react';
import { FaGlobe, FaPlus, FaSave, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import ImageUploader from './ImageUploader';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { siteSettingsService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearPublicCache } from '../../utils/publicCache';

const EMPTY_SOCIAL = { label: '', href: '', icon: 'FaFacebookF' };

const EMPTY_FORM = {
  company: { name: '', address: '', phones: '', email: '' },
  social: [{ ...EMPTY_SOCIAL }],
  hero: {
    badgeEn: '',
    badgeHi: '',
    titleEn: '',
    titleHi: '',
    subtitleEn: '',
    subtitleHi: '',
    ctaPrimaryEn: '',
    ctaPrimaryHi: '',
    ctaSecondaryEn: '',
    ctaSecondaryHi: '',
    image: null,
  },
  about: {
    eyebrowEn: '',
    eyebrowHi: '',
    titleEn: '',
    titleHi: '',
    highlightEn: '',
    highlightHi: '',
    subtitleEn: '',
    subtitleHi: '',
    image: null,
  },
};

export default function WebsiteContentPanel({ onChanged }) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('website_content');
  const canEdit = can('website_content.edit');
  const canUpload = can('website_content.upload');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [heroFile, setHeroFile] = useState(null);
  const [aboutFile, setAboutFile] = useState(null);
  const [heroPreview, setHeroPreview] = useState('');
  const [aboutPreview, setAboutPreview] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await siteSettingsService.getAdmin();
      const value = res.data?.data?.siteSettings?.value || {};
      const company = value.company || {};
      const phones = Array.isArray(company.phones) ? company.phones.join(', ') : company.phones || '';
      setForm({
        company: {
          name: company.name || '',
          address: company.address || '',
          phones,
          email: company.email || '',
        },
        social: Array.isArray(value.social) && value.social.length
          ? value.social.map((s) => ({
              label: s.label || '',
              href: s.href || '',
              icon: s.icon || 'FaFacebookF',
            }))
          : [{ ...EMPTY_SOCIAL }],
        hero: { ...EMPTY_FORM.hero, ...(value.hero || {}) },
        about: { ...EMPTY_FORM.about, ...(value.about || {}) },
      });
      setHeroFile(null);
      setAboutFile(null);
      setHeroPreview(value.hero?.image ? mediaUrl(value.hero.image) : '');
      setAboutPreview(value.about?.image ? mediaUrl(value.about.image) : '');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load website content'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  if (!canView) return <AccessDenied />;

  const updateCompany = (key, value) => {
    setForm((prev) => ({ ...prev, company: { ...prev.company, [key]: value } }));
  };

  const updateHero = (key, value) => {
    setForm((prev) => ({ ...prev, hero: { ...prev.hero, [key]: value } }));
  };

  const updateAbout = (key, value) => {
    setForm((prev) => ({ ...prev, about: { ...prev.about, [key]: value } }));
  };

  const updateSocial = (index, key, value) => {
    setForm((prev) => {
      const social = prev.social.map((row, i) => (i === index ? { ...row, [key]: value } : row));
      return { ...prev, social };
    });
  };

  const addSocial = () => {
    setForm((prev) => ({ ...prev, social: [...prev.social, { ...EMPTY_SOCIAL }] }));
  };

  const removeSocial = (index) => {
    setForm((prev) => ({
      ...prev,
      social: prev.social.length <= 1 ? [{ ...EMPTY_SOCIAL }] : prev.social.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('You do not have permission to edit website content');
      return;
    }
    if ((heroFile || aboutFile) && !canUpload) {
      toast.error('You do not have permission to upload images');
      return;
    }
    if (!form.company.name.trim() || !form.company.email.trim()) {
      const message = 'Company name and email are required';
      setFormError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      const phones = form.company.phones
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload = {
        company: {
          name: form.company.name.trim(),
          address: form.company.address.trim(),
          phones,
          email: form.company.email.trim(),
        },
        social: form.social
          .filter((s) => s.label.trim() || s.href.trim())
          .map((s) => ({
            label: s.label.trim(),
            href: s.href.trim(),
            icon: s.icon.trim() || 'FaFacebookF',
          })),
        hero: {
          badgeEn: form.hero.badgeEn?.trim() || '',
          badgeHi: form.hero.badgeHi?.trim() || '',
          titleEn: form.hero.titleEn?.trim() || '',
          titleHi: form.hero.titleHi?.trim() || '',
          subtitleEn: form.hero.subtitleEn?.trim() || '',
          subtitleHi: form.hero.subtitleHi?.trim() || '',
          ctaPrimaryEn: form.hero.ctaPrimaryEn?.trim() || '',
          ctaPrimaryHi: form.hero.ctaPrimaryHi?.trim() || '',
          ctaSecondaryEn: form.hero.ctaSecondaryEn?.trim() || '',
          ctaSecondaryHi: form.hero.ctaSecondaryHi?.trim() || '',
        },
        about: {
          eyebrowEn: form.about.eyebrowEn?.trim() || '',
          eyebrowHi: form.about.eyebrowHi?.trim() || '',
          titleEn: form.about.titleEn?.trim() || '',
          titleHi: form.about.titleHi?.trim() || '',
          highlightEn: form.about.highlightEn?.trim() || '',
          highlightHi: form.about.highlightHi?.trim() || '',
          subtitleEn: form.about.subtitleEn?.trim() || '',
          subtitleHi: form.about.subtitleHi?.trim() || '',
        },
      };

      await siteSettingsService.update(payload, {
        heroImage: heroFile || undefined,
        aboutImage: aboutFile || undefined,
      });
      clearPublicCache('site-settings');
      toast.success('Website content saved');
      await load();
      onChanged?.();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Save failed');
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand disabled:bg-slate-50';

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <FaGlobe className="text-brand" />
        <p className="text-sm text-muted">
          Edit company details, social links, hero and about copy used on the public website.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <FormErrorBanner message={formError} />

          <section className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-bold text-ink">Company</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink">
                Name
                <input
                  disabled={!canEdit}
                  value={form.company.name}
                  onChange={(e) => updateCompany('name', e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Email
                <input
                  type="email"
                  disabled={!canEdit}
                  value={form.company.email}
                  onChange={(e) => updateCompany('email', e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Address
                <textarea
                  rows={2}
                  disabled={!canEdit}
                  value={form.company.address}
                  onChange={(e) => updateCompany('address', e.target.value)}
                  className={fieldClass}
                />
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Phones (comma-separated)
                <input
                  disabled={!canEdit}
                  value={form.company.phones}
                  onChange={(e) => updateCompany('phones', e.target.value)}
                  className={fieldClass}
                  placeholder="Leave blank if not published"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-ink">Social Links</h3>
              {canEdit ? (
                <Button type="button" variant="secondary" onClick={addSocial} className="rounded-lg px-3 py-2 text-xs">
                  <FaPlus /> Add
                </Button>
              ) : null}
            </div>
            <div className="mt-4 space-y-3">
              {form.social.map((row, index) => (
                <div key={index} className="grid gap-2 rounded-lg border border-slate-100 p-3 sm:grid-cols-7">
                  <label className="block text-xs font-medium text-ink sm:col-span-2">
                    Label
                    <input
                      disabled={!canEdit}
                      value={row.label}
                      onChange={(e) => updateSocial(index, 'label', e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink sm:col-span-3">
                    URL
                    <input
                      disabled={!canEdit}
                      value={row.href}
                      onChange={(e) => updateSocial(index, 'href', e.target.value)}
                      className={fieldClass}
                    />
                  </label>
                  <label className="block text-xs font-medium text-ink sm:col-span-1">
                    Icon
                    <input
                      disabled={!canEdit}
                      value={row.icon}
                      onChange={(e) => updateSocial(index, 'icon', e.target.value)}
                      className={fieldClass}
                      placeholder="FaInstagram"
                    />
                  </label>
                  {canEdit ? (
                    <div className="flex items-end sm:col-span-1">
                      <button
                        type="button"
                        onClick={() => removeSocial(index)}
                        className="rounded-lg p-2.5 text-red-500 hover:bg-red-50"
                        aria-label="Remove social link"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-bold text-ink">Hero</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['badgeEn', 'Badge (EN)'],
                ['badgeHi', 'Badge (HI)'],
                ['titleEn', 'Title (EN)'],
                ['titleHi', 'Title (HI)'],
                ['subtitleEn', 'Subtitle (EN)'],
                ['subtitleHi', 'Subtitle (HI)'],
                ['ctaPrimaryEn', 'Primary CTA (EN)'],
                ['ctaPrimaryHi', 'Primary CTA (HI)'],
                ['ctaSecondaryEn', 'Secondary CTA (EN)'],
                ['ctaSecondaryHi', 'Secondary CTA (HI)'],
              ].map(([key, label]) => (
                <label key={key} className="block text-sm font-medium text-ink">
                  {label}
                  {key.startsWith('subtitle') ? (
                    <textarea
                      rows={2}
                      disabled={!canEdit}
                      value={form.hero[key] || ''}
                      onChange={(e) => updateHero(key, e.target.value)}
                      className={fieldClass}
                    />
                  ) : (
                    <input
                      disabled={!canEdit}
                      value={form.hero[key] || ''}
                      onChange={(e) => updateHero(key, e.target.value)}
                      className={fieldClass}
                    />
                  )}
                </label>
              ))}
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-ink">Hero Image</p>
                <ImageUploader
                  previewUrl={heroFile ? URL.createObjectURL(heroFile) : heroPreview}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload images');
                      return;
                    }
                    setHeroFile(f);
                    setHeroPreview(URL.createObjectURL(f));
                  }}
                  onClear={() => {
                    setHeroFile(null);
                    setHeroPreview('');
                  }}
                  label="Upload hero image"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
            <h3 className="text-sm font-bold text-ink">About</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['eyebrowEn', 'Eyebrow (EN)'],
                ['eyebrowHi', 'Eyebrow (HI)'],
                ['titleEn', 'Title (EN)'],
                ['titleHi', 'Title (HI)'],
                ['highlightEn', 'Highlight (EN)'],
                ['highlightHi', 'Highlight (HI)'],
                ['subtitleEn', 'Subtitle (EN)'],
                ['subtitleHi', 'Subtitle (HI)'],
              ].map(([key, label]) => (
                <label key={key} className="block text-sm font-medium text-ink">
                  {label}
                  {key.startsWith('subtitle') ? (
                    <textarea
                      rows={2}
                      disabled={!canEdit}
                      value={form.about[key] || ''}
                      onChange={(e) => updateAbout(key, e.target.value)}
                      className={fieldClass}
                    />
                  ) : (
                    <input
                      disabled={!canEdit}
                      value={form.about[key] || ''}
                      onChange={(e) => updateAbout(key, e.target.value)}
                      className={fieldClass}
                    />
                  )}
                </label>
              ))}
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-ink">About Image</p>
                <ImageUploader
                  previewUrl={aboutFile ? URL.createObjectURL(aboutFile) : aboutPreview}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload images');
                      return;
                    }
                    setAboutFile(f);
                    setAboutPreview(URL.createObjectURL(f));
                  }}
                  onClear={() => {
                    setAboutFile(null);
                    setAboutPreview('');
                  }}
                  label="Upload about image"
                />
              </div>
            </div>
          </section>

          {canEdit ? (
            <div className="flex justify-end">
              <Button type="submit" disabled={saving} className="rounded-lg px-5 py-2.5">
                <FaSave className="mr-2" />
                {saving ? 'Saving...' : 'Save Website Content'}
              </Button>
            </div>
          ) : null}
        </form>
      )}
    </div>
  );
}
