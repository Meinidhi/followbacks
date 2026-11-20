import { useState } from 'react';
import { Download, Check } from 'lucide-react';
import type { AccountEntry, ResultCategory } from '../types/analyzer';
import { CATEGORY_CSV_FILENAMES, downloadAccountsCsv } from '../utils/csvUtils';

interface ExportCSVProps {
  accounts: AccountEntry[];
  category: ResultCategory;
}

export function ExportCSV({ accounts, category }: ExportCSVProps) {
  const [justExported, setJustExported] = useState(false);

  const handleExport = () => {
    if (accounts.length === 0) {
      return;
    }
    downloadAccountsCsv(accounts, category);
    setJustExported(true);
    window.setTimeout(() => {
      setJustExported(false);
    }, 2000);
  };

  const fileName = CATEGORY_CSV_FILENAMES[category];

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={accounts.length === 0}
      title={
        accounts.length > 0
          ? `Export all ${accounts.length.toLocaleString()} matching accounts to ${fileName}`
          : 'No accounts available to export'
      }
      className="inline-flex items-center justify-center gap-2 h-10 px-4 text-xs sm:text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:bg-zinc-200 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-2"
    >
      {justExported ? (
        <>
          <Check className="w-4 h-4" />
          <span>Exported CSV</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4" />
          <span>Export CSV ({accounts.length.toLocaleString()})</span>
        </>
      )}
    </button>
  );
}
