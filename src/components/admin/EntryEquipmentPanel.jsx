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
import { fieldClass, firstErrorMessage, requiredText, validateDate } from '../../utils/formValidation';
import EntryEquipmentProfileModal from './EntryEquipmentProfileModal';
import AccessDenied from './AccessDenied';

const CONDITION_OPTIONS = ['Excellent', 'Good', 'Average', 'Damaged'];
const STATUS_OPTIONS = ['Available', 'InUse', 'Maintenance', 'Lost'];

const EMPTY = {
  title: '',
  description: '',
  category: '',
  quantity: '',
  availableQuantity: '',
  purchaseDate: '',
  purchaseCost: '',
  supplier: '',
  condition: 'Good',
  location: '',
  rackNumber: '',
  status: 'Available',
  maintenance: '',
  remarks: '',
  barcodeValue: '',
  order: 0,
};

export default function EntryEquipmentPanel() {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('equipment');
  const canCreate = can('equipment.create');
  const canEdit = can('equipment.edit');
  const canDelete = can('equipment.delete');
  const canExport = can('equipment.export');
  const canUpload = can('equipment.upload');

  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('all');
  const [condition, setCondition] = useState('all');

  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [validationPopup, setValidationPopup] = useState({ open: false, title: '', message: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
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

  const validateEquipmentForm = () => {
    const errors = {};
    const title = requiredText(form.title, 'Equipment name');
    const description = requiredText(form.description, 'Description', 5);
    const purchaseDate = validateDate(form.purchaseDate, 'Purchase date', { required: false, maxToday: true });

    if (title) errors.title = title;
    if (description) errors.description = description;
    if (purchaseDate) errors.purchaseDate = purchaseDate;

    const qty = form.quantity === '' || form.quantity === null || form.quantity === undefined ? null : Number(form.quantity);
    const avail =
      form.availableQuantity === '' || form.availableQuantity === null || form.availableQuantity === undefined
        ? null
        : Number(form.availableQuantity);

    if (qty !== null && (!Number.isFinite(qty) || qty < 0)) errors.quantity = 'Quantity must be 0 or more';
    if (avail !== null && (!Number.isFinite(avail) || avail < 0)) {
      errors.availableQuantity = 'Available quantity must be 0 or more';
    }
    if (qty !== null && avail !== null && avail > qty) {
      errors.availableQuantity = 'Available quantity cannot exceed total quantity';
    }
    if (form.purchaseCost !== '' && form.purchaseCost !== null && form.purchaseCost !== undefined) {
      const cost = Number(form.purchaseCost);
      if (!Number.isFinite(cost) || cost < 0) errors.purchaseCost = 'Purchase cost must be 0 or more';
    }
    if (!editingId && !imageFile) errors.image = 'Equipment image is required';
    return errors;
  };

  const fetchStats = async () => {
    try {
      const res = await entryService.equipment.stats();
      setStats(res.data.data);
    } catch {
      /* ignore */
    }
  };

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await entryService.equipment.list({
        page,
        limit: pagination.limit,
        search: search.trim() || undefined,
        category: category || undefined,
        status: status !== 'all' ? status : undefined,
        condition: condition !== 'all' ? condition : undefined,
      });
      const { equipment, pagination: p } = res.data.data;
      setItems(equipment);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load equipment');
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
  }, [category, status, condition, search]);

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
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEdit = async (id) => {
    if (!canEdit) return;
    try {
      const res = await entryService.equipment.getOne(id);
      const equipment = res.data.data.equipment;
      setEditingId(id);
      setFieldErrors({});
      setForm({
        ...EMPTY,
        title: equipment.title || '',
        description: equipment.description || '',
        category: equipment.category || '',
        quantity: equipment.quantity ?? '',
        availableQuantity: equipment.availableQuantity ?? '',
        purchaseDate: equipment.purchaseDate ? equipment.purchaseDate.slice(0, 10) : '',
        purchaseCost: equipment.purchaseCost ?? '',
        supplier: equipment.supplier || '',
        condition: equipment.condition || 'Good',
        location: equipment.location || '',
        rackNumber: equipment.rackNumber || '',
        status: equipment.status || 'Available',
        maintenance: equipment.maintenance || '',
        remarks: equipment.remarks || '',
        barcodeValue: equipment.barcodeValue || '',
        order: equipment.order ?? 0,
      });
      setImageFile(null);
      setImagePreview(equipment.image ? mediaUrl(equipment.image) : '');
      setModalOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load equipment');
    }
  };

  const openProfile = async (id) => {
    try {
      const res = await entryService.equipment.getOne(id);
      setProfile(res.data.data.equipment);
      setProfileOpen(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (editingId && !canEdit) {
      toast.error('You do not have permission to edit equipment');
      return;
    }
    if (!editingId && !canCreate) {
      toast.error('You do not have permission to create equipment');
      return;
    }
    if (imageFile && !canUpload) {
      toast.error('You do not have permission to upload equipment images');
      return;
    }
    const errors = validateEquipmentForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, [
        'title',
        'description',
        'quantity',
        'availableQuantity',
        'purchaseDate',
        'purchaseCost',
        'image',
      ]);
      setValidationPopup({ open: true, title: 'Validation required', message });
      toast.error(message);
      document.getElementById(`equipment-${Object.keys(errors)[0]}`)?.focus();
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category || undefined,
      quantity: form.quantity || undefined,
      availableQuantity: form.availableQuantity || undefined,
      purchaseDate: form.purchaseDate || undefined,
      purchaseCost: form.purchaseCost || undefined,
      supplier: form.supplier || undefined,
      condition: form.condition,
      location: form.location || undefined,
      rackNumber: form.rackNumber || undefined,
      status: form.status,
      maintenance: form.maintenance || undefined,
      remarks: form.remarks || undefined,
      barcodeValue: form.barcodeValue || undefined,
      order: form.order,
    };

    setSaving(true);
    try {
      if (editingId) {
        await entryService.equipment.update(editingId, payload, { image: imageFile || undefined });
        toast.success('Equipment updated');
      } else {
        await entryService.equipment.create(payload, { image: imageFile });
        toast.success('Equipment created');
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
      toast.error('You do not have permission to delete equipment');
      return;
    }
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await entryService.equipment.remove(confirm.id);
      toast.success('Equipment deleted');
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
      toast.error('You do not have permission to export equipment');
      return;
    }
    setExporting(true);
    try {
      const res = await entryService.equipment.exportRecords({
        format: 'xlsx',
        search: search.trim(),
        category: category || undefined,
        status: status !== 'all' ? status : undefined,
        condition: condition !== 'all' ? condition : undefined,
      });
      triggerBlobDownload(res.data, `equipment-${new Date().toISOString().slice(0, 10)}.xlsx`);
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
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Total Equipment</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.totalEquipment ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Available</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.available ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Maintenance</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.maintenance ?? '—'}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">Damaged</p>
          <p className="mt-1 text-2xl font-bold text-ink">{stats?.damaged ?? '—'}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search equipment..." />
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none"
          />
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none">
            <option value="all">All Status</option>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={condition} onChange={(e) => setCondition(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none">
            <option value="all">All Condition</option>
            {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
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
              <FaPlus /> Add Equipment
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
          <p className="p-8 text-center text-sm text-muted">No equipment found.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Equipment ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status / Condition</th>
                <th className="px-4 py-3">Qty</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={e.id} className="border-t border-slate-50 align-top">
                  <td className="px-4 py-3">
                    <img src={mediaUrl(e.image)} alt="" className="h-12 w-12 rounded-xl object-cover bg-slate-50" />
                  </td>
                  <td className="px-4 py-3 text-muted whitespace-nowrap">{e.equipmentCode || e.id}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{e.title}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">{e.category || '—'}</td>
                  <td className="px-4 py-3 text-muted">
                    {e.status} / {e.condition}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {e.availableQuantity} / {e.quantity}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button type="button" onClick={() => openProfile(e.id)} className="rounded-lg p-2 text-brand hover:bg-brand/10">
                        <FaEye />
                      </button>
                      {canEdit ? (
                        <button type="button" onClick={() => openEdit(e.id)} className="rounded-lg p-2 text-amber-600 hover:bg-amber-50">
                          <FaEdit />
                        </button>
                      ) : null}
                      {canDelete ? (
                        <button type="button" onClick={() => setConfirm({ open: true, id: e.id, loading: false })} className="rounded-lg p-2 text-red-600 hover:bg-red-50">
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
          <form onSubmit={handleSave} className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" noValidate>
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-ink">{editingId ? 'Edit Equipment' : 'Add Equipment'}</h3>
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-xl p-2 text-muted hover:text-ink">
                &times;
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Equipment Name *
                <input id="equipment-title" value={form.title} onChange={(e) => updateField('title', e.target.value)} className={fieldClass(fieldErrors, 'title')} />
                {fieldErrors.title ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.title}</span> : null}
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Description *
                <textarea id="equipment-description" value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={3} className={fieldClass(fieldErrors, 'description')} />
                {fieldErrors.description ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.description}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Category
                <input value={form.category} onChange={(e) => updateField('category', e.target.value)} className={fieldClass(fieldErrors, 'category')} />
              </label>

              <label className="block text-sm font-medium text-ink">
                Condition
                <select value={form.condition} onChange={(e) => updateField('condition', e.target.value)} className={fieldClass(fieldErrors, 'condition')}>
                  {CONDITION_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                Status
                <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className={fieldClass(fieldErrors, 'status')}>
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label className="block text-sm font-medium text-ink">
                Quantity
                <input id="equipment-quantity" type="number" min="0" value={form.quantity} onChange={(e) => updateField('quantity', e.target.value)} className={fieldClass(fieldErrors, 'quantity')} />
                {fieldErrors.quantity ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.quantity}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Available Quantity
                <input id="equipment-availableQuantity" type="number" min="0" value={form.availableQuantity} onChange={(e) => updateField('availableQuantity', e.target.value)} className={fieldClass(fieldErrors, 'availableQuantity')} />
                {fieldErrors.availableQuantity ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.availableQuantity}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Purchase Date
                <input id="equipment-purchaseDate" type="date" value={form.purchaseDate} onChange={(e) => updateField('purchaseDate', e.target.value)} className={fieldClass(fieldErrors, 'purchaseDate')} />
                {fieldErrors.purchaseDate ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.purchaseDate}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink">
                Purchase Cost
                <input id="equipment-purchaseCost" value={form.purchaseCost} onChange={(e) => updateField('purchaseCost', e.target.value)} className={fieldClass(fieldErrors, 'purchaseCost')} />
                {fieldErrors.purchaseCost ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.purchaseCost}</span> : null}
              </label>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Supplier
                <input value={form.supplier} onChange={(e) => updateField('supplier', e.target.value)} className={fieldClass(fieldErrors, 'supplier')} />
              </label>

              <label className="block text-sm font-medium text-ink">
                Location
                <input value={form.location} onChange={(e) => updateField('location', e.target.value)} className={fieldClass(fieldErrors, 'location')} />
              </label>
              <label className="block text-sm font-medium text-ink">
                Rack Number
                <input value={form.rackNumber} onChange={(e) => updateField('rackNumber', e.target.value)} className={fieldClass(fieldErrors, 'rackNumber')} />
              </label>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Barcode Value (optional)
                <input value={form.barcodeValue} onChange={(e) => updateField('barcodeValue', e.target.value)} className={fieldClass(fieldErrors, 'barcodeValue')} />
              </label>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Maintenance
                <textarea value={form.maintenance} onChange={(e) => updateField('maintenance', e.target.value)} rows={2} className={fieldClass(fieldErrors, 'maintenance')} />
              </label>

              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Remarks
                <textarea value={form.remarks} onChange={(e) => updateField('remarks', e.target.value)} rows={2} className={fieldClass(fieldErrors, 'remarks')} />
              </label>

              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-ink">Equipment Image {!editingId ? '*' : ''}</p>
                <ImageUploader
                  previewUrl={imageFile ? URL.createObjectURL(imageFile) : imagePreview || ''}
                  onChange={(f) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload equipment images');
                      return;
                    }
                    setImageFile(f);
                    setImagePreview(URL.createObjectURL(f));
                    if (fieldErrors.image) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.image;
                        return next;
                      });
                    }
                  }}
                  label="Upload equipment image (JPG/PNG/WEBP)"
                />
                {fieldErrors.image ? <span className="mt-1 block text-xs text-red-500">{fieldErrors.image}</span> : null}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : editingId ? 'Update Equipment' : 'Create Equipment'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete this equipment?"
        message="This will permanently delete the record."
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
        <EntryEquipmentProfileModal equipment={profile} onClose={() => setProfileOpen(false)} />
      ) : null}
    </div>
  );
}


