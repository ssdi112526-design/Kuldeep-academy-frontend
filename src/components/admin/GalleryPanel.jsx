import { useEffect, useRef, useState } from 'react';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { galleryService } from '../../services';
import useDebouncedValue from '../../hooks/useDebouncedValue';
import { mediaUrl } from '../../utils/mediaUrl';
import SearchBar from './SearchBar';
import Pagination from './Pagination';
import ImageUploader from './ImageUploader';

const EMPTY = { title: '', category: 'General', displayOrder: 0 };

export default function GalleryPanel({ onChanged }) {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 400);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [files, setFiles] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState({ open: false, id: null, loading: false });
  const searchRef = useRef(debouncedSearch);

  const fetchList = async (page = pagination.page) => {
    setLoading(true);
    setError('');
    try {
      const res = await galleryService.list({
        page,
        limit: pagination.limit,
        ...(debouncedSearch.trim() && { search: debouncedSearch.trim() }),
      });
      const { gallery, pagination: p } = res.data.data;
      setItems(gallery);
      setPagination((prev) => ({ ...prev, ...p }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

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
    setEditing(null);
    setForm(EMPTY);
    setFiles([]);
    setFile(null);
    setPreview('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      title: item.title || '',
      category: item.category || 'General',
      displayOrder: item.displayOrder ?? 0,
    });
    setFiles([]);
    setFile(null);
    setPreview(mediaUrl(item.image));
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing && (!files || files.length === 0)) {
      toast.error('Please upload at least one image');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || 'General',
        displayOrder: form.displayOrder,
      };
      if (editing) await galleryService.update(editing._id, payload, file);
      else await galleryService.create(payload, files);
      toast.success(editing ? 'Gallery item updated' : 'Images uploaded');
      setModalOpen(false);
      fetchList(pagination.page);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setConfirm((s) => ({ ...s, loading: true }));
    try {
      await galleryService.remove(confirm.id);
      toast.success('Image deleted');
      setConfirm({ open: false, id: null, loading: false });
      await fetchList(pagination.page);
      onChanged?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
      setConfirm((s) => ({ ...s, loading: false }));
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} placeholder="Search gallery..." />
        <Button onClick={openCreate} className="rounded-lg px-4 py-2.5 text-sm">
          <FaPlus /> Upload Images
        </Button>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 p-10 text-center text-sm text-muted">
            No gallery images yet. Upload your first set.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <article key={item._id} className="group overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm">
                <div className="relative aspect-square overflow-hidden">
                  <img src={mediaUrl(item.image)} alt={item.title || ''} className="h-full w-full object-cover" loading="lazy" />
                  <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-ink/70 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => openEdit(item)}
                      className="rounded-full bg-white p-2 text-brand"
                      aria-label="Edit"
                    >
                      <FaEdit size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ open: true, id: item._id, loading: false })}
                      className="rounded-full bg-white p-2 text-red-500"
                      aria-label="Delete"
                    >
                      <FaTrash size={12} />
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-medium text-ink">{item.title || 'Untitled'}</p>
                  <p className="text-xs text-muted">
                    {item.category} · Order {item.displayOrder}
                  </p>
                </div>
              </article>
            ))}
          </div>
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
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-ink">{editing ? 'Edit Gallery Item' : 'Upload Gallery Images'}</h3>
            <div className="mt-4 space-y-4">
              <label className="block text-sm font-medium text-ink">
                Title (optional)
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-brand"
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Category
                <input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
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
              {editing ? (
                <ImageUploader
                  previewUrl={file ? URL.createObjectURL(file) : preview}
                  onChange={(f) => {
                    setFile(f);
                    setPreview(URL.createObjectURL(f));
                  }}
                />
              ) : (
                <ImageUploader
                  multiple
                  value={files}
                  onChange={(list) => setFiles(list)}
                  label="Drag & drop images or click to browse"
                />
              )}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Delete this image?"
        message="The image will be removed from storage permanently."
        confirmLabel="Delete"
        danger
        loading={confirm.loading}
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, loading: false })}
      />
    </div>
  );
}
