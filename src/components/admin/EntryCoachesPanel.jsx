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
import { clearPublicCache } from '../../utils/publicCache';
import EntryCoachProfileModal from './EntryCoachProfileModal';
import AccessDenied from './AccessDenied';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const CATEGORY_OPTIONS = ['Coach', 'Assistant Coach', 'Warden', 'Cook', 'Cleaner', 'Physio'];
const ROLE_OPTIONS = [
  'Head Coach',
  'Coach',
  'Assistant Coach',
  'Warden',
  'Cook',
  'Cleaner',
  'Physio',
  'Manager',
  'Accountant',
  'Staff',
];

const EMPTY = {
  fullName: '',
  mobile: '',
  email: '',
  dateOfBirth: '',
  gender: '',
  aadhaarNumber: '',
  panNumber: '',
  joiningDate: '',
  employeeRole: '',
  category: '',
  status: 'Active',
  loginUsername: '',
  password: '',
  confirmPassword: '',
};

function formatDisplayDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function EntryCoachesPanel({ focusId = null, focusToken = null } = {}) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('coaches');
  const canCreate = can('coaches.create');
  const canEdit = can('coaches.edit');
  const canDelete = can('coaches.delete');
  const canExport = can('coaches.export');
  const canUpload = can('coaches.upload');
  const canResetPassword = can('coaches.reset_password') || canEdit;
  const canAttachFiles = canUpload || canCreate || canEdit;

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
  const [photoPreview, setPhotoPreview] = useState('');

  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [resetModal, setResetModal] = useState({
    open: false,
    coach: null,
    password: '',
    confirmPassword: '',
    loading: false,
  });

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
    const fullName = requiredText(form.fullName, 'Employee name');
    const mobile = validateIndianMobile(form.mobile, 'Mobile number');
    const email = validateEmail(form.email);
    const dob = validateDate(form.dateOfBirth, 'Date of birth', { maxToday: true });
    const joining = validateDate(form.joiningDate, 'Joining date', { required: true });
    const aadhaar = validateAadhaar(form.aadhaarNumber, { required: false });
    const pan = validatePan(form.panNumber, { required: false });

    if (fullName) errors.fullName = fullName;
    if (mobile) errors.mobile = mobile;
    if (email) errors.email = email;
    if (dob) errors.dateOfBirth = dob;
    if (joining) errors.joiningDate = joining;
    if (!form.employeeRole?.trim()) errors.employeeRole = 'Role is required';
    if (!form.category) errors.category = 'Category is required';
    else if (!CATEGORY_OPTIONS.includes(form.category)) errors.category = 'Select a valid category';
    if (aadhaar) errors.aadhaarNumber = aadhaar;
    if (pan) errors.panNumber = pan;
    if (!editingId && !photoFile) errors.photo = 'Profile image is required';
    if (!editingId) {
      if (!form.loginUsername?.trim()) errors.loginUsername = 'Username is required';
      if (!form.password) errors.password = 'Password is required';
      else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
        errors.password = 'Password must be 8+ chars with upper, lower and a number';
      }
      if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    } else if (form.password || form.confirmPassword) {
      if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(form.password)) {
        errors.password = 'Password must be 8+ chars with upper, lower and a number';
      }
      if (form.password !== form.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }
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
      setError(err.response?.data?.message || 'Failed to load employees');
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

  const openCreate = () => {
    if (!canCreate) return;
    setEditingId(null);
    setForm(EMPTY);
    setFieldErrors({});
    setPhotoFile(null);
    setPhotoPreview('');
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    if (!canView) return;
    try {
      const res = await entryService.coaches.getOne(id);
      const coach = res.data.data.coach;
      setEditingId(id);
      setFieldErrors({});
      setForm({
        ...EMPTY,
        fullName: coach.fullName || '',
        mobile: coach.mobile || '',
        email: coach.email || '',
        dateOfBirth: coach.dateOfBirth ? String(coach.dateOfBirth).slice(0, 10) : '',
        gender: coach.gender || '',
        aadhaarNumber: coach.aadhaarNumber || '',
        panNumber: coach.panNumber || '',
        joiningDate: coach.joiningDate ? String(coach.joiningDate).slice(0, 10) : '',
        employeeRole: coach.employeeRole || '',
        category: coach.category || '',
        status: coach.status || 'Active',
        loginUsername: coach.username || coach.loginAccount?.username || '',
        password: '',
        confirmPassword: '',
      });
      setPhotoFile(null);
      setPhotoPreview(coach.photo ? mediaUrl(coach.photo) : '');
      setModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load employee');
    }
  };

  useEffect(() => {
    if (!canView || !focusId) return;
    openEdit(focusId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, focusToken, canView]);

  if (!canView) return <AccessDenied />;

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (editingId && !canEdit) {
      toast.error('You do not have permission to edit employees');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create employees');
      return;
    }
    if (photoFile && !canAttachFiles) {
      toast.error('You do not have permission to upload employee files');
      return;
    }
    const errors = validateCoachForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, [
        'fullName',
        'mobile',
        'email',
        'dateOfBirth',
        'gender',
        'aadhaarNumber',
        'panNumber',
        'joiningDate',
        'employeeRole',
        'category',
        'loginUsername',
        'password',
        'confirmPassword',
        'photo',
      ]);
      setValidationPopup({ open: true, title: 'Validation required', message });
      toast.error(message);
      document.getElementById(`coach-${Object.keys(errors)[0]}`)?.focus();
      return;
    }

    const payload = {
      fullName: form.fullName.trim(),
      mobile: normalizeMobile(form.mobile),
      email: form.email || undefined,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender || undefined,
      aadhaarNumber: normalizeAadhaar(form.aadhaarNumber) || '',
      panNumber: normalizePan(form.panNumber) || '',
      joiningDate: form.joiningDate,
      employeeRole: form.employeeRole.trim(),
      category: form.category,
      status: form.status,
      loginUsername: form.loginUsername?.trim() || undefined,
      ...(form.password ? { password: form.password, confirmPassword: form.confirmPassword } : {}),
    };

    setSaving(true);
    try {
      if (editingId) {
        await entryService.coaches.update(editingId, payload, {
          photo: photoFile || undefined,
        });
        toast.success('Employee updated');
      } else {
        await entryService.coaches.create(payload, {
          photo: photoFile,
        });
        toast.success('Employee created');
      }

      clearPublicCache('coaches');
      setModalOpen(false);
      setEditingId(null);
      setFieldErrors({});
      await fetchStats();
      await fetchList(editingId ? pagination.page : 1);
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
      toast.error('You do not have permission to delete employees');
      return;
    }
    const deleteId = confirm.id;
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await entryService.coaches.remove(deleteId);
      setItems((prev) => prev.filter((item) => item.id !== deleteId));
      toast.success('Employee deleted');
      setConfirm({ open: false, id: null, loading: false });
      clearPublicCache('coaches');
      await fetchStats();
      await fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
      fetchList(pagination.page);
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export employees');
      return;
    }
    setExporting(true);
    try {
      const res = await entryService.coaches.exportRecords({
        format: 'xlsx',
        search: search.trim(),
        status: status !== 'all' ? status : undefined,
      });
      triggerBlobDownload(res.data, `employees-${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      toast.error((await parseBlobError(err)) || 'Export failed');
    } finally {
      setExporting(false);
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

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total Employees</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.totalCoaches ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Active Employees</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.activeCoaches ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Inactive Employees</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.inactiveCoaches ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Suspended</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.suspendedCoaches ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search employees..." />
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
              <FaPlus /> Add Employee
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
          <p className="p-8 text-center text-sm text-muted">No employees found.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Joining Date</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-t border-slate-50 align-top">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={mediaUrl(c.photo)}
                        alt=""
                        className="h-11 w-11 rounded-xl object-cover bg-slate-50"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-ink">{c.fullName}</p>
                        <p className="text-xs text-muted">{c.coachCode}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink">{c.employeeRole || '—'}</td>
                  <td className="px-4 py-3 text-ink">{c.category || '—'}</td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{formatDisplayDate(c.joiningDate)}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{c.mobile || '—'}</p>
                    <p className="text-xs text-muted">{c.email || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openProfile(c.id)}
                        className="rounded-lg p-2 text-brand hover:bg-brand/10"
                        title="View"
                      >
                        <FaEye />
                      </button>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => openEdit(c.id)}
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                      ) : null}
                      {canResetPassword ? (
                        <button
                          type="button"
                          title="Reset Password"
                          onClick={() =>
                            setResetModal({
                              open: true,
                              coach: c,
                              password: '',
                              confirmPassword: '',
                              loading: false,
                            })
                          }
                          className="rounded-lg px-2 py-1 text-xs font-semibold text-ink hover:bg-slate-100"
                        >
                          Reset PW
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => setConfirm({ open: true, id: c.id, loading: false })}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
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
              <h3 className="text-lg font-bold text-ink">{editingId ? 'Edit Employee' : 'Add Employee'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-muted hover:text-ink">
                &times;
              </button>
            </div>

            <div className="mt-5 space-y-6">
              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Basic Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-ink sm:col-span-2">
                    Employee Name *
                    <input
                      id="coach-fullName"
                      value={form.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      className={fieldClass(fieldErrors, 'fullName')}
                    />
                    {fieldErrors.fullName ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.fullName}</span>
                    ) : null}
                  </label>

                  <div className="sm:col-span-2">
                    <p className="text-sm font-medium text-ink">Profile Image {!editingId ? '*' : ''}</p>
                    <ImageUploader
                      previewUrl={photoFile ? URL.createObjectURL(photoFile) : photoPreview || ''}
                      onChange={(f) => {
                        if (!canAttachFiles) {
                          toast.error('You do not have permission to upload employee files');
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
                      onClear={() => {
                        setPhotoFile(null);
                        setPhotoPreview('');
                      }}
                      label="Upload employee photo (JPG/PNG/WEBP)"
                    />
                    {fieldErrors.photo ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.photo}</span>
                    ) : null}
                  </div>

                  <label className="block text-sm font-medium text-ink">
                    Mobile Number *
                    <input
                      id="coach-mobile"
                      inputMode="numeric"
                      value={form.mobile}
                      onChange={(e) => updateField('mobile', normalizeMobile(e.target.value))}
                      maxLength={10}
                      className={fieldClass(fieldErrors, 'mobile')}
                      placeholder="10-digit mobile"
                    />
                    {fieldErrors.mobile ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.mobile}</span>
                    ) : null}
                  </label>

                  <label className="block text-sm font-medium text-ink">
                    Email
                    <input
                      id="coach-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={fieldClass(fieldErrors, 'email')}
                    />
                    {fieldErrors.email ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.email}</span>
                    ) : null}
                  </label>

                  <label className="block text-sm font-medium text-ink">
                    Date of Birth *
                    <input
                      id="coach-dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => updateField('dateOfBirth', e.target.value)}
                      className={fieldClass(fieldErrors, 'dateOfBirth')}
                    />
                    {fieldErrors.dateOfBirth ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.dateOfBirth}</span>
                    ) : null}
                  </label>

                  <label className="block text-sm font-medium text-ink">
                    Gender
                    <select
                      id="coach-gender"
                      value={form.gender}
                      onChange={(e) => updateField('gender', e.target.value)}
                      className={fieldClass(fieldErrors, 'gender')}
                    >
                      <option value="">Select gender</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Identity Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-ink">
                    Aadhaar <span className="font-normal text-muted">(Optional)</span>
                    <input
                      id="coach-aadhaarNumber"
                      inputMode="numeric"
                      value={form.aadhaarNumber}
                      onChange={(e) => updateField('aadhaarNumber', normalizeAadhaar(e.target.value))}
                      maxLength={12}
                      className={fieldClass(fieldErrors, 'aadhaarNumber')}
                      placeholder="12-digit Aadhaar"
                    />
                    {fieldErrors.aadhaarNumber ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.aadhaarNumber}</span>
                    ) : null}
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    PAN <span className="font-normal text-muted">(Optional)</span>
                    <input
                      id="coach-panNumber"
                      value={form.panNumber}
                      onChange={(e) => updateField('panNumber', normalizePan(e.target.value))}
                      maxLength={10}
                      className={`${fieldClass(fieldErrors, 'panNumber')} uppercase`}
                      placeholder="ABCDE1234F"
                    />
                    {fieldErrors.panNumber ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.panNumber}</span>
                    ) : null}
                  </label>
                </div>
              </section>

              <section>
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Employment Information</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-ink">
                    Joining Date *
                    <input
                      id="coach-joiningDate"
                      type="date"
                      value={form.joiningDate}
                      onChange={(e) => updateField('joiningDate', e.target.value)}
                      className={fieldClass(fieldErrors, 'joiningDate')}
                    />
                    {fieldErrors.joiningDate ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.joiningDate}</span>
                    ) : null}
                  </label>

                  <label className="block text-sm font-medium text-ink">
                    Role *
                    <select
                      id="coach-employeeRole"
                      value={form.employeeRole}
                      onChange={(e) => updateField('employeeRole', e.target.value)}
                      className={fieldClass(fieldErrors, 'employeeRole')}
                    >
                      <option value="">Select role</option>
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.employeeRole ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.employeeRole}</span>
                    ) : null}
                  </label>

                  <label className="block text-sm font-medium text-ink">
                    Category *
                    <select
                      id="coach-category"
                      value={form.category}
                      onChange={(e) => updateField('category', e.target.value)}
                      className={fieldClass(fieldErrors, 'category')}
                    >
                      <option value="">Select category</option>
                      {CATEGORY_OPTIONS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {fieldErrors.category ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.category}</span>
                    ) : null}
                  </label>

                  <label className="block text-sm font-medium text-ink">
                    Status
                    <select
                      value={form.status}
                      onChange={(e) => updateField('status', e.target.value)}
                      className={fieldClass(fieldErrors, 'status')}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </section>

              <section className="rounded-xl border border-brand/20 bg-brand/5 p-4">
                <h4 className="text-sm font-bold text-ink">Login Credentials</h4>
                <p className="mt-1 text-xs text-muted">
                  {editingId
                    ? 'Leave password blank to keep the current password.'
                    : 'Employee uses this username and password for the employee portal login.'}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-ink sm:col-span-2">
                    Username {!editingId ? '*' : ''}
                    <input
                      id="coach-loginUsername"
                      value={form.loginUsername}
                      onChange={(e) => updateField('loginUsername', e.target.value)}
                      className={fieldClass(fieldErrors, 'loginUsername')}
                      placeholder="e.g. coach_rahul"
                      autoComplete="off"
                    />
                    {fieldErrors.loginUsername ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.loginUsername}</span>
                    ) : null}
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Password {!editingId ? '*' : ''}
                    <input
                      id="coach-password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={fieldClass(fieldErrors, 'password')}
                      placeholder={editingId ? 'Leave blank to keep' : 'Min 8 chars'}
                    />
                    {fieldErrors.password ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.password}</span>
                    ) : null}
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Confirm Password {!editingId ? '*' : ''}
                    <input
                      id="coach-confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      value={form.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className={fieldClass(fieldErrors, 'confirmPassword')}
                    />
                    {fieldErrors.confirmPassword ? (
                      <span className="mt-1 block text-xs text-red-500">{fieldErrors.confirmPassword}</span>
                    ) : null}
                  </label>
                </div>
              </section>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Employee' : 'Create Employee'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete employee?"
        message="This will permanently delete the employee record and documents."
        confirmLabel="Delete"
        danger
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />

      {resetModal.open ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm">
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canResetPassword) return;
              if (!resetModal.password || resetModal.password !== resetModal.confirmPassword) {
                toast.error('Password and confirm password must match');
                return;
              }
              setResetModal((s) => ({ ...s, loading: true }));
              try {
                await entryService.coaches.resetPassword(resetModal.coach.id, {
                  password: resetModal.password,
                  confirmPassword: resetModal.confirmPassword,
                });
                toast.success('Employee password reset successfully');
                setResetModal({ open: false, coach: null, password: '', confirmPassword: '', loading: false });
              } catch (err) {
                toast.error(getApiErrorMessage(err, 'Reset failed'));
                setResetModal((s) => ({ ...s, loading: false }));
              }
            }}
          >
            <h3 className="text-lg font-bold text-ink">Reset Employee Password</h3>
            <p className="mt-1 text-sm text-muted">Employee: {resetModal.coach?.fullName || '—'}</p>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium">
                New Password
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={resetModal.password}
                  onChange={(e) => setResetModal((s) => ({ ...s, password: e.target.value }))}
                />
              </label>
              <label className="block text-sm font-medium">
                Confirm Password
                <input
                  type="password"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={resetModal.confirmPassword}
                  onChange={(e) => setResetModal((s) => ({ ...s, confirmPassword: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setResetModal({ open: false, coach: null, password: '', confirmPassword: '', loading: false })
                }
              >
                Cancel
              </Button>
              <Button type="submit" disabled={resetModal.loading}>
                {resetModal.loading ? 'Saving…' : 'Reset Password'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {profileOpen ? (
        <EntryCoachProfileModal
          coach={profile}
          onClose={() => {
            setProfileOpen(false);
            setProfile(null);
          }}
        />
      ) : null}

      <ValidationPopup
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        onClose={() => setValidationPopup({ open: false, title: '', message: '' })}
      />
    </div>
  );
}
