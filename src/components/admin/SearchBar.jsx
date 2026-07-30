import { FaSearch } from 'react-icons/fa';

export default function SearchBar({ value, onChange, placeholder = 'Search name, email, phone, company...' }) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={14} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />
    </div>
  );
}
