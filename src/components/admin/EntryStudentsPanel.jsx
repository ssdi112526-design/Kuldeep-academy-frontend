import { useEffect, useRef, useState } from 'react';
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
  validateOptionalPhone,
  validatePan,
} from '../../utils/formValidation';
import EntryStudentProfileModal from './EntryStudentProfileModal';
import AccessDenied from './AccessDenied';

const STATUS_OPTIONS = ['Active', 'Inactive', 'Suspended'];
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];
const TRAINING_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Professional'];

const EMPTY = {
  fullName: '',
  fatherName: '',
  motherName: '',
  gender: 'Other',
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
  membershipType: 'General',
  batch: '',
  coachId: '',
  trainingLevel: 'Beginner',

  heightCm: '',
  weightKg: '',
  chest: '',
  age: '',
  category: '',

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
};

export default function EntryStudentsPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('students');
  const canCreate = can('students.create');
  const canEdit = can('students.edit');
  const canDelete = can('students.delete');
  const canExport = can('students.export');
  const canUpload = can('students.upload');

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [coachId, setCoachId] = useState('');
  const [batch, setBatch] = useState('');
  const [membershipType, setMembershipType] = useState('');
  const [joiningFrom, setJoiningFrom] = useState('');
  const [joiningTo, setJoiningTo] = useState('');

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const searchRef = useRef(search);
  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  const [coachOptions, setCoachOptions] = useState([]);

  const [exporting, setExporting] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });

  const [photoFile, setPhotoFile] = useState(null);

  // previews (edit mode)
  const [photoPreview, setPhotoPreview] = useState('');

  const [saving, setSaving] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

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
    const aadhaar = validateAadhaar(form.aadhaarNumber);
    const pan = validatePan(form.panNumber);

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
      errors.photo = 'Student photo is required';
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
        search: searchRef.current.trim() || undefined,
        status: status !== 'all' ? status : undefined,
        coachId: coachId || undefined,
        batch: batch || undefined,
        membershipType: membershipType || undefined,
        joiningFrom: joiningFrom || undefined,
        joiningTo: joiningTo || undefined,
      });
      const { students, pagination: p } = res.data.data;
      setItems(students);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
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
    fetchList(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, coachId, batch, membershipType, joiningFrom, joiningTo]);

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
    setPhotoPreview('');
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    if (!canEdit) return;
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
        gender: student.gender || 'Other',
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
        membershipType: student.membershipType || 'General',
        batch: student.batch || '',
        coachId: student.coachId || '',
        trainingLevel: student.trainingLevel || 'Beginner',

        heightCm: student.heightCm ?? '',
        weightKg: student.weightKg ?? '',
        chest: student.chest ?? '',
        age: student.age ?? '',
        category: student.category ?? '',

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
      });

      setPhotoFile(null);
      setPhotoPreview(student.photo ? mediaUrl(student.photo) : '');

      setModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load student');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId && !canEdit) {
      toast.error('You do not have permission to edit students');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create students');
      return;
    }
    if (photoFile && !canUpload) {
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
      gender: form.gender,
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
      membershipType: form.membershipType || 'General',
      batch: form.batch || 'General',
      coachId: form.coachId || undefined,
      trainingLevel: form.trainingLevel,

      heightCm: form.heightCm || undefined,
      weightKg: form.weightKg || undefined,
      chest: form.chest || undefined,
      age: form.age || undefined,
      category: form.category || undefined,

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
    };

    setSaving(true);
    try {
      if (editingId) {
        await entryService.students.update(editingId, payload, {
          photo: photoFile || undefined,
        });
        toast.success('Student updated');
      } else {
        await entryService.students.create(payload, {
          photo: photoFile,
        });
        toast.success('Student created');
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
      toast.error('You do not have permission to delete students');
      return;
    }
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await entryService.students.remove(confirm.id);
      toast.success('Student deleted');
      setConfirm({ open: false, id: null, loading: false });
      await fetchStats();
      await fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
    }
  };

  const handleExport = async () => {
    if (!canExport) {
      toast.error('You do not have permission to export students');
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total Students</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.totalStudents ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Active Students</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.activeStudents ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Inactive Students</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.inactiveStudents ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Today Admissions</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.todayAdmissions ?? '—'}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search students..." />
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
              <FaPlus /> Add Student
            </Button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-sm font-medium text-ink">
          Batch
          <input
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        <label className="block text-sm font-medium text-ink">
          Membership
          <input
            value={membershipType}
            onChange={(e) => setMembershipType(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
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
          <p className="p-8 text-center text-sm text-muted">No students found.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Photo</th>
                <th className="px-4 py-3">Registration No</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Coach</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Membership / Batch</th>
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
                  <td className="px-4 py-3 text-muted">{s.coach?.fullName || '—'}</td>
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
                  <td className="px-4 py-3 text-muted">
                    {s.membershipType} / {s.batch}
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">
                    {s.joiningDate ? new Date(s.joiningDate).toLocaleDateString('en-IN') : '—'}
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
              <h3 className="text-lg font-bold text-ink">{editingId ? 'Edit Student' : 'Add Student'}</h3>
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
                Gender
                <select
                  value={form.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className={fieldClass(fieldErrors, 'gender')}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
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
                Aadhaar Number *
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
                PAN Number *
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

              <label className="block text-sm font-medium text-ink">
                Membership Type
                <input value={form.membershipType} onChange={(e) => updateField('membershipType', e.target.value)} className={fieldClass(fieldErrors, 'membershipType')} />
              </label>

              <label className="block text-sm font-medium text-ink">
                Batch
                <input value={form.batch} onChange={(e) => updateField('batch', e.target.value)} className={fieldClass(fieldErrors, 'batch')} />
              </label>

              <label className="block text-sm font-medium text-ink">
                Training Level
                <select value={form.trainingLevel} onChange={(e) => updateField('trainingLevel', e.target.value)} className={fieldClass(fieldErrors, 'trainingLevel')}>
                  {TRAINING_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>{lvl}</option>
                  ))}
                </select>
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

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-ink">Student Photo {!editingId ? '*' : ''}</p>
                <ImageUploader
                  previewUrl={photoFile ? URL.createObjectURL(photoFile) : photoPreview || ''}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload student photos');
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
                  label="Upload student photo (JPG/PNG/WEBP)"
                />
                {fieldErrors.photo ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.photo}</span> : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Student' : 'Create Student'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete this student?"
        message="This will permanently delete the student record and documents."
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

      {profileLoading ? null : (
        <EntryStudentProfileModal student={profile} onClose={() => setProfile(null)} />
      )}
    </div>
  );
}

