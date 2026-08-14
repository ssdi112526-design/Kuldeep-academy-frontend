import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaUsers, FaMedal, FaAward } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import ImageUploader from './ImageUploader';
import Pagination from './Pagination';
import SearchBar from './SearchBar';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import StatCard from './StatCard';
import MedalBadge from '../ui/MedalBadge';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { playerAchievementService, tournamentService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearPublicCache } from '../../utils/publicCache';
import { MEDAL_OPTIONS } from '../../utils/medals';
import {
  fieldClass,
  firstErrorMessage,
  optionalText,
  requiredText,
  validateDate,
  validateInt4,
  validateRequiredSelect,
} from '../../utils/formValidation';

const EMPTY = {
  playerName: '',
  title: '',
  description: '',
  achievementType: '',
  tournamentId: '',
  tournamentName: '',
  achievedOn: '',
  year: '',
  medal: 'Gold',
  result: '',
  showOnWebsite: true,
};

export default function PlayerAchievementsPanel({
  initialMedalFilter = 'all',
  focusId = null,
  focusToken = null,
} = {}) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('player_achievements') || canModule('achievements');
  const canCreate = can('player_achievements.create') || can('achievements.create');
  const canEdit = can('player_achievements.edit') || can('achievements.edit');
  const canDelete = can('player_achievements.delete') || can('achievements.delete');

  const [items, setItems] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [medalFilter, setMedalFilter] = useState(initialMedalFilter || 'all');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
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
      const res = await playerAchievementService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
        ...(medalFilter !== 'all' && { medal: medalFilter }),
      });
      const { achievements, pagination: p, summary: s } = res.data.data;
      setItems(achievements || []);
      setSummary(s || null);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load achievements'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    tournamentService
      .list({ page: 1, limit: 200 })
      .then((res) => setTournaments(res.data?.data?.tournaments || res.data?.data?.items || []))
      .catch(() => setTournaments([]));
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
  }, [pagination.page, pagination.limit, debouncedSearch, medalFilter]);

  const openCreate = () => {
    if (!canCreate) return;
    setEditing(null);
    setForm(EMPTY);
    setFieldErrors({});
    setImageFile(null);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canView) return;
    setEditing(item);
    setForm({
      playerName:
        item.playerName ||
        item.displayPlayerName ||
        item.student?.fullName ||
        '',
      title: item.title || '',
      description: item.description || '',
      achievementType: item.achievementType || '',
      tournamentId: item.tournamentId || item.tournament?.id || '',
      tournamentName: item.tournamentName || item.tournament?.name || '',
      achievedOn: item.achievedOn ? String(item.achievedOn).slice(0, 10) : '',
      year: item.year ?? '',
      medal: item.medal || 'Gold',
      result: item.result || '',
      showOnWebsite: item.showOnWebsite !== false,
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

  const handleTournamentSelect = (tournamentId) => {
    const t = tournaments.find((x) => (x._id || x.id) === tournamentId);
    setForm((f) => ({
      ...f,
      tournamentId,
      tournamentName: t?.name || f.tournamentName,
      year: f.year || (t?.eventDate ? String(new Date(t.eventDate).getUTCFullYear()) : f.year),
    }));
    if (fieldErrors.tournamentId) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.tournamentId;
        return next;
      });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const errors = {};
    const playerName = requiredText(form.playerName, 'Player name');
    const title = requiredText(form.title, 'Title');
    const medal = validateRequiredSelect(form.medal, 'Medal');
    const description = optionalText(form.description, 'Description', 5000);
    const achievedOn = validateDate(form.achievedOn, 'Date', { required: false });
    const year = form.year === '' || form.year === null || form.year === undefined
      ? ''
      : validateInt4(form.year, 'Year', { required: false, min: 1900, max: 2100 });
    if (playerName) errors.playerName = playerName;
    if (title) errors.title = title;
    if (medal) errors.medal = medal;
    if (description) errors.description = description;
    if (achievedOn) errors.achievedOn = achievedOn;
    if (year) errors.year = year;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const message = firstErrorMessage(errors, [
        'playerName',
        'title',
        'medal',
        'description',
        'achievedOn',
        'year',
      ]);
      setFormError(message);
      toast.error(message);
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      const payload = {
        playerName: form.playerName.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        achievementType: form.achievementType.trim(),
        tournamentId: form.tournamentId || '',
        tournamentName: form.tournamentId ? '' : form.tournamentName.trim(),
        achievedOn: form.achievedOn || '',
        year: form.year || '',
        medal: form.medal,
        result: form.result.trim(),
        showOnWebsite: form.showOnWebsite,
      };
      if (editing) {
        await playerAchievementService.update(editing._id || editing.id, payload, imageFile);
        toast.success('Achievement updated');
      } else {
        await playerAchievementService.create(payload, imageFile);
        toast.success(
          form.showOnWebsite
            ? 'Achievement added — visible on the public website'
            : 'Achievement added — hidden from the public website'
        );
      }
      clearPublicCache();
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
      await playerAchievementService.remove(confirm.id);
      clearPublicCache();
      toast.success('Achievement deleted');
      setConfirm({ open: false, id: null, loading: false });
      fetchList(pagination.page);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((c) => ({ ...c, loading: false }));
    }
  };

  const toggleWebsite = async (item) => {
    if (!canEdit) return;
    const id = item._id || item.id;
    const next = item.showOnWebsite === false;
    setItems((prev) =>
      prev.map((row) =>
        (row._id || row.id) === id ? { ...row, showOnWebsite: next } : row
      )
    );
    try {
      await playerAchievementService.update(id, {
        playerName:
          item.playerName ||
          item.displayPlayerName ||
          item.student?.fullName ||
          '',
        title: item.title || '',
        showOnWebsite: next,
      });
      clearPublicCache();
      toast.success(next ? 'Now visible on website' : 'Hidden from website');
    } catch (err) {
      setItems((prev) =>
        prev.map((row) =>
          (row._id || row.id) === id ? { ...row, showOnWebsite: !next } : row
        )
      );
      toast.error(getApiErrorMessage(err, 'Could not update website visibility'));
    }
  };

  const medals = summary?.medals || { Gold: 0, Silver: 0, Bronze: 0, Other: 0 };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="Players"
          value={summary?.playersWithAchievements ?? 0}
          icon={FaUsers}
          loading={loading}
          iconClass="bg-sky-50 text-sky-700"
        />
        <StatCard
          label="Tournaments"
          value={summary?.tournamentsRepresented ?? 0}
          icon={FaAward}
          loading={loading}
          iconClass="bg-violet-50 text-violet-700"
        />
        <button type="button" className="text-left" onClick={() => setMedalFilter('all')}>
          <StatCard
            label="Total"
            value={summary?.total ?? pagination.total ?? 0}
            icon={FaMedal}
            loading={loading}
            iconClass="bg-slate-100 text-slate-700"
            className={medalFilter === 'all' ? 'ring-2 ring-brand/30' : ''}
          />
        </button>
        <button type="button" className="text-left" onClick={() => setMedalFilter('Gold')}>
          <StatCard
            label="Gold"
            value={medals.Gold}
            icon={FaMedal}
            loading={loading}
            iconClass="bg-amber-50 text-amber-600"
            className={medalFilter === 'Gold' ? 'ring-2 ring-amber-300' : ''}
          />
        </button>
        <button type="button" className="text-left" onClick={() => setMedalFilter('Silver')}>
          <StatCard
            label="Silver"
            value={medals.Silver}
            icon={FaMedal}
            loading={loading}
            iconClass="bg-slate-100 text-slate-500"
            className={medalFilter === 'Silver' ? 'ring-2 ring-slate-300' : ''}
          />
        </button>
        <button type="button" className="text-left" onClick={() => setMedalFilter('Bronze')}>
          <StatCard
            label="Bronze"
            value={medals.Bronze}
            icon={FaMedal}
            loading={loading}
            iconClass="bg-orange-50 text-orange-700"
            className={medalFilter === 'Bronze' ? 'ring-2 ring-orange-300' : ''}
          />
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by player, title, tournament…" />
          <select
            value={medalFilter}
            onChange={(e) => {
              setMedalFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="all">All medals</option>
            {MEDAL_OPTIONS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {canCreate ? (
          <Button onClick={openCreate} className="inline-flex items-center gap-2">
            <FaPlus /> Add Achievement
          </Button>
        ) : null}
      </div>

      {error ? <FormErrorBanner message={error} /> : null}

      {loading ? (
        <p className="text-sm text-muted">Loading achievements…</p>
      ) : !items.length ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-sm text-muted">
          No achievements yet. Add medals with player name and image, then enable “Show on website” to publish.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Tournament</th>
                <th className="px-4 py-3">Medal</th>
                <th className="px-4 py-3">Website</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id || item.id} className="border-b border-slate-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.image ? (
                        <img src={mediaUrl(item.image)} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : item.student?.photo ? (
                        <img src={mediaUrl(item.student.photo)} alt="" className="h-8 w-8 rounded-lg object-cover" />
                      ) : null}
                      <div>
                        <p className="font-medium text-ink">
                          {item.displayPlayerName || item.playerName || item.student?.fullName || '—'}
                        </p>
                        {item.student?.registrationNumber ? (
                          <p className="text-xs text-muted">{item.student.registrationNumber}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted">{item.achievementType || ''}</p>
                  </td>
                  <td className="px-4 py-3 text-ink">
                    {item.tournament?.name || item.tournamentName || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <MedalBadge medal={item.medal} position="inline" size="sm" />
                    {item.result ? <p className="mt-1 text-xs text-muted">{item.result}</p> : null}
                  </td>
                  <td className="px-4 py-3">
                    <label className="inline-flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.showOnWebsite !== false}
                        disabled={!canEdit}
                        onChange={() => toggleWebsite(item)}
                        className="rounded border-slate-300 text-brand focus:ring-brand"
                        title="Show on website"
                      />
                      <span
                        className={`text-[11px] font-semibold ${
                          item.showOnWebsite !== false ? 'text-emerald-700' : 'text-slate-500'
                        }`}
                      >
                        {item.showOnWebsite !== false ? 'Visible' : 'Hidden'}
                      </span>
                    </label>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {item.achievedOn
                      ? new Date(item.achievedOn).toLocaleDateString()
                      : item.year || '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      {canEdit ? (
                        <button
                          type="button"
                          className="rounded-lg p-2 text-brand hover:bg-brand/10"
                          onClick={() => openEdit(item)}
                        >
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        pagination={pagination}
        onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setPagination((prev) => ({ ...prev, limit, page: 1 }))}
      />

      {modalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 p-4">
          <form
            onSubmit={handleSave}
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">{editing ? 'Edit Achievement' : 'Add Achievement'}</h3>
            <p className="mt-1 text-xs text-muted">
              Use the checkbox below to control whether this achievement appears on the public website.
            </p>
            <div className="mt-3">
              <FormErrorBanner message={formError} />
            </div>
            <div className="mt-4 grid gap-3">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Player name *</span>
                <input
                  className={fieldClass(fieldErrors, 'playerName')}
                  value={form.playerName}
                  onChange={(e) => updateField('playerName', e.target.value)}
                  placeholder="Enter player name"
                />
                {fieldErrors.playerName ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.playerName}</span>
                ) : null}
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Title *</span>
                <input
                  className={fieldClass(fieldErrors, 'title')}
                  value={form.title}
                  onChange={(e) => updateField('title', e.target.value)}
                />
                {fieldErrors.title ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.title}</span>
                ) : null}
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Description</span>
                <textarea
                  className={fieldClass(fieldErrors, 'description')}
                  rows={3}
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                />
                {fieldErrors.description ? (
                  <span className="mt-1 block text-xs text-red-500">{fieldErrors.description}</span>
                ) : null}
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-ink">Tournament</span>
                <select
                  className={fieldClass(fieldErrors, 'tournamentId')}
                  value={form.tournamentId}
                  onChange={(e) => handleTournamentSelect(e.target.value)}
                >
                  <option value="">Select tournament (or type custom below)</option>
                  {tournaments.map((t) => (
                    <option key={t._id || t.id} value={t._id || t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              {!form.tournamentId ? (
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Custom tournament name</span>
                  <input
                    className={fieldClass(fieldErrors, 'tournamentName')}
                    value={form.tournamentName}
                    onChange={(e) => updateField('tournamentName', e.target.value)}
                    placeholder="If not in Tournament Records"
                  />
                </label>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Medal *</span>
                  <select
                    className={fieldClass(fieldErrors, 'medal')}
                    value={form.medal}
                    onChange={(e) => updateField('medal', e.target.value)}
                  >
                    {MEDAL_OPTIONS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.medal ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.medal}</span>
                  ) : null}
                  <div className="mt-2">
                    <MedalBadge medal={form.medal} position="inline" size="sm" />
                  </div>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Result</span>
                  <input
                    className={fieldClass(fieldErrors, 'result')}
                    value={form.result}
                    onChange={(e) => updateField('result', e.target.value)}
                    placeholder="1st Position / Champion"
                  />
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Date</span>
                  <input
                    type="date"
                    className={fieldClass(fieldErrors, 'achievedOn')}
                    value={form.achievedOn}
                    onChange={(e) => updateField('achievedOn', e.target.value)}
                  />
                  {fieldErrors.achievedOn ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.achievedOn}</span>
                  ) : null}
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-ink">Year</span>
                  <input
                    type="number"
                    className={fieldClass(fieldErrors, 'year')}
                    value={form.year}
                    onChange={(e) => updateField('year', e.target.value)}
                  />
                  {fieldErrors.year ? (
                    <span className="mt-1 block text-xs text-red-500">{fieldErrors.year}</span>
                  ) : null}
                </label>
                <label className="text-sm sm:col-span-2">
                  <span className="mb-1 block font-medium text-ink">Type</span>
                  <input
                    className={fieldClass(fieldErrors, 'achievementType')}
                    value={form.achievementType}
                    onChange={(e) => updateField('achievementType', e.target.value)}
                    placeholder="Medal / Title / Certificate"
                  />
                </label>
              </div>
              <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.showOnWebsite}
                  onChange={(e) => updateField('showOnWebsite', e.target.checked)}
                  className="mt-0.5 rounded border-slate-300"
                />
                <span>
                  <span className="block font-medium text-ink">Show on website</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    When enabled, this achievement appears on the public Champions Wall.
                  </span>
                </span>
              </label>
              <ImageUploader
                label="Achievement Image (shown on public website with medal badge)"
                value={imageFile}
                onChange={setImageFile}
                previewUrl={editing?.image ? mediaUrl(editing.image) : null}
              />
              {(imageFile || editing?.image) && form.medal ? (
                <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-[#1A1410]">
                  <div className="aspect-[4/3]">
                    <img
                      src={
                        imageFile
                          ? URL.createObjectURL(imageFile)
                          : mediaUrl(editing.image)
                      }
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <MedalBadge medal={form.medal} size="md" />
                  <p className="absolute bottom-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] text-white">
                    Public preview
                  </p>
                </div>
              ) : null}
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

      <ConfirmDialog
        open={confirm.open}
        title="Delete achievement?"
        message="This will permanently remove the achievement from Admin and the public website."
        confirmLabel="Delete"
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
