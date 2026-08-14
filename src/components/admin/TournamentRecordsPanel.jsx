import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaUserPlus } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import ImageUploader from './ImageUploader';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { entryService, tournamentService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  fieldClass,
  firstErrorMessage,
  optionalText,
  requiredText,
  validateDate,
} from '../../utils/formValidation';

const EMPTY_TOURNAMENT = {
  name: '',
  eventDate: '',
  location: '',
  category: '',
  remarks: '',
};

const EMPTY_RESULT = {
  studentId: '',
  category: '',
  result: '',
  position: '',
  medal: '',
  remarks: '',
};

export default function TournamentRecordsPanel({ focusId = null, focusToken = null } = {}) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('tournaments');
  const canCreate = can('tournaments.create');
  const canEdit = can('tournaments.edit');
  const canDelete = can('tournaments.delete');

  const [items, setItems] = useState([]);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_TOURNAMENT);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const [resultModal, setResultModal] = useState({ open: false, tournament: null });
  const [resultForm, setResultForm] = useState(EMPTY_RESULT);
  const [resultImage, setResultImage] = useState(null);
  const [resultSaving, setResultSaving] = useState(false);
  const searchRef = useRef(debouncedSearch);

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

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await tournamentService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      const { tournaments, pagination: p } = res.data.data;
      setItems(tournaments || []);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load tournaments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    entryService.students
      .list({ page: 1, limit: 200, status: 'Active' })
      .then((res) => setPlayers(res.data?.data?.students || res.data?.data?.items || []))
      .catch(() => setPlayers([]));
  }, []);

  useEffect(() => {
    if (searchRef.current !== debouncedSearch && pagination.page !== 1) {
      searchRef.current = debouncedSearch;
      setPagination((prev) => ({ ...prev, page: 1 }));
      return;
    }
    searchRef.current = debouncedSearch;
    fetchList(pagination.page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, debouncedSearch]);

  const openCreate = () => {
    if (!canCreate) return;
    setEditing(null);
    setForm(EMPTY_TOURNAMENT);
    setFieldErrors({});
    setImageFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canView) return;
    setEditing(item);
    setForm({
      name: item.name || '',
      eventDate: item.eventDate ? String(item.eventDate).slice(0, 10) : '',
      location: item.location || '',
      category: item.category || '',
      remarks: item.remarks || '',
    });
    setFieldErrors({});
    setImageFile(null);
    setFormError('');
    setModalOpen(true);
  };

  useEffect(() => {
    if (!canView || !focusId || loading) return;
    const item = items.find((row) => (row._id || row.id) === focusId);
    if (item) openEdit(item);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusId, focusToken, items, loading, canView]);

  if (!canView) return <AccessDenied />;

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    const name = requiredText(form.name, 'Tournament name');
    const eventDate = validateDate(form.eventDate, 'Date', { required: true });
    const location = optionalText(form.location, 'Location', 500);
    const remarks = optionalText(form.remarks, 'Remarks', 2000);
    const category = optionalText(form.category, 'Category', 200);
    if (name) errors.name = name;
    if (eventDate) errors.eventDate = eventDate;
    if (location) errors.location = location;
    if (remarks) errors.remarks = remarks;
    if (category) errors.category = category;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, ['name', 'eventDate', 'category', 'location', 'remarks']);
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        name: form.name.trim(),
        eventDate: form.eventDate,
        location: form.location.trim(),
        category: form.category.trim(),
        remarks: form.remarks.trim(),
      };
      if (editing) {
        await tournamentService.update(editing._id || editing.id, payload, imageFile);
        toast.success('Tournament updated');
      } else {
        await tournamentService.create(payload, imageFile);
        toast.success('Tournament created');
      }
      setModalOpen(false);
      fetchList(editing ? pagination.page : 1);
    } catch (err) {
      const message = getApiErrorMessage(err, 'Save failed');
      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirm((c) => ({ ...c, loading: true }));
    try {
      await tournamentService.remove(confirm.id);
      toast.success('Tournament deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((c) => ({ ...c, loading: false }));
    }
  };

  const openResultModal = (tournament) => {
    if (!canEdit) return;
    setResultModal({ open: true, tournament });
    setResultForm(EMPTY_RESULT);
    setResultImage(null);
  };

  const saveResult = async (e) => {
    e.preventDefault();
    if (!resultForm.studentId) {
      toast.error('Select a player');
      return;
    }
    setResultSaving(true);
    try {
      const tid = resultModal.tournament._id || resultModal.tournament.id;
      await tournamentService.upsertResult(tid, resultForm, resultImage);
      toast.success('Player result saved');
      setResultModal({ open: false, tournament: null });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to save result'));
    } finally {
      setResultSaving(false);
    }
  };

  const removeResult = async (tournamentId, resultId) => {
    if (!canDelete) return;
    if (!window.confirm('Remove this player from the tournament?')) return;
    try {
      await tournamentService.removeResult(tournamentId, resultId);
      toast.success('Result removed');
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to remove result'));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search tournaments…" />
        {canCreate ? (
          <Button onClick={openCreate} className="inline-flex items-center gap-2">
            <FaPlus /> Add Tournament
          </Button>
        ) : null}
      </div>

      {error ? <FormErrorBanner message={error} /> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading tournament records…</p>
      ) : !items.length ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-muted">
          No tournament records yet. Add events and link player participation / results.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item._id || item.id} className="rounded-xl border border-slate-100 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  {item.image ? (
                    <img
                      src={mediaUrl(item.image)}
                      alt=""
                      className="h-20 w-28 shrink-0 rounded-lg object-cover bg-slate-100"
                      onError={(e) => {
                        e.currentTarget.src = '';
                        e.currentTarget.classList.add('hidden');
                      }}
                    />
                  ) : (
                    <div className="flex h-20 w-28 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-[11px] text-muted">
                      No image
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-ink">{item.name}</h3>
                    <p className="mt-1 text-sm text-muted">
                      {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : '—'}
                      {item.location ? ` · ${item.location}` : ''}
                      {item.category ? ` · ${item.category}` : ''}
                    </p>
                    {item.remarks ? <p className="mt-2 text-sm text-ink/80">{item.remarks}</p> : null}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {canEdit ? (
                    <Button variant="secondary" className="text-sm" onClick={() => openResultModal(item)}>
                      <FaUserPlus className="mr-1" /> Add Player
                    </Button>
                  ) : null}
                  {canEdit ? (
                    <button type="button" className="rounded-lg p-2 text-brand hover:bg-brand/10" onClick={() => openEdit(item)}>
                      <FaEdit />
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button
                      type="button"
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      onClick={() => setConfirm({ open: true, id: item._id || item.id, loading: false })}
                    >
                      <FaTrash />
                    </button>
                  ) : null}
                </div>
              </div>

              {item.results?.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase tracking-wide text-muted">
                      <tr>
                        <th className="py-2 pr-3">Player</th>
                        <th className="py-2 pr-3">Category</th>
                        <th className="py-2 pr-3">Result</th>
                        <th className="py-2 pr-3">Position</th>
                        <th className="py-2 pr-3">Medal</th>
                        <th className="py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {item.results.map((r) => (
                        <tr key={r._id || r.id} className="border-t border-slate-50">
                          <td className="py-2 pr-3 font-medium text-ink">
                            <div className="flex items-center gap-2">
                              {r.image ? (
                                <img
                                  src={mediaUrl(r.image)}
                                  alt=""
                                  className="h-8 w-8 rounded object-cover"
                                  onError={(e) => {
                                    e.currentTarget.classList.add('hidden');
                                  }}
                                />
                              ) : null}
                              {r.student?.fullName || '—'}
                            </div>
                          </td>
                          <td className="py-2 pr-3">{r.category || '—'}</td>
                          <td className="py-2 pr-3">{r.result || '—'}</td>
                          <td className="py-2 pr-3">{r.position || '—'}</td>
                          <td className="py-2 pr-3">{r.medal || '—'}</td>
                          <td className="py-2 text-right">
                            {canDelete ? (
                              <button
                                type="button"
                                className="text-xs font-medium text-red-600 hover:underline"
                                onClick={() => removeResult(item._id || item.id, r._id || r.id)}
                              >
                                Remove
                              </button>
                            ) : null}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">No player results linked yet.</p>
              )}
            </article>
          ))}
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4">
          <form onSubmit={handleSave} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-ink">{editing ? 'Edit Tournament' : 'Add Tournament'}</h3>
            <div className="mt-3">
              <FormErrorBanner message={formError} />
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Tournament name *</span>
                <input
                  className={fieldClass(fieldErrors, 'name')}
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
                {fieldErrors.name ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.name}</span>
                ) : null}
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Date *</span>
                  <input
                    type="date"
                    className={fieldClass(fieldErrors, 'eventDate')}
                    value={form.eventDate}
                    onChange={(e) => updateField('eventDate', e.target.value)}
                  />
                  {fieldErrors.eventDate ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.eventDate}</span>
                  ) : null}
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Category</span>
                  <input
                    className={fieldClass(fieldErrors, 'category')}
                    value={form.category}
                    onChange={(e) => updateField('category', e.target.value)}
                  />
                  {fieldErrors.category ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.category}</span>
                  ) : null}
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Location</span>
                <input
                  className={fieldClass(fieldErrors, 'location')}
                  value={form.location}
                  onChange={(e) => updateField('location', e.target.value)}
                />
                {fieldErrors.location ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.location}</span>
                ) : null}
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Remarks</span>
                <textarea
                  className={fieldClass(fieldErrors, 'remarks')}
                  rows={3}
                  value={form.remarks}
                  onChange={(e) => updateField('remarks', e.target.value)}
                />
                {fieldErrors.remarks ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.remarks}</span>
                ) : null}
              </label>
              <ImageUploader
                label="Tournament image"
                value={imageFile}
                onChange={setImageFile}
                onClear={() => setImageFile(null)}
                previewUrl={!imageFile && editing?.image ? mediaUrl(editing.image) : null}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      {resultModal.open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4">
          <form onSubmit={saveResult} className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-bold text-ink">Add player result</h3>
            <p className="mt-1 text-sm text-muted">{resultModal.tournament?.name}</p>
            <div className="mt-4 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Player *</span>
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={resultForm.studentId}
                  onChange={(e) => setResultForm((f) => ({ ...f, studentId: e.target.value }))}
                  required
                >
                  <option value="">Select player</option>
                  {players.map((p) => (
                    <option key={p._id || p.id} value={p._id || p.id}>
                      {p.fullName} ({p.registrationNumber})
                    </option>
                  ))}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Category</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={resultForm.category}
                    onChange={(e) => setResultForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Result</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={resultForm.result}
                    onChange={(e) => setResultForm((f) => ({ ...f, result: e.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Position / Rank</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={resultForm.position}
                    onChange={(e) => setResultForm((f) => ({ ...f, position: e.target.value }))}
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Medal</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={resultForm.medal}
                    onChange={(e) => setResultForm((f) => ({ ...f, medal: e.target.value }))}
                  />
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Remarks</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  rows={2}
                  value={resultForm.remarks}
                  onChange={(e) => setResultForm((f) => ({ ...f, remarks: e.target.value }))}
                />
              </label>
              <ImageUploader
                label="Result image"
                value={resultImage}
                onChange={setResultImage}
                onClear={() => setResultImage(null)}
              />
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setResultModal({ open: false, tournament: null })}>
                Cancel
              </Button>
              <Button type="submit" disabled={resultSaving}>
                {resultSaving ? 'Saving…' : 'Save result'}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirm.open}
        title="Delete tournament?"
        message="This will also remove all linked player results for this tournament."
        confirmLabel="Delete"
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
