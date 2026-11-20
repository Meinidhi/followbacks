import type { AccountEntry, ResultCategory } from '../types/analyzer';

export const CATEGORY_CSV_FILENAMES: Record<ResultCategory, string> = {
  non_followers: 'instagram_non_followers.csv',
  you_dont_follow_back: 'instagram_you_dont_follow_back.csv',
  mutual_followers: 'instagram_mutual_followers.csv',
};

/**
 * Escapes a single CSV field according to RFC 4180.
 * Wraps fields containing commas, double quotes, CR, LF, or leading/trailing whitespace
 * in double quotes, doubling any internal double quotes.
 */
export function escapeCsvField(value: string | number): string {
  const str = String(value);
  const needsQuoting =
    str.includes('"') ||
    str.includes(',') ||
    str.includes('\n') ||
    str.includes('\r') ||
    str !== str.trim();

  if (needsQuoting) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Generates UTF-8 CSV content (with UTF-8 BOM for spreadsheet compatibility)
 * containing Serial Number, Username, and Profile URL for the complete filtered list.
 */
export function generateAccountsCsv(accounts: AccountEntry[]): string {
  const header = ['Serial Number', 'Username', 'Profile URL']
    .map(escapeCsvField)
    .join(',');

  const rows = accounts.map((account, index) =>
    [
      escapeCsvField(index + 1),
      escapeCsvField(account.username),
      escapeCsvField(account.profileUrl),
    ].join(',')
  );

  // Prefix with UTF-8 BOM so international UTF-8 characters open cleanly in Excel/Sheets
  return `\uFEFF${[header, ...rows].join('\r\n')}`;
}

/**
 * Registry of created Blob Object URLs so they are always properly revoked
 * both after download and immediately when the user triggers Clear Data.
 */
const activeObjectUrls = new Set<string>();

export function revokeAllObjectUrls(): void {
  for (const url of activeObjectUrls) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // Ignore revocation errors if already revoked
    }
  }
  activeObjectUrls.clear();
}

/**
 * Triggers a browser download of the generated CSV using Blob and URL.createObjectURL,
 * and revokes the object URL cleanly.
 */
export function downloadAccountsCsv(
  accounts: AccountEntry[],
  category: ResultCategory
): string {
  const csvContent = generateAccountsCsv(accounts);
  const fileName = CATEGORY_CSV_FILENAMES[category];
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const objectUrl = URL.createObjectURL(blob);
  activeObjectUrls.add(objectUrl);

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Revoke shortly after click so browser finishes initiating the download
  window.setTimeout(() => {
    if (activeObjectUrls.has(objectUrl)) {
      URL.revokeObjectURL(objectUrl);
      activeObjectUrls.delete(objectUrl);
    }
  }, 1000);

  return fileName;
}

/**
 * Formats byte sizes into human-readable labels (e.g. 42.6 KB, 3.14 MB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
