import { useMemo } from 'react';
import { motion } from 'motion/react';
import { Trash2, Upload } from 'lucide-react';
import type {
  AnalysisResult,
  ResultCategory,
  SortOrder,
} from '../types/analyzer';
import {
  ACCOUNTS_PER_PAGE,
  filterAndSortAccounts,
  getAccountsForCategory,
  paginateAccounts,
} from '../utils/ComparisonEngine';
import { formatFileSize } from '../utils/csvUtils';
import { StatsCards } from './StatsCards';
import { ComparisonChart } from './ComparisonChart';
import { SearchBar } from './SearchBar';
import { Filters } from './Filters';
import { ExportCSV } from './ExportCSV';
import { AccountTable } from './AccountTable';
import { Pagination } from './Pagination';

interface ResultsDashboardProps {
  result: AnalysisResult;
  activeCategory: ResultCategory;
  searchQuery: string;
  sortOrder: SortOrder;
  currentPage: number;
  onCategoryChange: (category: ResultCategory) => void;
  onSearchChange: (query: string) => void;
  onSortOrderChange: (order: SortOrder) => void;
  onPageChange: (page: number) => void;
  onClearData: () => void;
  onAnalyzeAnother: () => void;
}

export function ResultsDashboard({
  result,
  activeCategory,
  searchQuery,
  sortOrder,
  currentPage,
  onCategoryChange,
  onSearchChange,
  onSortOrderChange,
  onPageChange,
  onClearData,
  onAnalyzeAnother,
}: ResultsDashboardProps) {
  const { stats, metadata } = result;

  const categoryAccounts = useMemo(
    () => getAccountsForCategory(result, activeCategory),
    [result, activeCategory]
  );

  const filteredAndSorted = useMemo(
    () => filterAndSortAccounts(categoryAccounts, searchQuery, sortOrder),
    [categoryAccounts, searchQuery, sortOrder]
  );

  const paginated = useMemo(
    () => paginateAccounts(filteredAndSorted, currentPage, ACCOUNTS_PER_PAGE),
    [filteredAndSorted, currentPage]
  );

  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(metadata.analyzedAt);
  }, [metadata.analyzedAt]);

  const totalDuplicatesRemoved =
    metadata.followerDuplicatesRemoved + metadata.followingDuplicatesRemoved;

  const tabs: { id: ResultCategory; label: string; count: number }[] = [
    {
      id: 'non_followers',
      label: "Don't Follow You Back",
      count: stats.nonFollowersCount,
    },
    {
      id: 'you_dont_follow_back',
      label: "You Don't Follow Back",
      count: stats.youDontFollowBackCount,
    },
    {
      id: 'mutual_followers',
      label: 'Mutual Followers',
      count: stats.mutualCount,
    },
  ];

  return (
    <motion.section
      id="results"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="py-16 sm:py-20 bg-zinc-50/70 border-b border-zinc-200 scroll-mt-16"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Dashboard Header & Summary Metadata */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-violet-700">Analysis results</p>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950">
              Follow comparison dashboard
            </h2>

            {/* Clean unboxed metadata strip with typographic separators */}
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-500">
              <span>Analyzed {formattedDate}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-zinc-700 truncate max-w-[240px]" title={metadata.fileName}>
                {metadata.fileName}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {formatFileSize(metadata.fileSizeBytes)}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {metadata.followersFileNames.length} follower file
                {metadata.followersFileNames.length === 1 ? '' : 's'} +{' '}
                {metadata.followingFileNames.length} following file
                {metadata.followingFileNames.length === 1 ? '' : 's'}
              </span>
              {totalDuplicatesRemoved > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {totalDuplicatesRemoved.toLocaleString()} duplicate
                    {totalDuplicatesRemoved === 1 ? '' : 's'} removed
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onAnalyzeAnother}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-zinc-500" />
              <span>Analyze New ZIP</span>
            </button>

            <button
              type="button"
              onClick={onClearData}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Data</span>
            </button>
          </div>
        </div>

        {/* Summary Insight Line */}
        <div className="bg-white border border-zinc-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm text-zinc-700">
          <p className="leading-relaxed">
            Out of{' '}
            <strong className="font-semibold font-mono tabular-nums text-zinc-950">
              {stats.followingCount.toLocaleString()}
            </strong>{' '}
            account{stats.followingCount === 1 ? '' : 's'} you follow,{' '}
            <strong className="font-semibold font-mono tabular-nums text-violet-700">
              {stats.mutualCount.toLocaleString()}
            </strong>{' '}
            ({stats.followBackRate.toFixed(1)}%) follow you back and{' '}
            <strong className="font-semibold font-mono tabular-nums text-red-700">
              {stats.nonFollowersCount.toLocaleString()}
            </strong>{' '}
            ({stats.nonFollowerRate.toFixed(1)}%) do not. You also have{' '}
            <strong className="font-semibold font-mono tabular-nums text-zinc-950">
              {stats.youDontFollowBackCount.toLocaleString()}
            </strong>{' '}
            follower{stats.youDontFollowBackCount === 1 ? '' : 's'} you don&apos;t follow
            back.
          </p>
          <span className="text-xs font-mono tabular-nums text-zinc-400 shrink-0">
            Processed locally in {metadata.processingTimeMs} ms
          </span>
        </div>

        {/* 4 Dynamic Statistic Cards */}
        <StatsCards stats={stats} />

        {/* Visual Breakdown Charts */}
        <ComparisonChart stats={stats} onSelectCategory={onCategoryChange} />

        {/* Account Explorer: Tabs + Search + Sort + CSV Export + Table + Pagination */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          {/* Category Tabs */}
          <div className="px-5 pt-5 pb-4 border-b border-zinc-200">
            <div
              role="tablist"
              aria-label="Follow relationship categories"
              className="flex items-center gap-1.5 p-1 bg-zinc-100 rounded-lg overflow-x-auto"
            >
              {tabs.map((tab) => {
                const isActive = activeCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onCategoryChange(tab.id)}
                    className={`flex-1 inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-white text-zinc-950 shadow-xs'
                        : 'text-zinc-600 hover:text-zinc-950'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`font-mono tabular-nums text-xs ${
                        isActive ? 'text-violet-700 font-semibold' : 'text-zinc-500'
                      }`}
                    >
                      {tab.count.toLocaleString()}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search, Sort & Export Toolbar */}
            <div className="mt-4 flex flex-col md:flex-row md:items-center gap-3">
              <SearchBar
                value={searchQuery}
                onChange={onSearchChange}
                placeholder={`Search within ${
                  tabs.find((t) => t.id === activeCategory)?.label ?? 'accounts'
                }...`}
              />
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
                <Filters
                  sortOrder={sortOrder}
                  onSortOrderChange={onSortOrderChange}
                />
                <ExportCSV
                  accounts={filteredAndSorted}
                  category={activeCategory}
                />
              </div>
            </div>
          </div>

          {/* Account List Table */}
          <AccountTable
            accounts={paginated.items}
            startIndex={paginated.startIndex}
            category={activeCategory}
            searchQuery={searchQuery}
            totalCategoryCount={categoryAccounts.length}
            totalFollowingCount={stats.followingCount}
            totalFollowersCount={stats.followersCount}
            onClearSearch={() => onSearchChange('')}
          />

          {/* Pagination (25 per page) */}
          <Pagination
            currentPage={paginated.currentPage}
            totalPages={paginated.totalPages}
            totalItems={filteredAndSorted.length}
            startIndex={paginated.startIndex}
            endIndex={paginated.endIndex}
            onPageChange={onPageChange}
          />
        </div>
      </div>
    </motion.section>
  );
}
