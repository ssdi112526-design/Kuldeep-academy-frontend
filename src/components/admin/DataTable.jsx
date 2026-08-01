import { useEffect, useRef } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { PanelLoader } from '../ui/PageLoader';
import EmptyState from './EmptyState';

function HeaderCheckbox({ checked, indeterminate, onChange }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/40"
      aria-label="Select all rows on this page"
    />
  );
}

export default function DataTable({
  contacts,
  loading,
  error,
  page,
  limit,
  selectedIds,
  onToggleRow,
  onToggleAllOnPage,
  onView,
  onDeleteOne,
  canSelect,
  canDelete,
}) {
  if (loading) {
    return <PanelLoader message="Loading inquiries..." />;
  }

  if (error) {
    return (
      <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (contacts.length === 0) {
    return <EmptyState message="No records found." />;
  }

  const pageIds = contacts.map((c) => c._id);
  const selectedOnPage = pageIds.filter((id) => selectedIds.has(id)).length;
  const allSelected = selectedOnPage === pageIds.length;
  const someSelected = selectedOnPage > 0 && !allSelected;

  return (
    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-muted">
          <tr>
            {canSelect ? (
              <th className="px-4 py-3">
                <HeaderCheckbox
                  checked={allSelected}
                  indeterminate={someSelected}
                  onChange={onToggleAllOnPage}
                />
              </th>
            ) : null}
            <th className="px-4 py-3">S.No.</th>
            <th className="px-4 py-3">Date &amp; Time</th>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Phone</th>
            <th className="px-4 py-3">Message</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, index) => (
            <tr key={contact._id} className="border-b border-slate-50 align-top hover:bg-slate-50/60">
              {canSelect ? (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(contact._id)}
                    onChange={() => onToggleRow(contact._id)}
                    className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/40"
                    aria-label={`Select ${contact.fullName}`}
                  />
                </td>
              ) : null}
              <td className="px-4 py-3 text-muted">{(page - 1) * limit + index + 1}</td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {new Intl.DateTimeFormat('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                  timeZone: 'Asia/Kolkata',
                }).format(new Date(contact.createdAt))}
              </td>
              <td className="px-4 py-3 font-medium text-ink">{contact.fullName || '0'}</td>
              <td className="px-4 py-3 text-muted">{contact.email || '0'}</td>
              <td className="px-4 py-3 text-muted">{contact.phone || '—'}</td>
              <td className="max-w-xs truncate px-4 py-3 text-muted" title={contact.message}>
                {contact.message || '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onView(contact)}
                    aria-label="View details"
                    className="text-brand hover:text-brand-dark"
                  >
                    <FaEye />
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => onDeleteOne(contact._id)}
                      aria-label="Delete"
                      className="text-red-500 hover:text-red-700"
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
  );
}
