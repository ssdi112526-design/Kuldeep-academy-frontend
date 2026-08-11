import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash, FaPlay, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import VideoUploader from './VideoUploader';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import { useToast } from '../../context/ToastContext';
import { usePermissions } from '../../context/PermissionContext';
import { videoService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import { formatBytes } from '../../utils/videoUtils';
import VideoPlayerModal from '../ui/VideoPlayerModal';
import AccessDenied from './AccessDenied';
import FormErrorBanner from './FormErrorBanner';
import { getApiErrorMessage } from '../../utils/apiError';
import { clearPublicCache } from '../../utils/publicCache';

const CATEGORIES = [
  'Dangal Highlights',
  'Championship Matches',
  'Training Sessions',
  'Dab Pach Techniques',
  'Traditional Kushti',
  'Fitness Training',
  'Coach Guidance',
  'Student Achievements',
  'Events',
  'Motivation',
];

const EMPTY = {
  title: '',
  subtitle: '',
  description: '',
  category: CATEGORIES[0],
  coachName: '',
  duration: '',
  displayOrder: 0,
  isFeatured: false,
  status: 'published',
};

export default function VideosPanel({ onChanged }) {
  const toast = useToast();
  const { can, canModule } = usePermissions();
  const canView = canModule('videos');
  const canCreate = can('videos.create');
  const canEdit = can('videos.edit');
  const canDelete = can('videos.delete');
  const canUpload = can('videos.upload');
  const canPublish = can('videos.publish');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [videoFile, setVideoFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [formError, setFormError] = useState('');
  const [confirm, setConfirm] = useState({ open: false, id: null, title: '', loading: false });
  const [preview, setPreview] = useState(null);
  const [stats, setStats] = useState(null);
  const searchRef = useRef(debouncedSearch);
  const savingLock = useRef(false);

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await videoService.list({
        page,
        limit: pagination.limit,
        status: statusFilter,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      const { videos, pagination: p } = res.data.data;
      setItems(videos);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await videoService.stats();
      setStats(res.data.data);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    fetchStats();
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
  }, [pagination.page, pagination.limit, debouncedSearch, statusFilter]);

  if (!canView) return <AccessDenied />;

  const openCreate = () => {
    if (!canCreate) return;
    setEditing(null);
    setForm({ ...EMPTY, status: canPublish ? 'published' : 'draft' });
    setVideoFile(null);
    setFormError('');
    setUploadProgress(null);
    setModalOpen(true);
  };

  const openEdit = (item) => {
    if (!canEdit) return;
    setEditing(item);
    setForm({
      title: item.title,
      subtitle: item.subtitle || '',
      description: item.description,
      category: item.category,
      coachName: item.coachName || '',
      duration: item.duration || '',
      displayOrder: item.displayOrder ?? 0,
      isFeatured: !!item.isFeatured,
      status: item.status || 'draft',
    });
    setVideoFile(null);
    setFormError('');
    setUploadProgress(null);
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (savingLock.current || saving) return;
    if (editing && !canEdit) {
      toast.error('You do not have permission to edit videos');
      return;
    }
    if (!editing && !canCreate) {
      toast.error('You do not have permission to create videos');
      return;
    }
    if (videoFile && !canUpload) {
      toast.error('You do not have permission to upload videos');
      return;
    }
    if (!canPublish && form.status !== (editing?.status || 'draft')) {
      toast.error('You do not have permission to publish videos');
      return;
    }
    if (!form.title.trim() || !form.description.trim()) {
      const message = 'Title and description are required';
      setFormError(message);
      toast.error(message);
      return;
    }
    if (!editing && !videoFile) {
      const message = 'Please upload an MP4 or WebM video file';
      setFormError(message);
      toast.error(message);
      return;
    }
    if (editing && !videoFile && !editing.videoFile) {
      const message = 'Please upload an MP4 or WebM video file';
      setFormError(message);
      toast.error(message);
      return;
    }
    savingLock.current = true;
    setSaving(true);
    setUploadProgress(videoFile ? 0 : null);
    try {
      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        category: form.category,
        coachName: form.coachName.trim(),
        duration: form.duration.trim(),
        displayOrder: form.displayOrder,
        isFeatured: form.isFeatured,
        status: form.status,
      };
      const progressOpts = {
        video: videoFile,
        onUploadProgress: videoFile
          ? (evt) => {
              if (!evt.total) return;
              setUploadProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          : undefined,
      };
      if (editing) await videoService.update(editing._id || editing.id, payload, progressOpts);
      else await videoService.create(payload, progressOpts);
      clearPublicCache('videos');
      toast.success(editing ? 'Video updated successfully' : 'Video uploaded successfully');
      setModalOpen(false);
      setVideoFile(null);
      setUploadProgress(null);
      fetchList(pagination.page);
      fetchStats();
      onChanged?.();
    } catch (err) {
      const message = getApiErrorMessage(err, 'Upload failed');
      setFormError(message);
      toast.error(message);
      setUploadProgress(null);
    } finally {
      setSaving(false);
      savingLock.current = false;
    }
  };

  const toggleStatus = async (item) => {
    if (!canPublish) {
      toast.error('You do not have permission to publish videos');
      return;
    }
    try {
      await videoService.update(item._id || item.id, {
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status === 'published' ? 'draft' : 'published',
        isFeatured: item.isFeatured,
        displayOrder: item.displayOrder,
      });
      clearPublicCache('videos');
      fetchList(pagination.page);
      fetchStats();
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Status update failed');
    }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete videos');
      return;
    }
    const deleteId = confirm.id;
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await videoService.remove(deleteId);
      // Remove from UI immediately; keep list if API failed (catch below)
      setItems((prev) => prev.filter((v) => (v._id || v.id) !== deleteId));
      clearPublicCache('videos');
      toast.success('Video deleted');
      setConfirm({ open: false, id: null, title: '', loading: false });
      await fetchList(pagination.page);
      fetchStats();
      onChanged?.();
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Delete failed'));
      setConfirm((s) => ({ ...s, loading: false }));
      // Restore list from server — do not leave UI out of sync on failure
      fetchList(pagination.page);
    }
  };

  return (
    <div>
      {stats ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {[
              ['Total Videos', stats.totalVideos],
              ['Published', stats.publishedVideos],
              ['Draft', stats.draftVideos],
              ['Featured', stats.featuredVideos],
              ['Storage', formatBytes(stats.totalStorageBytes)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-slate-100 bg-white p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
                <p className="mt-1 text-xl font-bold text-ink">{value}</p>
              </div>
            ))}
          </div>
          {stats.recentUploads?.length ? (
            <div className="mb-6 rounded-xl border border-slate-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recent Uploads</p>
              <ul className="mt-3 space-y-2">
                {stats.recentUploads.map((v) => (
                  <li key={v._id || v.id} className="flex items-center gap-3 text-sm">
                    <img
                      src={mediaUrl(v.thumbnail)}
                      alt=""
                      className="h-10 w-16 rounded object-cover bg-slate-100"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{v.title}</p>
                      <p className="text-xs text-muted">
                        {v.status} · {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-IN') : ''}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <SearchBar value={search} onChange={setSearch} placeholder="Search videos..." />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination((prev) => ({ ...prev, page: 1 }));
            }}
            className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm"
          >
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
        {canCreate ? (
          <Button onClick={openCreate} className="rounded-lg px-4 py-2.5 text-sm">
            <FaPlus /> Upload Video
          </Button>
        ) : null}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100 bg-white">
        {loading ? (
          <div className="space-y-3 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted">No videos yet. Upload your first video.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Thumb</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item._id} className="border-t border-slate-50">
                  <td className="px-4 py-3">
                    <img
                      src={mediaUrl(item.thumbnail)}
                      alt=""
                      className="h-12 w-20 rounded-md object-cover"
                      loading="lazy"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted">
                      {item.isFeatured ? 'Featured · ' : ''}
                      {item.slug}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-muted">{item.category}</td>
                  <td className="px-4 py-3 text-muted">{item.displayOrder}</td>
                  <td className="px-4 py-3">
                    {canPublish ? (
                      <button
                        type="button"
                        onClick={() => toggleStatus(item)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                          item.status === 'published'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.status === 'published' ? <FaToggleOn /> : <FaToggleOff />}
                        {item.status}
                      </button>
                    ) : (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        item.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {item.status}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setPreview(item)}
                      className="mr-2 rounded-lg p-2 text-amber-600 hover:bg-amber-50"
                      aria-label="Preview"
                    >
                      <FaPlay />
                    </button>
                    {canEdit ? (
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="mr-2 rounded-lg p-2 text-brand hover:bg-brand/10"
                        aria-label="Edit"
                      >
                        <FaEdit />
                      </button>
                    ) : null}
                    {canDelete ? (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirm({
                            open: true,
                            id: item._id || item.id,
                            title: item.title || 'this video',
                            loading: false,
                          })
                        }
                        className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <FaTrash />
                      </button>
                    ) : null}
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
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">{editing ? 'Edit Video' : 'Upload Video'}</h3>
            <FormErrorBanner message={formError} />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Title
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Subtitle
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink sm:col-span-2">
                Description
                <textarea
                  required
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Category
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium text-ink">
                Coach Name
                <input
                  value={form.coachName}
                  onChange={(e) => setForm({ ...form, coachName: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Duration
                <input
                  placeholder="Auto-detect from video (optional)"
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Display Order
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-medium text-ink">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                />
                Featured Video
              </label>
              {canPublish ? (
                <label className="block text-sm font-medium text-ink">
                  Status
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                </label>
              ) : null}
              <div className="sm:col-span-2">
                <p className="mb-2 text-sm font-medium text-ink">Video file (required)</p>
                <VideoUploader
                  file={videoFile}
                  currentPath={editing?.videoFile || ''}
                  progress={uploadProgress}
                  disabled={saving}
                  onChange={(file) => {
                    if (!canUpload) {
                      toast.error('You do not have permission to upload videos');
                      return;
                    }
                    setVideoFile(file);
                    setFormError('');
                  }}
                  onClear={() => {
                    if (saving) return;
                    setVideoFile(null);
                    setUploadProgress(null);
                  }}
                  label="Upload Video"
                />
                <p className="mt-2 text-xs text-muted">
                  Direct file upload only (no URL). Thumbnail is generated automatically from the video.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={saving}
                onClick={() => {
                  if (saving) return;
                  setModalOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? uploadProgress != null && uploadProgress < 100
                    ? `Uploading ${uploadProgress}%…`
                    : 'Saving…'
                  : editing
                    ? 'Save changes'
                    : 'Upload & Save'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Are you sure you want to delete this?"
        message={
          confirm.title
            ? `"${confirm.title}" will be permanently removed from storage and the website.`
            : 'The video file and thumbnail will be removed permanently.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        danger
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => {
          if (confirm.loading) return;
          setConfirm({ open: false, id: null, title: '', loading: false });
        }}
      />

      <VideoPlayerModal video={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
