import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaEye, FaPlus, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import ValidationPopup from '../ui/ValidationPopup';
import ImageUploader from './ImageUploader';
import DocumentUploader from './DocumentUploader';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { entryService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
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
  validateOptionalPhone,
  validatePan,
} from '../../utils/formValidation';
import EntryStudentProfileModal from './EntryStudentProfileModal';
import AccessDenied from './AccessDenied';

const PLAYER_DOCUMENTS = [
  { key: 'aadhaarFront', label: 'Aadhaar Card', urlKey: 'aadhaarFrontImage', removeKey: 'removeAadhaarFront' },
  { key: 'panCard', label: 'PAN Card', urlKey: 'panCardImage', removeKey: 'removePanCard' },
  { key: 'passport', label: 'Passport', urlKey: 'passportImage', removeKey: 'removePassport' },
  { key: 'additionalFile', label: 'Add Files', urlKey: 'aadhaarBackImage', removeKey: 'removeAdditionalFile' },
];

const EMPTY_DOC_FILES = { aadhaarFront: null, panCard: null, passport: null, additionalFile: null };
const EMPTY_DOC_URLS = { aadhaarFront: '', panCard: '', passport: '', additionalFile: '' };
const EMPTY_DOC_REMOVE = { aadhaarFront: false, panCard: false, passport: false, additionalFile: false };
const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended'];

const EMPTY = {
  fullName: '',
  fatherName: '',
  motherName: '',
  dateOfBirth: '',
  mobileNumber: '',
  alternateMobile: '',
  email: '',
  bloodGroup: '',

  aadhaarNumber: '',
  panNumber: '',

  address: '',
  village: '',
  city: '',
  district: '',
  state: '',
  pincode: '',

  joiningDate: '',
  coachId: '',

  heightCm: '',
  weightKg: '',
  chest: '',
  age: '',
  category: '',
  ageCategory: '',
  weightCategory: '',

  guardianName: '',
  guardianRelation: '',
  guardianMobile: '',
  allergies: '',
  medicalNotes: '',
  adminNotes: '',

  status: 'Active',
  achievements: '',
  paymentStatus: 'Pending',
  attendanceTotal: 0,
  attendancePresent: 0,
  attendanceAbsent: 0,
  password: '',
  confirmPassword: '',
};

export default function EntryStudentsPanel({ focusId = null, focusToken = null } = {}) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('students');
  const canCreate = can('students.create');
  const canEdit = can('students.edit');
  const canDelete = can('students.delete');
  const canResetPassword = can('students.reset_password') || canEdit;
  const canExport = can('students.export');
  const canUpload = can('students.upload');

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [status, setStatus] = useState('all');
  const [coachId, setCoachId] = useState('');
  const [joiningFrom, setJoiningFrom] = useState('');
  const [joiningTo, setJoiningTo] = useState('');

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const filtersKey = JSON.stringify({
    debouncedSearch,
    status,
    coachId,
    joiningFrom,
    joiningTo,
  });
  const prevFiltersKeyRef = useRef(filtersKey);

  const [coachOptions, setCoachOptions] = useState([]);

  const [exporting, setExporting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });

  const [photoFile, setPhotoFile] = useState(null);
  const [fatherPhotoFile, setFatherPhotoFile] = useState(null);
  const [motherPhotoFile, setMotherPhotoFile] = useState(null);

  // previews (edit mode)
  const [photoPreview, setPhotoPreview] = useState('');
  const [fatherPhotoPreview, setFatherPhotoPreview] = useState('');
  const [motherPhotoPreview, setMotherPhotoPreview] = useState('');
  const [docFiles, setDocFiles] = useState(EMPTY_DOC_FILES);
  const [docUrls, setDocUrls] = useState(EMPTY_DOC_URLS);
  const [docRemove, setDocRemove] = useState(EMPTY_DOC_REMOVE);

  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [resetModal, setResetModal] = useState({ open: false, student: null, password: '', confirmPassword: '', loading: false });

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

  const validateStudentForm = () => {
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
    if (!editingId && !photoFile) {
      errors.photo = 'Player photo is required';
    }

    if (!editingId) {
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
      const res = await entryService.students.stats();
      setStats(res.data.data);
    } catch (e) {
      /* non-critical */
    }
  };

  const fetchCoachesForDropdown = async () => {
    try {
      const res = await entryService.coaches.list({ limit: 1000, page: 1 });
      setCoachOptions(res.data.data.coaches || []);
    } catch {
      setCoachOptions([]);
    }
  };

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await entryService.students.list({
        page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        coachId: coachId || undefined,
        joiningFrom: joiningFrom || undefined,
        joiningTo: joiningTo || undefined,
      });
      const { students, pagination: p } = res.data.data;
      setItems(students);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load players');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCoachesForDropdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const filtersChanged = prevFiltersKeyRef.current !== filtersKey;
    prevFiltersKeyRef.current = filtersKey;
    if (filtersChanged && pagination.page !== 1) {
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }
    fetchList(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, filtersKey]);

  const openCreate = () => {
    if (!canCreate) return;
    setEditingId(null);
    setForm(EMPTY);
    setFieldErrors({});
    setPhotoFile(null);
    setPhotoPreview('');
    setFatherPhotoFile(null);
    setFatherPhotoPreview('');
    setMotherPhotoFile(null);
    setMotherPhotoPreview('');
    setDocFiles(EMPTY_DOC_FILES);
    setDocUrls(EMPTY_DOC_URLS);
    setDocRemove(EMPTY_DOC_REMOVE);
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    if (!canView) return;
    setProfileLoading(false);
    try {
      const res = await entryService.students.getOne(id);
      const student = res.data.data.student;
      setEditingId(id);
      setFieldErrors({});
      setForm({
        ...EMPTY,
        fullName: student.fullName || '',
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
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

        joiningDate: student.joiningDate ? student.joiningDate.slice(0, 10) : '',
        coachId: student.coachId || '',

        heightCm: student.heightCm ?? '',
        weightKg: student.weightKg ?? '',
        chest: student.chest ?? '',
        age: student.age ?? '',
        category: student.category ?? '',
        ageCategory: student.ageCategory ?? '',
        weightCategory: student.weightCategory ?? '',

        guardianName: student.guardianName ?? '',
        guardianRelation: student.guardianRelation ?? '',
        guardianMobile: student.guardianMobile ?? '',
        allergies: student.allergies ?? '',
        medicalNotes: student.medicalNotes ?? '',
        adminNotes: student.adminNotes ?? '',

        status: student.status || 'Active',
        achievements: student.achievements ?? '',
        paymentStatus: student.paymentStatus || 'Pending',
        attendanceTotal: student.attendanceTotal ?? 0,
        attendancePresent: student.attendancePresent ?? 0,
        attendanceAbsent: student.attendanceAbsent ?? 0,
        password: '',
        confirmPassword: '',
      });

      setPhotoFile(null);
      setPhotoPreview(student.photo ? mediaUrl(student.photo) : '');
      setFatherPhotoFile(null);
      setFatherPhotoPreview(
        student.fatherPhoto || student.parentPhoto ? mediaUrl(student.fatherPhoto || student.parentPhoto) : ''
      );
      setMotherPhotoFile(null);
      setMotherPhotoPreview(student.motherPhoto ? mediaUrl(student.motherPhoto) : '');
      const docs = student.studentDocuments || {};
      setDocFiles(EMPTY_DOC_FILES);
      setDocUrls({
        aadhaarFront: docs.aadhaarFrontImage || '',
        panCard: docs.panCardImage || '',
        passport: docs.passportImage || '',
        additionalFile: docs.aadhaarBackImage || '',
      });
      setDocRemove(EMPTY_DOC_REMOVE);

      setModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load student');
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
    if (editingId && !canEdit) {
      toast.error('You do not have permission to edit players');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create players');
      return;
    }
    if ((photoFile || fatherPhotoFile || motherPhotoFile || Object.values(docFiles).some(Boolean)) && !canUpload) {
      toast.error('You do not have permission to upload student photos');
      return;
    }
    const errors = validateStudentForm();
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
        'password',
        'confirmPassword',
        'photo',
      ]);
      setValidationPopup({ open: true, title: 'Validation required', message });
      toast.error(message);
      document.getElementById(`student-${Object.keys(errors)[0]}`)?.focus();
      return;
    }

    const payload = {
      admissionNumber: form.admissionNumber || undefined,
      fullName: form.fullName.trim(),
      fatherName: form.fatherName.trim(),
      motherName: form.motherName.trim(),
      dateOfBirth: form.dateOfBirth,
      bloodGroup: form.bloodGroup || undefined,
      mobileNumber: normalizeMobile(form.mobileNumber),
      alternateMobile: form.alternateMobile ? normalizeMobile(form.alternateMobile) : undefined,
      email: form.email || undefined,

      address: form.address || undefined,
      village: form.village || undefined,
      city: form.city || undefined,
      district: form.district || undefined,
      state: form.state || undefined,
      pincode: form.pincode || undefined,

      aadhaarNumber: normalizeAadhaar(form.aadhaarNumber),
      panNumber: normalizePan(form.panNumber),

      joiningDate: form.joiningDate,
      coachId: form.coachId || undefined,

      heightCm: form.heightCm || undefined,
      weightKg: form.weightKg || undefined,
      chest: form.chest || undefined,
      age: form.age || undefined,
      category: form.category || undefined,
      ageCategory: form.ageCategory || undefined,
      weightCategory: form.weightCategory || undefined,

      guardianName: form.guardianName || undefined,
      guardianRelation: form.guardianRelation || undefined,
      guardianMobile: form.guardianMobile || undefined,
      allergies: form.allergies || undefined,
      medicalNotes: form.medicalNotes || undefined,
      adminNotes: form.adminNotes || undefined,

      status: form.status,
      achievements: form.achievements || undefined,
      paymentStatus: form.paymentStatus,

      attendanceTotal: form.attendanceTotal || 0,
      attendancePresent: form.attendancePresent || 0,
      attendanceAbsent: form.attendanceAbsent || 0,
      ...(form.password
        ? { password: form.password, confirmPassword: form.confirmPassword }
        : {}),
    };

    PLAYER_DOCUMENTS.forEach((doc) => {
      if (docRemove[doc.key] && !docFiles[doc.key]) payload[doc.removeKey] = true;
    });

    const files = {
      photo: photoFile || undefined,
      fatherPhoto: fatherPhotoFile || undefined,
      motherPhoto: motherPhotoFile || undefined,
      aadhaarFront: docFiles.aadhaarFront || undefined,
      panCard: docFiles.panCard || undefined,
      passport: docFiles.passport || undefined,
      additionalFile: docFiles.additionalFile || undefined,
    };

    setSaving(true);
    try {
      if (editingId) {
        await entryService.students.update(editingId, payload, files);
        toast.success('Player updated');
      } else {
        await entryService.students.create(payload, files);
        toast.success('Player created');
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
      toast.error('You do not have permission to delete players');
      return;
    }
    const deleteId = confirm.id;
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await entryService.students.remove(deleteId);
      setItems((prev) => prev.filter((item) => (item._id || item.id) !== deleteId));
      toast.success('Player deleted');
      setConfirm({ open: false, id: null, loading: false });
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
      toast.error('You do not have permission to export players');
      return;
    }
    setExporting(true);
    try {
      const res = await entryService.students.exportRecords({ format: 'xlsx', search: search.trim() });
      triggerBlobDownload(res.data, `students-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error(await parseBlobError(err));
    } finally {
      setExporting(false);
    }
  };

  const openProfile = async (id) => {
    setProfileLoading(true);
    try {
      const res = await entryService.students.getOne(id);
      setProfile(res.data.data.student);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total Players</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.totalStudents ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Active Players</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.activeStudents ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Inactive Players</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.inactiveStudents ?? 0}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Today Admissions</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.todayAdmissions ?? 0}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search players..." />
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
          <select
            value={coachId}
            onChange={(e) => setCoachId(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
          >
            <option value="">All Coaches</option>
            {coachOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.fullName}
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
              <FaPlus /> Add Player
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
        <label className="block text-sm font-medium text-ink">
          Joining From
          <input type="date" value={joiningFrom} onChange={(e) => setJoiningFrom(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
        </label>
        <label className="block text-sm font-medium text-ink">
          Joining To
          <input type="date" value={joiningTo} onChange={(e) => setJoiningTo(e.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand" />
        </label>
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
          <p className="p-8 text-center text-sm text-muted">No players found.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Registration No</th>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Coach</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joining Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((s, idx) => (
                <tr key={s.id} className="border-t border-slate-50 align-top">
                  <td className="px-4 py-3">
                    <img src={mediaUrl(s.photo)} alt="" className="h-12 w-12 rounded-xl object-cover bg-slate-50" />
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{s.registrationNumber}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{s.fullName}</p>
                    <p className="text-xs text-muted">{s.mobileNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{s.coach?.fullName || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      s.status === 'Active'
                        ? 'bg-emerald-50 text-emerald-700'
                        : s.status === 'Inactive'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-50 text-amber-700'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {s.joiningDate ? new Date(s.joiningDate).toLocaleDateString('en-IN') : 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openProfile(s.id)}
                        className="rounded-lg p-2 text-brand hover:bg-brand/10"
                        aria-label="View"
                      >
                        <FaEye />
                      </button>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => openEdit(s.id)}
                          className="rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                          aria-label="Edit"
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
                              student: s,
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
                          onClick={() => setConfirm({ open: true, id: s.id, loading: false })}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          aria-label="Delete"
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
              <h3 className="text-lg font-bold text-ink">{editingId ? 'Edit Player' : 'Add Player'}</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl p-2 text-muted hover:text-ink"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Full Name *
                <input
                  id="student-fullName"
                  value={form.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  className={fieldClass(fieldErrors, 'fullName')}
                />
                {fieldErrors.fullName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.fullName}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink">
                Father Name *
                <input
                  id="student-fatherName"
                  value={form.fatherName}
                  onChange={(e) => updateField('fatherName', e.target.value)}
                  className={fieldClass(fieldErrors, 'fatherName')}
                />
                {fieldErrors.fatherName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.fatherName}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink">
                Mother Name *
                <input
                  id="student-motherName"
                  value={form.motherName}
                  onChange={(e) => updateField('motherName', e.target.value)}
                  className={fieldClass(fieldErrors, 'motherName')}
                />
                {fieldErrors.motherName ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.motherName}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Date of Birth *
                <input
                  id="student-dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => updateField('dateOfBirth', e.target.value)}
                  className={fieldClass(fieldErrors, 'dateOfBirth')}
                />
                {fieldErrors.dateOfBirth ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.dateOfBirth}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Mobile Number *
                <input
                  id="student-mobileNumber"
                  inputMode="numeric"
                  value={form.mobileNumber}
                  onChange={(e) => updateField('mobileNumber', normalizeMobile(e.target.value))}
                  maxLength={10}
                  className={fieldClass(fieldErrors, 'mobileNumber')}
                  placeholder="10-digit mobile"
                />
                {fieldErrors.mobileNumber ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.mobileNumber}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Alternate Mobile
                <input
                  id="student-alternateMobile"
                  inputMode="numeric"
                  value={form.alternateMobile}
                  onChange={(e) => updateField('alternateMobile', normalizeMobile(e.target.value))}
                  maxLength={10}
                  className={fieldClass(fieldErrors, 'alternateMobile')}
                />
                {fieldErrors.alternateMobile ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.alternateMobile}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Email
                <input
                  id="student-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={fieldClass(fieldErrors, 'email')}
                />
                {fieldErrors.email ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.email}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Aadhaar Number
                <input
                  id="student-aadhaarNumber"
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
                PAN Number
                <input
                  id="student-panNumber"
                  value={form.panNumber}
                  onChange={(e) => updateField('panNumber', normalizePan(e.target.value))}
                  maxLength={10}
                  className={`${fieldClass(fieldErrors, 'panNumber')} uppercase`}
                  placeholder="ABCDE1234F"
                />
                {fieldErrors.panNumber ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.panNumber}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Blood Group
                <input value={form.bloodGroup} onChange={(e) => updateField('bloodGroup', e.target.value)} className={fieldClass(fieldErrors, 'bloodGroup')} />
              </label>

              <label className="block text-sm font-medium text-ink">
                Status
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={fieldClass(fieldErrors, 'status')}>
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Joining Date *
                <input
                  id="student-joiningDate"
                  type="date"
                  value={form.joiningDate}
                  onChange={(e) => updateField('joiningDate', e.target.value)}
                  className={fieldClass(fieldErrors, 'joiningDate')}
                />
                {fieldErrors.joiningDate ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.joiningDate}</span> : null}
              </label>

              <div className="sm:col-span-2 rounded-xl border border-brand/20 bg-brand/5 p-4">
                <h4 className="text-sm font-bold text-ink">Login Credentials</h4>
                <p className="mt-1 text-xs text-muted">
                  {editingId
                    ? 'Leave blank to keep the current password. Username is the Registration ID.'
                    : 'Username will be the Registration ID (auto-generated). Player uses this to login.'}
                </p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="block text-sm font-medium text-ink">
                    Password {!editingId ? '*' : ''}
                    <input
                      id="student-password"
                      type="password"
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className={fieldClass(fieldErrors, 'password')}
                      placeholder={editingId ? 'Leave blank to keep' : 'Min 8 chars'}
                    />
                    {fieldErrors.password ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.password}</span> : null}
                  </label>
                  <label className="block text-sm font-medium text-ink">
                    Confirm Password {!editingId ? '*' : ''}
                    <input
                      id="student-confirmPassword"
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
              </div>

              <label className="block text-sm font-medium text-ink">
                Player Category
                <input value={form.category} onChange={(e) => updateField('category', e.target.value)} className={fieldClass(fieldErrors, 'category')} placeholder="e.g. Khelo India, Regular, Competitive" />
              </label>

              <label className="block text-sm font-medium text-ink">
                Coach Assigned
                <select value={form.coachId} onChange={(e) => updateField('coachId', e.target.value)} className={fieldClass(fieldErrors, 'coachId')}>
                  <option value="">None</option>
                  {coachOptions.map((c) => (
                    <option key={c.id} value={c.id}>{c.fullName}</option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                Weight (kg)
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.weightKg}
                  onChange={(e) => updateField('weightKg', e.target.value)}
                  className={fieldClass(fieldErrors, 'weightKg')}
                  placeholder="e.g. 65"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Age Category
                <input
                  value={form.ageCategory}
                  onChange={(e) => updateField('ageCategory', e.target.value)}
                  className={fieldClass(fieldErrors, 'ageCategory')}
                  placeholder="e.g. U15, U17, U20, Senior"
                />
              </label>

              <label className="block text-sm font-medium text-ink">
                Weight Category
                <input
                  value={form.weightCategory}
                  onChange={(e) => updateField('weightCategory', e.target.value)}
                  className={fieldClass(fieldErrors, 'weightCategory')}
                  placeholder="e.g. 57 KG, 65 KG"
                />
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-ink">Player Photo {!editingId ? '*' : ''}</p>
                <ImageUploader
                  previewUrl={photoFile ? URL.createObjectURL(photoFile) : photoPreview || ''}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload player photos');
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
                    setPhotoPreview(editingId ? photoPreview : '');
                  }}
                  label="Upload player photo (JPG/PNG/WEBP)"
                />
                {fieldErrors.photo ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.photo}</span> : null}
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-ink">Father Photo</p>
                <ImageUploader
                  previewUrl={fatherPhotoFile ? URL.createObjectURL(fatherPhotoFile) : fatherPhotoPreview || ''}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload father photos');
                      return;
                    }
                    setFatherPhotoFile(f);
                    setFatherPhotoPreview(URL.createObjectURL(f));
                  }}
                  onClear={() => {
                    setFatherPhotoFile(null);
                    setFatherPhotoPreview(editingId ? fatherPhotoPreview : '');
                  }}
                  label="Upload father photo (JPG/PNG/WEBP)"
                />
              </div>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-ink">Mother Photo</p>
                <ImageUploader
                  previewUrl={motherPhotoFile ? URL.createObjectURL(motherPhotoFile) : motherPhotoPreview || ''}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload mother photos');
                      return;
                    }
                    setMotherPhotoFile(f);
                    setMotherPhotoPreview(URL.createObjectURL(f));
                  }}
                  onClear={() => {
                    setMotherPhotoFile(null);
                    setMotherPhotoPreview(editingId ? motherPhotoPreview : '');
                  }}
                  label="Upload mother photo (JPG/PNG/WEBP)"
                />
              </div>

              <div className="sm:col-span-2">
                <h3 className="text-sm font-bold text-ink">Documents</h3>
                <p className="mt-1 text-xs text-muted">Upload identity documents for this player. Existing files stay saved unless you replace or remove them.</p>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {PLAYER_DOCUMENTS.map((doc) => (
                    <DocumentUploader
                      key={doc.key}
                      label={doc.label}
                      file={docFiles[doc.key]}
                      storedUrl={docRemove[doc.key] ? '' : docUrls[doc.key]}
                      busy={saving && Boolean(docFiles[doc.key] || docRemove[doc.key])}
                      disabled={!canUpload}
                      onChange={(picked) => {
                        if (!canUpload) {
                          toast.error('You do not have permission to upload player documents');
                          return;
                        }
                        setDocFiles((prev) => ({ ...prev, [doc.key]: picked }));
                        setDocRemove((prev) => ({ ...prev, [doc.key]: false }));
                      }}
                      onClear={() => {
                        setDocFiles((prev) => ({ ...prev, [doc.key]: null }));
                        setDocRemove((prev) => ({ ...prev, [doc.key]: Boolean(docUrls[doc.key]) }));
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Player' : 'Create Player'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Are you sure you want to delete this?"
        message="This will permanently delete the player record and documents."
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
                await entryService.students.resetPassword(resetModal.student.id, {
                  password: resetModal.password,
                  confirmPassword: resetModal.confirmPassword,
                });
                toast.success('Player password reset successfully');
                setResetModal({ open: false, student: null, password: '', confirmPassword: '', loading: false });
              } catch (err) {
                toast.error(getApiErrorMessage(err, 'Reset failed'));
                setResetModal((s) => ({ ...s, loading: false }));
              }
            }}
          >
            <h3 className="text-lg font-bold text-ink">Reset Player Password</h3>
            <p className="mt-1 text-sm text-muted">Player: {resetModal.student?.fullName || '—'}</p>
            <p className="mt-2 text-xs text-muted">Existing password cannot be viewed. Set a new password below.</p>
            <label className="mt-4 block text-sm font-medium">
              New Password
              <input
                type="password"
                autoComplete="new-password"
                value={resetModal.password}
                onChange={(e) => setResetModal((s) => ({ ...s, password: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Confirm Password
              <input
                type="password"
                autoComplete="new-password"
                value={resetModal.confirmPassword}
                onChange={(e) => setResetModal((s) => ({ ...s, confirmPassword: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setResetModal({ open: false, student: null, password: '', confirmPassword: '', loading: false })}
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

      <ValidationPopup
        open={validationPopup.open}
        title={validationPopup.title}
        message={validationPopup.message}
        onClose={() => setValidationPopup({ open: false, title: '', message: '' })}
      />

      {profileLoading ? null : (
        <EntryStudentProfileModal student={profile} onClose={() => setProfile(null)} />
      )}
    </div>
  );
}

