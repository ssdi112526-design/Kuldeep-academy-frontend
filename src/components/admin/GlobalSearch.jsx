import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FaSearch, FaTimes, FaUser, FaUserTie, FaUserFriends, FaTrophy, FaMedal } from 'react-icons/fa';
import { globalSearchService } from '../../services';
import { mediaUrl } from '../../utils/mediaUrl';
import useDebouncedValue from '../../hooks/useDebouncedValue';

const TYPE_ICON = {
  player: FaUser,
  employee: FaUserTie,
  parent: FaUserFriends,
  achievement: FaTrophy,
  tournament: FaMedal,
};

const TYPE_LABEL = {
  player: 'Player',
  employee: 'Employee',
  parent: 'Parent',
  achievement: 'Achievement',
  tournament: 'Tournament',
};

export default function GlobalSearch({ onSelect }) {
  const listId = useId();
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [groups, setGroups] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebouncedValue(query.trim(), 320);

  const flatItems = useMemo(() => {
    const list = [];
    for (const g of groups) {
      for (const item of g.items) list.push(item);
    }
    return list;
  }, [groups]);

  const runSearch = useCallback(async (q) => {
    if (abortRef.current) abortRef.current.abort();
    if (q.length < 2) {
      setGroups([]);
      setError('');
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError('');
    setOpen(true);
    try {
      const res = await globalSearchService.search(q, { signal: controller.signal });
      if (controller.signal.aborted) return;
      setGroups(res.data?.data?.groups || []);
      setActiveIndex(-1);
    } catch (err) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED' || controller.signal.aborted) {
        return;
      }
      setGroups([]);
      setError('Unable to search right now. Please try again.');
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSearch(debounced);
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [debounced, runSearch]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!rootRef.current?.contains(e.target)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const clear = () => {
    setQuery('');
    setGroups([]);
    setError('');
    setActiveIndex(-1);
    setOpen(false);
    inputRef.current?.focus();
  };

  const selectItem = (item) => {
    if (!item) return;
    onSelect?.(item);
    setOpen(false);
    setActiveIndex(-1);
    setQuery('');
    setGroups([]);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        selectItem(flatItems[activeIndex]);
        return;
      }
      runSearch(query.trim());
      setOpen(true);
      return;
    }
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      if (query.trim().length >= 2) setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!flatItems.length) return;
      setActiveIndex((i) => (i + 1) % flatItems.length);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!flatItems.length) return;
      setActiveIndex((i) => (i <= 0 ? flatItems.length - 1 : i - 1));
    }
  };

  const showPanel = open && query.trim().length >= 2;
  let flatOffset = 0;

  return (
    <div ref={rootRef} className="relative w-full max-w-xl flex-1">
      <label htmlFor={listId} className="sr-only">
        Global search by mobile number or ID
      </label>
      <div className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 shadow-sm transition focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/20">
        <FaSearch className="shrink-0 text-sm text-muted" aria-hidden />
        <input
          id={listId}
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length >= 2) setOpen(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder="Search by name or ID..."
          className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={`${listId}-results`}
          aria-autocomplete="list"
        />
        {query ? (
          <button
            type="button"
            onClick={clear}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted hover:bg-slate-200 hover:text-ink"
            aria-label="Clear search"
          >
            <FaTimes className="text-xs" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div
          id={`${listId}-results`}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-[80] max-h-[min(70vh,28rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
        >
          <div className="sticky top-0 border-b border-slate-100 bg-white px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted">Search Results</p>
          </div>

          {loading ? (
            <p className="px-4 py-6 text-sm text-muted">Searching…</p>
          ) : error ? (
            <p className="px-4 py-6 text-sm text-red-600">{error}</p>
          ) : !groups.length ? (
            <p className="px-4 py-6 text-sm text-muted">
              No records found for &apos;{query.trim()}&apos;. Try another mobile number or ID.
            </p>
          ) : (
            groups.map((group) => {
              const start = flatOffset;
              flatOffset += group.items.length;
              return (
                <div key={group.key} className="border-b border-slate-50 last:border-0">
                  <p className="bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-muted">
                    {group.label}
                  </p>
                  <ul className="py-1">
                    {group.items.map((item, idx) => {
                      const flatIdx = start + idx;
                      const Icon = TYPE_ICON[item.type] || FaUser;
                      const active = flatIdx === activeIndex;
                      return (
                        <li key={`${item.type}-${item.id}`}>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setActiveIndex(flatIdx)}
                            onClick={() => selectItem(item)}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                              active ? 'bg-brand/10' : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-100">
                              {item.photo ? (
                                <img
                                  src={mediaUrl(item.photo)}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="flex h-full w-full items-center justify-center text-muted">
                                  <Icon className="text-sm" />
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-semibold text-ink">{item.title}</p>
                                <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                                  {TYPE_LABEL[item.type] || item.type}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-xs text-muted">
                                {[
                                  item.code ? `ID: ${item.code}` : null,
                                  item.mobile ? `Mobile: ${item.mobile}` : null,
                                  item.subtitle || item.meta?.category || item.status || null,
                                ]
                                  .filter(Boolean)
                                  .join(' · ')}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}
