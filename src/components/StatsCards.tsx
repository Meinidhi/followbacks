import { useEffect, useState } from 'react';
import type { ComparisonStats } from '../types/analyzer';

interface StatsCardsProps {
  stats: ComparisonStats;
}

function useAnimatedCount(target: number, durationMs: number = 550): number {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setDisplayValue(target);
      return;
    }

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion || target === 0) {
      setDisplayValue(target);
      return;
    }

    let animationFrameId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      // Cubic ease-out settling curve
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * target));

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(tick);
      } else {
        setDisplayValue(target);
      }
    };

    animationFrameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(animationFrameId);
  }, [target, durationMs]);

  return displayValue;
}

interface SingleStatCardProps {
  label: string;
  value: number;
  subtext: string;
  emphasis?: 'default' | 'violet' | 'emerald' | 'rose';
}

function SingleStatCard({
  label,
  value,
  subtext,
  emphasis = 'default',
}: SingleStatCardProps) {
  const animated = useAnimatedCount(value);

  const valueColorClass =
    emphasis === 'violet'
      ? 'text-violet-700'
      : emphasis === 'emerald'
        ? 'text-emerald-700'
        : emphasis === 'rose'
          ? 'text-red-700'
          : 'text-zinc-950';

  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-5 flex flex-col justify-between">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p
        className={`mt-2.5 text-3xl sm:text-4xl font-bold tracking-tight font-mono tabular-nums ${valueColorClass}`}
      >
        {animated.toLocaleString()}
      </p>
      <p className="mt-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500 font-mono tabular-nums">
        {subtext}
      </p>
    </div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <SingleStatCard
        label="Unique Followers"
        value={stats.followersCount}
        subtext={`${stats.mutualOfFollowersRate.toFixed(1)}% mutual · ${stats.youDontFollowBackCount.toLocaleString()} not followed back`}
        emphasis="default"
      />
      <SingleStatCard
        label="Unique Following"
        value={stats.followingCount}
        subtext={`${stats.followBackRate.toFixed(1)}% follow you back`}
        emphasis="default"
      />
      <SingleStatCard
        label="Don't Follow You Back"
        value={stats.nonFollowersCount}
        subtext={`${stats.nonFollowerRate.toFixed(1)}% of accounts you follow`}
        emphasis={stats.nonFollowersCount > 0 ? 'rose' : 'emerald'}
      />
      <SingleStatCard
        label="Mutual Followers"
        value={stats.mutualCount}
        subtext={`${stats.followBackRate.toFixed(1)}% of following · ${stats.mutualOfFollowersRate.toFixed(1)}% of followers`}
        emphasis="violet"
      />
    </div>
  );
}
