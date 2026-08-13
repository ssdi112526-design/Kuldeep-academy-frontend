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
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const [resultModal, setResultModal] = useState({ open: false, tournament: null });
  const [resultForm, setResultForm] = useState(EMPTY_RESULT);
  const [resultImage, setResultImage] = useState(null);
  const [resultSaving, setResultSaving] = useState(false);
  const searchRef = useRef(debouncedSearch);

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
    if (!form.name.trim() || !form.eventDate) {
      const message = 'Tournament name and date are required';
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
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-ink">{item.name}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {item.eventDate ? new Date(item.eventDate).toLocaleDateString() : '—'}
                    {item.location ? ` · ${item.location}` : ''}
                    {item.category ? ` · ${item.category}` : ''}
                  </p>
                  {item.remarks ? <p className="mt-2 text-sm text-ink/80">{item.remarks}</p> : null}
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
                          <td className="py-2 pr-3 font-medium text-ink">{r.student?.fullName || '—'}</td>
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Date *</span>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={form.eventDate}
                    onChange={(e) => setForm((f) => ({ ...f, eventDate: e.target.value }))}
                    required
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Category</span>
                  <input
                    className="w-full rounded-lg border border-slate-200 px-3 py-2"
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Location</span>
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Remarks</span>
                <textarea
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  rows={3}
                  value={form.remarks}
                  onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                />
              </label>
              <ImageUploader
                label="Tournament image"
                value={imageFile}
                onChange={setImageFile}
                previewUrl={editing?.image ? mediaUrl(editing.image) : null}
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
              <ImageUploader label="Result image" value={resultImage} onChange={setResultImage} />
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
