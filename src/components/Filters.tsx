import { ArrowDownAZ, ArrowUpZA } from 'lucide-react';
import type { SortOrder } from '../types/analyzer';

interface FiltersProps {
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
}

export function Filters({ sortOrder, onSortOrderChange }: FiltersProps) {
  return (
    <div
      role="group"
      aria-label="Sort usernames"
      className="inline-flex items-center p-1 bg-zinc-100 rounded-lg border border-zinc-200/80 shrink-0"
    >
      <button
        type="button"
        onClick={() => onSortOrderChange('asc')}
        aria-pressed={sortOrder === 'asc'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
          sortOrder === 'asc'
            ? 'bg-white text-zinc-950 shadow-xs'
            : 'text-zinc-600 hover:text-zinc-950'
        }`}
      >
        <ArrowDownAZ className="w-3.5 h-3.5" />
        <span>A–Z</span>
      </button>

      <button
        type="button"
        onClick={() => onSortOrderChange('desc')}
        aria-pressed={sortOrder === 'desc'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
          sortOrder === 'desc'
            ? 'bg-white text-zinc-950 shadow-xs'
            : 'text-zinc-600 hover:text-zinc-950'
        }`}
      >
        <ArrowUpZA className="w-3.5 h-3.5" />
        <span>Z–A</span>
      </button>
    </div>
  );
}
