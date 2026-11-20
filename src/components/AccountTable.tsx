import { ExternalLink, CheckCircle2, SearchX, Users } from 'lucide-react';
import type { AccountEntry, ResultCategory } from '../types/analyzer';

interface AccountTableProps {
  accounts: AccountEntry[];
  startIndex: number;
  category: ResultCategory;
  searchQuery: string;
  totalCategoryCount: number;
  totalFollowingCount: number;
  totalFollowersCount: number;
  onClearSearch: () => void;
}

const AVATAR_PALETTES = [
  'bg-violet-50 text-violet-700 border-violet-200/80',
  'bg-zinc-100 text-zinc-700 border-zinc-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200/80',
  'bg-slate-100 text-slate-700 border-slate-200',
  'bg-purple-50 text-purple-700 border-purple-200/80',
];

function getInitials(username: string): string {
  const cleaned = username.replace(/^[^a-zA-Z0-9]+/, '');
  if (!cleaned) {
    return username.slice(0, 2).toUpperCase() || '?';
  }
  const parts = cleaned.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return cleaned.slice(0, 2).toUpperCase();
}

function getAvatarStyle(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = (hash * 31 + username.charCodeAt(i)) % AVATAR_PALETTES.length;
  }
  return AVATAR_PALETTES[Math.abs(hash)];
}

export function AccountTable({
  accounts,
  startIndex,
  category,
  searchQuery,
  totalCategoryCount,
  totalFollowingCount,
  totalFollowersCount,
  onClearSearch,
}: AccountTableProps) {
  // Empty state: Search returned zero matches
  if (accounts.length === 0 && searchQuery.trim().length > 0) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-500">
          <SearchX className="w-5 h-5" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-zinc-950">
          No matching usernames found
        </h4>
        <p className="mt-1.5 text-xs text-zinc-500">
          No accounts in this tab contain &ldquo;{searchQuery.trim()}&rdquo;.
        </p>
        <button
          type="button"
          onClick={onClearSearch}
          className="mt-4 inline-flex items-center px-3.5 py-2 text-xs font-medium text-violet-700 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors"
        >
          Clear search
        </button>
      </div>
    );
  }

  // Empty state: Zero non-followers (celebratory state when following > 0)
  if (
    accounts.length === 0 &&
    category === 'non_followers' &&
    totalFollowingCount > 0 &&
    totalCategoryCount === 0
  ) {
    return (
      <div className="px-6 py-14 text-center">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <h4 className="mt-4 text-base font-semibold text-zinc-950">
          Everyone you follow follows you back
        </h4>
        <p className="mt-1.5 text-sm text-zinc-600 max-w-md mx-auto">
          All {totalFollowingCount.toLocaleString()} account
          {totalFollowingCount === 1 ? '' : 's'} you follow are mutual followers. Zero
          non-followers detected.
        </p>
      </div>
    );
  }

  // Empty state: Export had empty lists or empty category
  if (accounts.length === 0) {
    const isCompletelyEmpty = totalFollowersCount === 0 && totalFollowingCount === 0;
    return (
      <div className="px-6 py-14 text-center">
        <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center mx-auto text-zinc-500">
          <Users className="w-5 h-5" />
        </div>
        <h4 className="mt-4 text-sm font-semibold text-zinc-950">
          {isCompletelyEmpty
            ? 'No accounts found in this export'
            : 'No accounts in this category'}
        </h4>
        <p className="mt-1.5 text-xs text-zinc-500 max-w-md mx-auto">
          {isCompletelyEmpty
            ? 'Both your followers and following JSON files were empty. Check that Date Range was set to All time when downloading from Instagram.'
            : category === 'you_dont_follow_back'
              ? 'You follow back every account that follows you.'
              : 'There are currently no mutual followers in this export.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/70 text-xs font-medium text-zinc-500">
            <th scope="col" className="py-3 pl-5 pr-3 w-16 font-mono">
              #
            </th>
            <th scope="col" className="py-3 px-3">
              Account
            </th>
            <th scope="col" className="py-3 px-3 hidden md:table-cell">
              Instagram Profile Link
            </th>
            <th scope="col" className="py-3 pl-3 pr-5 text-right w-36">
              Action
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {accounts.map((account, idx) => {
            const serialNumber = startIndex + idx + 1;
            const initials = getInitials(account.username);
            const avatarStyle = getAvatarStyle(account.normalizedUsername);

            return (
              <tr
                key={account.normalizedUsername}
                className="hover:bg-zinc-50/80 transition-colors duration-100"
              >
                {/* Serial Number */}
                <td className="py-3 pl-5 pr-3 text-xs font-mono tabular-nums text-zinc-400">
                  {serialNumber}
                </td>

                {/* Initials Avatar + Username */}
                <td className="py-3 px-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`w-8 h-8 rounded-full border text-xs font-semibold flex items-center justify-center shrink-0 font-mono ${avatarStyle}`}
                    >
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-zinc-950 hover:text-violet-700 transition-colors truncate block max-w-[180px] sm:max-w-[260px]"
                      >
                        @{account.username}
                      </a>
                      <a
                        href={account.profileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="md:hidden text-xs text-zinc-500 hover:text-violet-700 font-mono truncate block max-w-[180px] sm:max-w-[240px]"
                      >
                        instagram.com/{account.username}
                      </a>
                    </div>
                  </div>
                </td>

                {/* Instagram Profile Link (Desktop/Tablet) */}
                <td className="py-3 px-3 hidden md:table-cell">
                  <a
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-zinc-500 hover:text-violet-700 hover:underline truncate inline-block max-w-[320px]"
                  >
                    {account.profileUrl}
                  </a>
                </td>

                {/* View Profile Action */}
                <td className="py-3 pl-3 pr-5 text-right">
                  <a
                    href={account.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 bg-white hover:bg-violet-50 hover:text-violet-700 hover:border-violet-200 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-600 focus-visible:ring-offset-1"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-3 h-3 shrink-0" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
