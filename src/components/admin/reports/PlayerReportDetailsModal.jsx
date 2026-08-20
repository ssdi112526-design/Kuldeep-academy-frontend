import { useEffect, useMemo, useState } from 'react';
import { FaCamera, FaDownload, FaEdit, FaFilePdf, FaPrint, FaTimes, FaUser } from 'react-icons/fa';
import Button from '../../ui/Button';
import ValidationPopup from '../../ui/ValidationPopup';
import ImageUploader from '../ImageUploader';
import PlayerReportAttendance from './PlayerReportAttendance';
import { useToast } from '../../../context/ToastContext';
import { usePermissions } from '../../../context/PermissionContext';
import { entryService } from '../../../services';
import { mediaUrl } from '../../../utils/mediaUrl';
import { parseBlobError, triggerBlobDownload, filenameFromContentDisposition } from '../../../utils/downloadBlob';
import {
  fieldClass,
  firstErrorMessage,
  normalizeAadhaar,
  normalizeMobile,
  normalizePan,
  requiredText,
  validateAadhaar,
  validateDate,
  validateEmail,
  validateIndianMobile,
  validateOptionalPhone,
  validatePan,
} from '../../../utils/formValidation';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const TRAINING_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];
const MISSING = 'Not provided';

function displayValue(value) {
  if (value === 0 || value === '0') return MISSING;
  if (value == null) return MISSING;
  const text = String(value).trim();
  return text ? text : MISSING;
}

function isoDate(value) {
  if (!value) return '';
  const text = String(value);
  if (text.length >= 10) return text.slice(0, 10);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function formatDate(value) {
  if (!value) return MISSING;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return MISSING;
  return date.toLocaleDateString('en-IN');
}

function computeAge(student) {
  if (!student?.dateOfBirth) return null;
  const dob = new Date(student.dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) age -= 1;
  return age >= 0 ? age : null;
}

function formatAddress(student) {
  const parts = [
    student?.address,
    student?.village,
    student?.city,
    student?.district,
    student?.state,
    student?.pincode,
  ]
    .map((part) => String(part || '').trim())
    .filter(Boolean);
  return parts.length ? parts.join(', ') : MISSING;
}

function isKheloIndia(student) {
  return /khelo/i.test(String(student?.category || '')) || /khelo/i.test(String(student?.membershipType || ''));
}

function studentToForm(student) {
  return {
    fullName: student.fullName || '',
    fatherName: student.fatherName || '',
    motherName: student.motherName || '',
    gender: student.gender || 'Other',
    dateOfBirth: isoDate(student.dateOfBirth),
    mobileNumber: student.mobileNumber || '',
    alternateMobile: student.alternateMobile || '',
    email: student.email || '',
    bloodGroup: student.bloodGroup || '',
    aadhaarNumber: student.aadhaarNumber || '',
    panNumber: student.panNumber || '',
    address: student.address || '',
    village: student.village || '',
    city: student.city || '',
    district: student.district || '',
    state: student.state || '',
    pincode: student.pincode || '',
    joiningDate: isoDate(student.joiningDate),
    membershipType: student.membershipType || 'General',
    batch: student.batch || '',
    coachId: student.coachId || '',
    trainingLevel: student.trainingLevel || 'Beginner',
    heightCm: student.heightCm || '',
    weightKg: student.weightKg || '',
    chest: student.chest || '',
    age: student.age || '',
    category: student.category || '',
    ageCategory: student.ageCategory || '',
    weightCategory: student.weightCategory || '',
    guardianName: student.guardianName || '',
    guardianRelation: student.guardianRelation || '',
    guardianMobile: student.guardianMobile || '',
    allergies: student.allergies || '',
    medicalNotes: student.medicalNotes || '',
    adminNotes: student.adminNotes || '',
    status: student.status || 'Active',
    achievements: student.achievements || '',
    paymentStatus: student.paymentStatus || 'Pending',
  };
}

function Detail({ label, value, className = '' }) {
  return (
    <div className={className}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-words text-sm text-ink">{displayValue(value)}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-100 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-ink">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

const DOC_TONES = {
  purple: 'border-violet-200 bg-violet-50 text-violet-800',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  red: 'border-red-200 bg-red-50 text-red-800',
};

function isPdfPath(href) {
  return /\.pdf($|\?)/i.test(String(href || ''));
}

function studentDocs(student) {
  const docs = student?.studentDocuments || {};
  return {
    aadhaarFront: docs.aadhaarFrontImage || docs.aadhaar_front_image || '',
    panCard: docs.panCardImage || docs.pan_card_image || '',
    passport: docs.passportImage || docs.passport_image || '',
    additionalFile: docs.aadhaarBackImage || docs.aadhaar_back_image || '',
  };
}

function ParentPhoto({ label, src, name, tone }) {
  return (
    <div className={`flex items-center gap-2 rounded-lg px-2 py-2 ${tone}`}>
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white shadow-sm">
        {src ? (
          <img src={src} alt={label} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-300">
            <FaUser size={16} aria-hidden />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</p>
        <p className="truncate text-xs font-semibold">{displayValue(name)}</p>
      </div>
    </div>
  );
}

function DocumentCard({ label, href, slot, tone = 'purple', onDownload, downloading = false }) {
  const uploaded = Boolean(href);
  const cls = DOC_TONES[tone] || DOC_TONES.purple;
  const preview = uploaded ? mediaUrl(href) : '';
  const pdf = isPdfPath(href);

  return (
    <div className={`relative z-10 flex min-w-[160px] flex-1 flex-col rounded-xl border p-3 ${cls}`}>
      <p className="text-xs font-bold">{label}</p>
      {uploaded ? (
        <>
          {pdf ? (
            <div className="mt-2 flex h-20 items-center justify-center rounded-lg bg-white/80">
              <FaFilePdf className="text-2xl text-red-500" />
            </div>
          ) : (
            <a
              href={preview}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block cursor-pointer overflow-hidden rounded-lg bg-white"
            >
              <img src={preview} alt={label} className="h-20 w-full object-contain" />
            </a>
          )}
          <p className="mt-2 text-[11px] font-semibold">Uploaded</p>
          <button
            type="button"
            disabled={downloading}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDownload(slot, label);
            }}
            className="mt-2 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] font-semibold text-ink shadow-sm hover:border-brand/40 hover:bg-brand/5 disabled:cursor-wait disabled:opacity-60"
          >
            <FaDownload />
            {downloading ? 'Downloading…' : 'Download'}
          </button>
        </>
      ) : (
        <p className="mt-3 text-[11px] font-medium opacity-80">Not Uploaded</p>
      )}
    </div>
  );
}

export default function PlayerReportDetailsModal({ studentId, onClose, onSaved }) {
  const toast = useToast();
  const { can } = usePermissions();
  const canEdit = can('students.edit');
  const canUpload = can('students.upload');
  const canPrint = can('reports.print') || can('students.print');

  const [mode, setMode] = useState('view');
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [coaches, setCoaches] = useState([]);
  const [saving, setSaving] = useState(false);
  const [downloadingSlot, setDownloadingSlot] = useState('');
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });

  const photoSrc = mediaUrl(student?.photo);
  const fatherPhotoSrc = mediaUrl(student?.fatherPhoto || student?.parentPhoto);
  const motherPhotoSrc = mediaUrl(student?.motherPhoto);
  const coachName = student?.coach?.fullName;
  const docs = student ? studentDocs(student) : {};

  const loadStudent = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await entryService.students.getOne(studentId);
      const next = res.data?.data?.student;
      if (!next) throw new Error('missing');
      setStudent(next);
    } catch {
      setStudent(null);
      setLoadError('Unable to load player details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = async (slot, label) => {
    if (!student?.id || downloadingSlot) return;
    setDownloadingSlot(slot);
    try {
      const res = await entryService.students.downloadDocument(student.id, slot);
      const raw = res.data;
      if (!(raw instanceof Blob) || raw.type?.includes('application/json')) {
        throw new Error('Download failed');
      }
      const href = docs[slot] || '';
      const extMatch = String(href).match(/\.[a-z0-9]+($|\?)/i);
      const ext = extMatch ? extMatch[0].replace('?', '') : isPdfPath(href) ? '.pdf' : '.jpg';
      const fallbackName = `${student.registrationNumber}-${String(label).replace(/\s+/g, '-')}${ext}`;
      const filename = filenameFromContentDisposition(
        res.headers?.['content-disposition'],
        fallbackName
      );
      triggerBlobDownload(new Blob([raw], { type: raw.type || 'application/octet-stream' }), filename);
      toast.success(`${label} downloaded`);
    } catch (err) {
      toast.error((await parseBlobError(err)) || 'Download failed');
    } finally {
      setDownloadingSlot('');
    }
  };

  useEffect(() => {
    loadStudent();
  }, [studentId]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, saving]);

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

  const startEdit = async () => {
    if (!canEdit || !student) return;
    setForm(studentToForm(student));
    setFieldErrors({});
    setPhotoFile(null);
    setPhotoPreview(student.photo ? mediaUrl(student.photo) : '');
    setMode('edit');
    try {
      const res = await entryService.coaches.list({ page: 1, limit: 1000 });
      setCoaches(res.data?.data?.coaches || []);
    } catch {
      setCoaches(student.coach ? [student.coach] : []);
    }
  };

  const cancelEdit = () => {
    if (saving) return;
    setMode('view');
    setForm(null);
    setFieldErrors({});
    setPhotoFile(null);
  };

  const validateForm = () => {
    const errors = {};
    const fullName = requiredText(form.fullName, 'Full name');
    const fatherName = requiredText(form.fatherName, 'Father name');
    const motherName = requiredText(form.motherName, 'Mother name');
    const mobile = validateIndianMobile(form.mobileNumber, 'Mobile number');
    const altMobile = validateOptionalPhone(form.alternateMobile, 'Alternate mobile');
    const email = validateEmail(form.email);
    const dob = validateDate(form.dateOfBirth, 'Date of birth', { maxToday: true });
    const joining = validateDate(form.joiningDate, 'Joining date');
    const aadhaar = validateAadhaar(form.aadhaarNumber, { required: false });
    const pan = validatePan(form.panNumber, { required: false });

    if (fullName) errors.fullName = fullName;
    if (fatherName) errors.fatherName = fatherName;
    if (motherName) errors.motherName = motherName;
    if (dob) errors.dateOfBirth = dob;
    if (mobile) errors.mobileNumber = mobile;
    if (altMobile) errors.alternateMobile = altMobile;
    if (email) errors.email = email;
    if (aadhaar) errors.aadhaarNumber = aadhaar;
    if (pan) errors.panNumber = pan;
    if (joining) errors.joiningDate = joining;
    return errors;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canEdit) {
      toast.error('You do not have permission to edit players');
      return;
    }
    if (photoFile && !canUpload) {
      toast.error('You do not have permission to upload student photos');
      return;
    }
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, [
        'fullName',
        'fatherName',
        'motherName',
        'dateOfBirth',
        'mobileNumber',
        'alternateMobile',
        'email',
        'aadhaarNumber',
        'panNumber',
        'joiningDate',
      ]);
      setValidationPopup({ open: true, title: 'Validation required', message });
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      fatherName: form.fatherName.trim(),
      motherName: form.motherName.trim(),
      gender: form.gender,
      dateOfBirth: form.dateOfBirth,
      bloodGroup: form.bloodGroup || undefined,
      mobileNumber: normalizeMobile(form.mobileNumber),
      alternateMobile: form.alternateMobile ? normalizeMobile(form.alternateMobile) : '',
      email: form.email || '',
      address: form.address || '',
      village: form.village || '',
      city: form.city || '',
      district: form.district || '',
      state: form.state || '',
      pincode: form.pincode || '',
      aadhaarNumber: normalizeAadhaar(form.aadhaarNumber),
      panNumber: normalizePan(form.panNumber),
      joiningDate: form.joiningDate,
      membershipType: form.membershipType || 'General',
      batch: form.batch || 'General',
      coachId: form.coachId || '',
      trainingLevel: form.trainingLevel,
      heightCm: form.heightCm || 0,
      weightKg: form.weightKg || 0,
      chest: form.chest || 0,
      age: form.age || 0,
      category: form.category || '',
      ageCategory: form.ageCategory || '',
      weightCategory: form.weightCategory || '',
      guardianName: form.guardianName || '',
      guardianRelation: form.guardianRelation || '',
      guardianMobile: form.guardianMobile || '',
      allergies: form.allergies || '',
      medicalNotes: form.medicalNotes || '',
      adminNotes: form.adminNotes || '',
      status: form.status,
      achievements: form.achievements || '',
      paymentStatus: form.paymentStatus,
    };

    setSaving(true);
    try {
      await entryService.students.update(student.id, payload, {
        photo: photoFile || undefined,
      });
      toast.success('Player details updated successfully.');
      await loadStudent();
      setMode('view');
      setForm(null);
      setPhotoFile(null);
      onSaved?.();
    } catch {
      toast.error('Unable to update player details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const kheloLabel = useMemo(() => (isKheloIndia(student) ? 'Yes' : 'No'), [student]);

  return (
    <div
      className="player-report-overlay fixed inset-0 z-[90] flex items-stretch justify-center bg-ink/50 p-0 backdrop-blur-sm print:static print:bg-white print:p-0 print:backdrop-blur-none sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-details-title"
      onClick={() => {
        if (!saving && mode === 'view') onClose();
      }}
    >
      <div
        className="player-report-sheet flex h-full w-full max-w-5xl flex-col overflow-hidden bg-white shadow-2xl print:h-auto print:max-w-none print:overflow-visible print:shadow-none sm:h-auto sm:max-h-[92vh] sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#FFFaf0] to-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">Player Profile</p>
            <h2 id="player-details-title" className="mt-1 truncate text-lg font-bold text-ink">
              {student?.fullName || 'Player Details'}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {student?.registrationNumber || (loading ? 'Loading…' : '')}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 print:hidden">
            {mode === 'view' && student ? (
              <>
                {canPrint ? (
                  <Button
                    type="button"
                    variant="secondary"
                    className="rounded-lg px-4 py-2 text-sm"
                    onClick={() => window.print()}
                  >
                    <FaPrint size={12} /> Print
                  </Button>
                ) : null}
                {canEdit ? (
                  <>
                    <Button type="button" variant="secondary" className="rounded-lg px-4 py-2 text-sm" onClick={startEdit}>
                      <FaCamera size={12} /> Change Photo
                    </Button>
                    <Button type="button" variant="secondary" className="rounded-lg px-4 py-2 text-sm" onClick={startEdit}>
                      <FaEdit size={12} /> Edit Player
                    </Button>
                  </>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              aria-label="Close"
              className="rounded-xl p-2 text-muted hover:bg-slate-100 hover:text-ink disabled:opacity-50"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <p className="py-16 text-center text-sm text-muted">Loading player details...</p>
          ) : loadError ? (
            <div className="py-16 text-center">
              <p className="text-sm text-red-600">{loadError}</p>
              <Button type="button" variant="secondary" className="mt-4 rounded-lg text-sm" onClick={loadStudent}>
                Try again
              </Button>
            </div>
          ) : mode === 'edit' && form ? (
            <form id="player-report-edit-form" onSubmit={handleSave} noValidate className="space-y-4">
              <Section title="Personal Details">
                <label className="block text-sm font-medium text-ink sm:col-span-2">
                  Full Name *
                  <input
                    value={form.fullName}
                    onChange={(e) => updateField('fullName', e.target.value)}
                    className={fieldClass(fieldErrors, 'fullName')}
                  />
                  {fieldErrors.fullName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.fullName}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Father Name *
                  <input
                    value={form.fatherName}
                    onChange={(e) => updateField('fatherName', e.target.value)}
                    className={fieldClass(fieldErrors, 'fatherName')}
                  />
                  {fieldErrors.fatherName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.fatherName}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Mother Name *
                  <input
                    value={form.motherName}
                    onChange={(e) => updateField('motherName', e.target.value)}
                    className={fieldClass(fieldErrors, 'motherName')}
                  />
                  {fieldErrors.motherName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.motherName}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Date of Birth *
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => updateField('dateOfBirth', e.target.value)}
                    className={fieldClass(fieldErrors, 'dateOfBirth')}
                  />
                  {fieldErrors.dateOfBirth ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.dateOfBirth}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Age
                  <input
                    type="number"
                    min="0"
                    value={form.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    className={fieldClass(fieldErrors, 'age')}
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Gender
                  <select value={form.gender} onChange={(e) => updateField('gender', e.target.value)} className={fieldClass(fieldErrors, 'gender')}>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-ink">
                  Mobile Number *
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    value={form.mobileNumber}
                    onChange={(e) => updateField('mobileNumber', normalizeMobile(e.target.value))}
                    className={fieldClass(fieldErrors, 'mobileNumber')}
                  />
                  {fieldErrors.mobileNumber ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.mobileNumber}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Alternate Mobile
                  <input
                    inputMode="numeric"
                    maxLength={10}
                    value={form.alternateMobile}
                    onChange={(e) => updateField('alternateMobile', normalizeMobile(e.target.value))}
                    className={fieldClass(fieldErrors, 'alternateMobile')}
                  />
                  {fieldErrors.alternateMobile ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.alternateMobile}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Email
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    className={fieldClass(fieldErrors, 'email')}
                  />
                  {fieldErrors.email ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.email}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Blood Group
                  <input value={form.bloodGroup} onChange={(e) => updateField('bloodGroup', e.target.value)} className={fieldClass(fieldErrors, 'bloodGroup')} />
                </label>
                <label className="block text-sm font-medium text-ink sm:col-span-2">
                  Address
                  <input value={form.address} onChange={(e) => updateField('address', e.target.value)} className={fieldClass(fieldErrors, 'address')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Village
                  <input value={form.village} onChange={(e) => updateField('village', e.target.value)} className={fieldClass(fieldErrors, 'village')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  City
                  <input value={form.city} onChange={(e) => updateField('city', e.target.value)} className={fieldClass(fieldErrors, 'city')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  District
                  <input value={form.district} onChange={(e) => updateField('district', e.target.value)} className={fieldClass(fieldErrors, 'district')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  State
                  <input value={form.state} onChange={(e) => updateField('state', e.target.value)} className={fieldClass(fieldErrors, 'state')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Pincode
                  <input value={form.pincode} onChange={(e) => updateField('pincode', e.target.value)} className={fieldClass(fieldErrors, 'pincode')} />
                </label>
              </Section>

              <Section title="Sports Details">
                <label className="block text-sm font-medium text-ink">
                  Player Category
                  <input value={form.category} onChange={(e) => updateField('category', e.target.value)} className={fieldClass(fieldErrors, 'category')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Age Category
                  <input value={form.ageCategory} onChange={(e) => updateField('ageCategory', e.target.value)} className={fieldClass(fieldErrors, 'ageCategory')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Weight Category
                  <input value={form.weightCategory} onChange={(e) => updateField('weightCategory', e.target.value)} className={fieldClass(fieldErrors, 'weightCategory')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Weight (kg)
                  <input
                    type="number"
                    min="0"
                    value={form.weightKg}
                    onChange={(e) => updateField('weightKg', e.target.value)}
                    className={fieldClass(fieldErrors, 'weightKg')}
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Height (cm)
                  <input
                    type="number"
                    min="0"
                    value={form.heightCm}
                    onChange={(e) => updateField('heightCm', e.target.value)}
                    className={fieldClass(fieldErrors, 'heightCm')}
                  />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Training Level
                  <select
                    value={form.trainingLevel}
                    onChange={(e) => updateField('trainingLevel', e.target.value)}
                    className={fieldClass(fieldErrors, 'trainingLevel')}
                  >
                    {TRAINING_LEVELS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-ink">
                  Joining Date *
                  <input
                    type="date"
                    value={form.joiningDate}
                    onChange={(e) => updateField('joiningDate', e.target.value)}
                    className={fieldClass(fieldErrors, 'joiningDate')}
                  />
                  {fieldErrors.joiningDate ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.joiningDate}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  Player Status
                  <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={fieldClass(fieldErrors, 'status')}>
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              </Section>

              <Section title="Identification Details">
                <label className="block text-sm font-medium text-ink">
                  Aadhaar Number
                  <input
                    inputMode="numeric"
                    maxLength={12}
                    value={form.aadhaarNumber}
                    onChange={(e) => updateField('aadhaarNumber', normalizeAadhaar(e.target.value))}
                    className={fieldClass(fieldErrors, 'aadhaarNumber')}
                  />
                  {fieldErrors.aadhaarNumber ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.aadhaarNumber}</span> : null}
                </label>
                <label className="block text-sm font-medium text-ink">
                  PAN Number
                  <input
                    maxLength={10}
                    value={form.panNumber}
                    onChange={(e) => updateField('panNumber', normalizePan(e.target.value))}
                    className={`${fieldClass(fieldErrors, 'panNumber')} uppercase`}
                  />
                  {fieldErrors.panNumber ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.panNumber}</span> : null}
                </label>
              </Section>

              <Section title="Academy Details">
                <label className="block text-sm font-medium text-ink">
                  Coach
                  <select value={form.coachId} onChange={(e) => updateField('coachId', e.target.value)} className={fieldClass(fieldErrors, 'coachId')}>
                    <option value="">Not assigned</option>
                    {coaches.map((coach) => (
                      <option key={coach.id} value={coach.id}>
                        {coach.fullName}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-ink">
                  Batch
                  <input value={form.batch} onChange={(e) => updateField('batch', e.target.value)} className={fieldClass(fieldErrors, 'batch')} />
                </label>
                <label className="block text-sm font-medium text-ink">
                  Membership Type
                  <input
                    value={form.membershipType}
                    onChange={(e) => updateField('membershipType', e.target.value)}
                    className={fieldClass(fieldErrors, 'membershipType')}
                  />
                </label>
                <label className="block text-sm font-medium text-ink sm:col-span-2">
                  Admin Notes
                  <textarea
                    rows={3}
                    value={form.adminNotes}
                    onChange={(e) => updateField('adminNotes', e.target.value)}
                    className={fieldClass(fieldErrors, 'adminNotes')}
                  />
                </label>
              </Section>

              <Section title="Player Photo">
                <div className="sm:col-span-2">
                  <ImageUploader
                    value={photoFile}
                    previewUrl={photoPreview}
                    label="Change player photo"
                    previewClassName="aspect-[4/5] w-36"
                    onChange={(file) => {
                      if (!canUpload) {
                        toast.error('You do not have permission to upload student photos');
                        return;
                      }
                      setPhotoFile(file);
                    }}
                    onClear={() => {
                      setPhotoFile(null);
                      setPhotoPreview(student.photo ? mediaUrl(student.photo) : '');
                    }}
                  />
                </div>
              </Section>
            </form>
          ) : (
            <div className="space-y-4">
              <section className="rounded-xl border border-slate-100 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-base font-bold text-ink">Player Information</h3>
                </div>
                <div className="mt-4 flex flex-col gap-5 sm:flex-row">
                  <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                    {photoSrc ? (
                      <img src={photoSrc} alt={student.fullName} className="h-full w-full object-cover object-center" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <FaUser size={36} aria-hidden />
                      </div>
                    )}
                  </div>
                  <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                    <Detail label="Name" value={student.fullName} />
                    <Detail label="ID" value={student.registrationNumber} />
                    <Detail label="DOB" value={formatDate(student.dateOfBirth)} />
                    <div className="sm:col-span-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Parents</p>
                      <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <ParentPhoto
                          label="Father"
                          name={student.fatherName}
                          src={fatherPhotoSrc}
                          tone="bg-sky-50 text-sky-800"
                        />
                        <ParentPhoto
                          label="Mother"
                          name={student.motherName}
                          src={motherPhotoSrc}
                          tone="bg-pink-50 text-pink-800"
                        />
                      </div>
                    </div>
                    <Detail label="Age" value={computeAge(student) != null ? `${computeAge(student)} Years` : null} />
                    <Detail label="Weight" value={student.weightKg ? `${student.weightKg} Kg` : null} />
                    <Detail label="Category" value={student.category} />
                    <Detail label="Gender" value={student.gender} />
                    <Detail label="Contact Number" value={student.mobileNumber} />
                    <Detail label="Joining Date" value={formatDate(student.joiningDate)} />
                    <Detail label="Player Status" value={student.status} />
                    <Detail label="Guardian" value={student.guardianName} />
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Documents</p>
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <DocumentCard
                      label="Aadhaar Card"
                      href={docs.aadhaarFront}
                      slot="aadhaarFront"
                      tone="purple"
                      downloading={downloadingSlot === 'aadhaarFront'}
                      onDownload={handleDownloadDocument}
                    />
                    <DocumentCard
                      label="PAN Card"
                      href={docs.panCard}
                      slot="panCard"
                      tone="red"
                      downloading={downloadingSlot === 'panCard'}
                      onDownload={handleDownloadDocument}
                    />
                    <DocumentCard
                      label="Passport"
                      href={docs.passport}
                      slot="passport"
                      tone="green"
                      downloading={downloadingSlot === 'passport'}
                      onDownload={handleDownloadDocument}
                    />
                    <DocumentCard
                      label="Add Files"
                      href={docs.additionalFile}
                      slot="additionalFile"
                      tone="purple"
                      downloading={downloadingSlot === 'additionalFile'}
                      onDownload={handleDownloadDocument}
                    />
                  </div>
                </div>
              </section>

              <PlayerReportAttendance studentId={student.id} />

              <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
                Note: Same attendance is visible in Parent &amp; Student portals (read only).
              </div>

              <Section title="More details">
                <Detail label="Email" value={student.email} />
                <Detail label="Address" value={formatAddress(student)} />
                <Detail label="Age Category" value={student.ageCategory} />
                <Detail label="Weight Category" value={student.weightCategory} />
                <Detail label="Coach" value={coachName} />
                <Detail label="Batch" value={student.batch} />
                <Detail label="Membership" value={student.membershipType} />
                <Detail label="Khelo India" value={kheloLabel} />
              </Section>
            </div>
          )}
        </div>

        {mode === 'edit' ? (
          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
            <Button type="button" variant="secondary" className="rounded-lg px-4 py-2 text-sm" disabled={saving} onClick={cancelEdit}>
              Cancel
            </Button>
            <Button type="submit" form="player-report-edit-form" className="rounded-lg px-4 py-2 text-sm" disabled={saving}>
              {saving ? 'Saving changes...' : 'Save Changes'}
            </Button>
          </div>
        ) : null}
      </div>

      <ValidationPopup
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        onClose={() => setValidationPopup({ open: false, title: '', message: '' })}
      />
    </div>
  );
}
