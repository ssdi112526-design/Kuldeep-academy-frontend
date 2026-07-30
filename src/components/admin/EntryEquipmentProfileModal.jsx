import { FaTimes } from 'react-icons/fa';
import { mediaUrl } from '../../utils/mediaUrl';

function Row({ label, value }) {
  return (
    <div className="border-b border-slate-100 py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-ink">{value || '—'}</p>
    </div>
  );
}

export default function EntryEquipmentProfileModal({ equipment, onClose }) {
  if (!equipment) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/40 px-4"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-[#FFFaf0] to-white px-6 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-ink">Equipment Profile</h2>
            <p className="mt-1 text-sm text-muted">
              Equipment ID: <span className="font-semibold text-ink">{equipment.equipmentCode || equipment.id}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-muted hover:text-ink"
          >
            <FaTimes size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-[300px_1fr]">
          <div className="rounded-xl border border-slate-100 bg-surface p-4">
            {equipment.image ? (
              <img
                src={mediaUrl(equipment.image)}
                alt={equipment.title}
                className="h-28 w-28 rounded-2xl object-cover shadow-sm bg-slate-50"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-slate-50 text-xs text-muted">
                No image
              </div>
            )}

            <p className="mt-3 text-sm font-bold text-ink">{equipment.title}</p>
            <p className="mt-1 text-xs text-muted">
              Status: {equipment.status} • Condition: {equipment.condition}
            </p>

            <div className="mt-4">
              {/* QR Code removed */}
            </div>
          </div>

          <div className="overflow-y-auto max-h-[70vh] pr-1">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Row label="Category" value={equipment.category} />
              <Row label="Location" value={equipment.location} />
              <Row label="Rack Number" value={equipment.rackNumber} />
              <Row label="Available Quantity" value={equipment.availableQuantity} />
              <Row label="Total Quantity" value={equipment.quantity} />
              <Row label="Purchase Date" value={equipment.purchaseDate ? new Date(equipment.purchaseDate).toLocaleDateString('en-IN') : ''} />
              <Row label="Supplier" value={equipment.supplier} />
              <Row label="Barcode Value" value={equipment.barcodeValue} />
            </div>

            <div className="mt-6 rounded-xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-ink">Description & Notes</h3>
              <p className="mt-2 text-sm text-muted">{equipment.description}</p>
              {equipment.maintenance ? <p className="mt-3 text-sm text-muted"><span className="font-semibold text-ink">Maintenance:</span> {equipment.maintenance}</p> : null}
              {equipment.remarks ? <p className="mt-3 text-sm text-muted"><span className="font-semibold text-ink">Remarks:</span> {equipment.remarks}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

