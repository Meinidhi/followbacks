import { useState } from 'react';
import type { ComparisonStats, ResultCategory } from '../types/analyzer';

interface ComparisonChartProps {
  stats: ComparisonStats;
  onSelectCategory: (category: ResultCategory) => void;
}

interface DonutSlice {
  id: ResultCategory;
  label: string;
  count: number;
  color: string;
  bgClass: string;
}

export function ComparisonChart({
  stats,
  onSelectCategory,
}: ComparisonChartProps) {
  const [hoveredSlice, setHoveredSlice] = useState<ResultCategory | null>(null);

  const slices: DonutSlice[] = [
    {
      id: 'non_followers',
      label: "Don't Follow You Back",
      count: stats.nonFollowersCount,
      color: '#dc2626', // red-600
      bgClass: 'bg-red-600',
    },
    {
      id: 'mutual_followers',
      label: 'Mutual Followers',
      count: stats.mutualCount,
      color: '#7c3aed', // violet-600
      bgClass: 'bg-violet-600',
    },
    {
      id: 'you_dont_follow_back',
      label: "You Don't Follow Back",
      count: stats.youDontFollowBackCount,
      color: '#52525b', // zinc-600
      bgClass: 'bg-zinc-600',
    },
  ];

  // Union |A ∪ B| = Mutual + Non-followers + You don't follow back
  const totalUnion =
    stats.mutualCount + stats.nonFollowersCount + stats.youDontFollowBackCount;

  const radius = 56;
  const strokeWidth = 16;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const renderedSlices = slices.map((slice) => {
    const ratio = totalUnion > 0 ? slice.count / totalUnion : 0;
    const dashLength = ratio * circumference;
    const offset = cumulativeOffset;
    cumulativeOffset += dashLength;
    return {
      ...slice,
      ratio,
      percent: totalUnion > 0 ? (ratio * 100).toFixed(1) : '0.0',
      dashLength,
      offset,
    };
  });

  const activeSlice = hoveredSlice
    ? renderedSlices.find((s) => s.id === hoveredSlice)
    : null;

  const followingMutualPct =
    stats.followingCount > 0 ? (stats.mutualCount / stats.followingCount) * 100 : 0;
  const followingNonPct =
    stats.followingCount > 0
      ? (stats.nonFollowersCount / stats.followingCount) * 100
      : 0;

  const followersMutualPct =
    stats.followersCount > 0 ? (stats.mutualCount / stats.followersCount) * 100 : 0;
  const followersNotBackPct =
    stats.followersCount > 0
      ? (stats.youDontFollowBackCount / stats.followersCount) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* Left: Relationship Distribution Donut Chart */}
      <div className="lg:col-span-5 bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">
            Relationship distribution
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Unique accounts across all three relationship categories
          </p>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center gap-6">
          {/* SVG Donut */}
          <div className="relative w-40 h-40 shrink-0">
            <svg
              viewBox="0 0 144 144"
              className="w-full h-full -rotate-90"
              role="img"
              aria-label="Instagram follow relationship breakdown chart"
            >
              <circle
                cx="72"
                cy="72"
                r={radius}
                fill="none"
                stroke="#f4f4f5"
                strokeWidth={strokeWidth}
              />
              {totalUnion > 0 &&
                renderedSlices.map((slice) =>
                  slice.count > 0 ? (
                    <circle
                      key={slice.id}
                      cx="72"
                      cy="72"
                      r={radius}
                      fill="none"
                      stroke={slice.color}
                      strokeWidth={
                        hoveredSlice === slice.id ? strokeWidth + 3 : strokeWidth
                      }
                      strokeDasharray={`${slice.dashLength} ${circumference}`}
                      strokeDashoffset={-slice.offset}
                      className="transition-all duration-150 cursor-pointer"
                      onMouseEnter={() => setHoveredSlice(slice.id)}
                      onMouseLeave={() => setHoveredSlice(null)}
                      onClick={() => onSelectCategory(slice.id)}
                    />
                  ) : null
                )}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
              <span className="font-mono tabular-nums text-xl font-bold text-zinc-950">
                {activeSlice
                  ? activeSlice.count.toLocaleString()
                  : totalUnion.toLocaleString()}
              </span>
              <span className="text-[11px] text-zinc-500 leading-tight mt-0.5 max-w-[92px] truncate">
                {activeSlice ? `${activeSlice.percent}%` : 'Total unique'}
              </span>
            </div>
          </div>

          {/* Interactive Legend */}
          <div className="w-full space-y-2">
            {renderedSlices.map((slice) => (
              <button
                key={slice.id}
                type="button"
                onMouseEnter={() => setHoveredSlice(slice.id)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => onSelectCategory(slice.id)}
                className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg text-left transition-colors ${
                  hoveredSlice === slice.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-sm shrink-0 ${slice.bgClass}`}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-zinc-800 truncate">
                    {slice.label}
                  </span>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <span className="text-xs font-semibold text-zinc-950">
                    {slice.count.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-[11px] text-zinc-500">
                    ({slice.percent}%)
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Exact Set Equations & Proportional Breakdown Bars */}
      <div className="lg:col-span-7 bg-white border border-zinc-200 rounded-xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">
            Verified set breakdown
          </h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Exact reconciliation of your Following and Followers sets
          </p>
        </div>

        <div className="mt-6 space-y-6">
          {/* Bar 1: Following = Mutual + Don't Follow You Back */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-zinc-900">
                Following Breakdown
              </span>
              <span className="font-mono tabular-nums text-zinc-600">
                {stats.followingCount.toLocaleString()} ={' '}
                {stats.mutualCount.toLocaleString()} mutual +{' '}
                {stats.nonFollowersCount.toLocaleString()} non-followers
              </span>
            </div>

            <div
              className="mt-2.5 h-3.5 w-full rounded-md bg-zinc-100 overflow-hidden flex"
              role="img"
              aria-label={`Following breakdown: ${stats.followBackRate.toFixed(1)}% mutual, ${stats.nonFollowerRate.toFixed(1)}% don't follow back`}
            >
              {stats.mutualCount > 0 && (
                <div
                  className="h-full bg-violet-600 transition-all duration-300"
                  style={{ width: `${followingMutualPct}%` }}
                  title={`Mutual Followers: ${stats.mutualCount.toLocaleString()} (${stats.followBackRate.toFixed(1)}%)`}
                />
              )}
              {stats.nonFollowersCount > 0 && (
                <div
                  className="h-full bg-red-600 transition-all duration-300"
                  style={{ width: `${followingNonPct}%` }}
                  title={`Don't Follow You Back: ${stats.nonFollowersCount.toLocaleString()} (${stats.nonFollowerRate.toFixed(1)}%)`}
                />
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 font-mono tabular-nums">
              <span>Mutual: {stats.followBackRate.toFixed(1)}%</span>
              <span>Don&apos;t Follow Back: {stats.nonFollowerRate.toFixed(1)}%</span>
            </div>
          </div>

          {/* Bar 2: Followers = Mutual + You Don't Follow Back */}
          <div className="pt-4 border-t border-zinc-100">
            <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
              <span className="font-semibold text-zinc-900">
                Followers Breakdown
              </span>
              <span className="font-mono tabular-nums text-zinc-600">
                {stats.followersCount.toLocaleString()} ={' '}
                {stats.mutualCount.toLocaleString()} mutual +{' '}
                {stats.youDontFollowBackCount.toLocaleString()} you don&apos;t follow back
              </span>
            </div>

            <div
              className="mt-2.5 h-3.5 w-full rounded-md bg-zinc-100 overflow-hidden flex"
              role="img"
              aria-label={`Followers breakdown: ${stats.mutualOfFollowersRate.toFixed(1)}% mutual, ${stats.notFollowedBackRate.toFixed(1)}% you don't follow back`}
            >
              {stats.mutualCount > 0 && (
                <div
                  className="h-full bg-violet-600 transition-all duration-300"
                  style={{ width: `${followersMutualPct}%` }}
                  title={`Mutual Followers: ${stats.mutualCount.toLocaleString()} (${stats.mutualOfFollowersRate.toFixed(1)}%)`}
                />
              )}
              {stats.youDontFollowBackCount > 0 && (
                <div
                  className="h-full bg-zinc-600 transition-all duration-300"
                  style={{ width: `${followersNotBackPct}%` }}
                  title={`You Don't Follow Back: ${stats.youDontFollowBackCount.toLocaleString()} (${stats.notFollowedBackRate.toFixed(1)}%)`}
                />
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-500 font-mono tabular-nums">
              <span>Mutual: {stats.mutualOfFollowersRate.toFixed(1)}%</span>
              <span>
                You Don&apos;t Follow Back: {stats.notFollowedBackRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
