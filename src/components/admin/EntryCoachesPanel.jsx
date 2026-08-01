import { useEffect, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import ValidationPopup from '../ui/ValidationPopup';
import ImageUploader from './ImageUploader';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { entryService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import { triggerBlobDownload, parseBlobError } from '../../utils/downloadBlob';
import { getApiErrorMessage } from '../../utils/apiError';
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
  validatePan,
} from '../../utils/formValidation';
import EntryCoachProfileModal from './EntryCoachProfileModal';
import AccessDenied from './AccessDenied';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended'];

const EMPTY = {
  fullName: '',
  fatherName: '',
  mobile: '',
  email: '',
  dateOfBirth: '',
  address: '',
  experienceYears: '',
  specialization: '',
  qualification: '',
  salary: '',
  joiningDate: '',
  status: 'Active',
  aadhaarNumber: '',
  panNumber: '',
  achievements: '',
  biography: '',
};

export default function EntryCoachesPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('coaches');
  const canCreate = can('coaches.create');
  const canEdit = can('coaches.edit');
  const canDelete = can('coaches.delete');
  const canExport = can('coaches.export');
  const canUpload = can('coaches.upload');

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });

  const [photoFile, setPhotoFile] = useState(null);
  const [certificateFiles, setCertificateFiles] = useState([]);

  const [photoPreview, setPhotoPreview] = useState('');

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

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

  const validateCoachForm = () => {
    const errors = {};
    const fullName = requiredText(form.fullName, 'Full name');
    const fatherName = requiredText(form.fatherName, 'Father name');
    const mobile = validateIndianMobile(form.mobile, 'Mobile number');
    const email = validateEmail(form.email);
    const dob = validateDate(form.dateOfBirth, 'Date of birth', { maxToday: true });
    const aadhaar = validateAadhaar(form.aadhaarNumber);
    const pan = validatePan(form.panNumber);

    if (fullName) errors.fullName = fullName;
    if (fatherName) errors.fatherName = fatherName;
    if (mobile) errors.mobile = mobile;
    if (email) errors.email = email;
    if (dob) errors.dateOfBirth = dob;
    if (aadhaar) errors.aadhaarNumber = aadhaar;
    if (pan) errors.panNumber = pan;
    if (!editingId && !photoFile) errors.photo = 'Coach photo is required';
    return errors;
  };

  const fetchStats = async () => {
    try {
      const res = await entryService.coaches.stats();
      setStats(res.data.data);
    } catch {
      /* ignore */
    }
  };

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await entryService.coaches.list({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        status: status !== 'all' ? status : undefined,
      });
      const { coaches, pagination: p } = res.data.data;
      setItems(coaches);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load coaches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, search]);

  useEffect(() => {
    fetchList(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit]);

  if (!canView) return <AccessDenied />;

  const openCreate = () => {
    if (!canCreate) return;
    setEditingId(null);
    setForm(EMPTY);
    setFieldErrors({});
    setPhotoFile(null);
    setCertificateFiles([]);
    setPhotoPreview('');
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    if (!canEdit) return;
    try {
      const res = await entryService.coaches.getOne(id);
      const coach = res.data.data.coach;
      setEditingId(id);
      setFieldErrors({});
      setForm({
        ...EMPTY,
        fullName: coach.fullName || '',
        fatherName: coach.fatherName || '',
        mobile: coach.mobile || '',
        email: coach.email || '',
        dateOfBirth: coach.dateOfBirth ? coach.dateOfBirth.slice(0, 10) : '',
        address: coach.address || '',
        experienceYears: coach.experienceYears ?? '',
        specialization: coach.specialization || '',
        qualification: coach.qualification || '',
        salary: coach.salary ?? '',
        joiningDate: coach.joiningDate ? coach.joiningDate.slice(0, 10) : '',
        status: coach.status || 'Active',
        aadhaarNumber: coach.aadhaarNumber || '',
        panNumber: coach.panNumber || '',
        achievements: coach.achievements || '',
        biography: coach.biography || '',
      });

      setPhotoFile(null);
      setCertificateFiles([]);
      setPhotoPreview(coach.photo ? mediaUrl(coach.photo) : '');

      setModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load coach');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId && !canEdit) {
      toast.error('You do not have permission to edit coaches');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create coaches');
      return;
    }
    if ((photoFile || certificateFiles.length > 0) && !canUpload) {
      toast.error('You do not have permission to upload coach files');
      return;
    }
    const errors = validateCoachForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, [
        'fullName',
        'fatherName',
        'mobile',
        'email',
        'dateOfBirth',
        'aadhaarNumber',
        'panNumber',
        'photo',
      ]);
      setValidationPopup({ open: true, title: 'Validation required', message });
      toast.error(message);
      document.getElementById(`coach-${Object.keys(errors)[0]}`)?.focus();
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      fatherName: form.fatherName.trim(),
      mobile: normalizeMobile(form.mobile),
      email: form.email || undefined,
      dateOfBirth: form.dateOfBirth,
      address: form.address || undefined,
      experienceYears: form.experienceYears || undefined,
      specialization: form.specialization || undefined,
      qualification: form.qualification || undefined,
      salary: form.salary || undefined,
      joiningDate: form.joiningDate || undefined,
      status: form.status,
      aadhaarNumber: normalizeAadhaar(form.aadhaarNumber),
      panNumber: normalizePan(form.panNumber),
      achievements: form.achievements || undefined,
      biography: form.biography || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await entryService.coaches.update(editingId, payload, {
          photo: photoFile || undefined,
          certificates: certificateFiles?.length ? certificateFiles : undefined,
        });
        toast.success('Coach updated');
      } else {
        await entryService.coaches.create(payload, {
          photo: photoFile,
          certificates: certificateFiles?.length ? certificateFiles : undefined,
        });
        toast.success('Coach created');
      }

      setModalOpen(false);
      setEditingId(null);
      setFieldErrors({});
      await fetchStats();
      fetchList(pagination.page);
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Save failed');
      setValidationPopup({ open: true, title: 'Save failed', message: msg });
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete coaches');
      return;
    }
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await entryService.coaches.remove(confirm.id);
      toast.success('Coach deleted');
      setConfirm({ open: false, id: null, loading: false });
      await fetchStats();
      await fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
    }
  };

  const openProfile = async (id) => {
    try {
      const res = await entryService.coaches.getOne(id);
      setProfile(res.data.data.coach);
      setProfileOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export coaches');
      return;
    }
    setExporting(true);
    try {
      const res = await entryService.coaches.exportRecords({
        format: 'xlsx',
        search: search.trim(),
        status: status !== 'all' ? status : undefined,
      });
      triggerBlobDownload(res.data, `coaches-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(await parseBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total Coaches</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.totalCoaches ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Active Coaches</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.activeCoaches ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Inactive Coaches</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.inactiveCoaches ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Suspended Coaches</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.suspendedCoaches ?? '—'}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search coaches..." />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
          >
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          {canExport ? (
            <Button onClick={handleExport} disabled={exporting} className="rounded-lg px-4 py-2.5 text-sm">
              {exporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          ) : null}
          {canCreate ? (
            <Button onClick={openCreate} className="rounded-lg px-4 py-2.5 text-sm">
              <FaPlus /> Add Coach
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No coaches found.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Coach ID</th>
                <th className="px-4 py-3">Coach</th>
                <th className="px-4 py-3">Specialization</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-slate-50 align-top">
                  <td className="px-4 py-3">
                    <img src={mediaUrl(c.photo)} alt="" className="h-12 w-12 rounded-xl object-cover bg-slate-50" />
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{c.coachCode}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{c.fullName}</p>
                    <p className="text-xs text-muted">{c.mobile}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{c.specialization || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        c.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : c.status === 'Inactive'
                            ? 'bg-slate-100 text-slate-600'
                            : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => openProfile(c.id)} className="rounded-lg p-2 text-brand hover:bg-brand/10">
                        <FaEye />
                      </button>
                      {canEdit ? (
                        <button type="button" onClick={() => openEdit(c.id)} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50">
                          <FaEdit />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setConfirm({ open: true, id: c.id, loading: false })}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                        >
                          <FaTrash />
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!loading && items.length > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
          onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
        />
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleSave}
            className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            noValidate
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-ink">{editingId ? 'Edit Coach' : 'Add Coach'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-muted hover:text-ink">
                &times;
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Full Name *
                <input id="coach-fullName" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} className={fieldClass(fieldErrors, 'fullName')} />
                {fieldErrors.fullName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.fullName}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink">
                Father Name *
                <input id="coach-fatherName" value={form.fatherName} onChange={(e) => updateField('fatherName', e.target.value)} className={fieldClass(fieldErrors, 'fatherName')} />
                {fieldErrors.fatherName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.fatherName}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink">
                Mobile *
                <input
                  id="coach-mobile"
                  inputMode="numeric"
                  value={form.mobile}
                  onChange={(e) => updateField('mobile', normalizeMobile(e.target.value))}
                  maxLength={10}
                  className={fieldClass(fieldErrors, 'mobile')}
                  placeholder="10-digit mobile"
                />
                {fieldErrors.mobile ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.mobile}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Email
                <input id="coach-email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} className={fieldClass(fieldErrors, 'email')} />
                {fieldErrors.email ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.email}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Date of Birth *
                <input id="coach-dateOfBirth" type="date" value={form.dateOfBirth} onChange={(e) => updateField('dateOfBirth', e.target.value)} className={fieldClass(fieldErrors, 'dateOfBirth')} />
                {fieldErrors.dateOfBirth ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.dateOfBirth}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Aadhaar Number *
                <input
                  id="coach-aadhaarNumber"
                  inputMode="numeric"
                  value={form.aadhaarNumber}
                  onChange={(e) => updateField('aadhaarNumber', normalizeAadhaar(e.target.value))}
                  maxLength={12}
                  className={fieldClass(fieldErrors, 'aadhaarNumber')}
                  placeholder="12-digit Aadhaar"
                />
                {fieldErrors.aadhaarNumber ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.aadhaarNumber}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink">
                PAN Number *
                <input
                  id="coach-panNumber"
                  value={form.panNumber}
                  onChange={(e) => updateField('panNumber', normalizePan(e.target.value))}
                  maxLength={10}
                  className={`${fieldClass(fieldErrors, 'panNumber')} uppercase`}
                  placeholder="ABCDE1234F"
                />
                {fieldErrors.panNumber ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.panNumber}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Status
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={fieldClass(fieldErrors, 'status')}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                Specialization
                <input value={form.specialization} onChange={(e) => updateField('specialization', e.target.value)} className={fieldClass(fieldErrors, 'specialization')} />
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-ink">Coach Photo {!editingId ? '*' : ''}</p>
                <ImageUploader
                  previewUrl={photoFile ? URL.createObjectURL(photoFile) : photoPreview || ''}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload coach files');
                      return;
                    }
                    setPhotoFile(f);
                    setPhotoPreview(URL.createObjectURL(f));
                    if (fieldErrors.photo) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.photo;
                        return next;
                      });
                    }
                  }}
                  label="Upload coach photo (JPG/PNG/WEBP)"
                />
                {fieldErrors.photo ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.photo}</span> : null}
              </div>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Certificates (Optional)
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={(e) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload coach files');
                      return;
                    }
                    setCertificateFiles([...((e.target.files && Array.from(e.target.files)) || [])]);
                  }}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
                {certificateFiles.length ? (
                  <p className="mt-1 text-xs text-muted">{certificateFiles.length} file(s) selected</p>
                ) : null}
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Coach' : 'Create Coach'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete this coach?"
        message="This will permanently delete the coach record and documents."
        confirmLabel="Delete"
        danger
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />

      <ValidationPopup
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        onClose={() => setValidationPopup({ open: false, title: '', message: '' })}
      />

      {profileOpen ? (
        <EntryCoachProfileModal coach={profile} onClose={() => setProfileOpen(false)} />
      ) : null}
    </div>
  );
}


