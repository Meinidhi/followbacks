import type {
  AccountEntry,
  AnalysisMetadata,
  AnalysisResult,
  ComparisonStats,
  ParsedAccountList,
  ResultCategory,
  SortOrder,
  ZipProcessProgress,
} from '../types/analyzer';
import { extractInstagramZip, type ZipInputSource } from './ZipProcessor';
import { parseInstagramJsonFiles } from './JsonParser';

function toPercent(part: number, whole: number): number {
  if (whole <= 0) {
    return 0;
  }
  return Number(((part / whole) * 100).toFixed(1));
}

function sortAlphabetically(accounts: AccountEntry[], order: SortOrder = 'asc'): AccountEntry[] {
  const multiplier = order === 'asc' ? 1 : -1;
  return [...accounts].sort(
    (a, b) =>
      a.normalizedUsername.localeCompare(b.normalizedUsername, undefined, {
        sensitivity: 'base',
      }) * multiplier
  );
}

/**
 * Set-based Comparison Engine:
 *  - A = Followers (normalized unique Set)
 *  - B = Following (normalized unique Set)
 *  - B - A = People who don't follow you back (nonFollowers)
 *  - A - B = People you don't follow back (youDontFollowBack)
 *  - A ∩ B = Mutual followers (mutualFollowers)
 *
 * Verifies exact mathematical invariants:
 *  - Following === Mutual + Non-followers
 *  - Followers === Mutual + You Don't Follow Back
 */
export function compareFollowSets(
  followersData: ParsedAccountList,
  followingData: ParsedAccountList
): {
  stats: ComparisonStats;
  nonFollowers: AccountEntry[];
  youDontFollowBack: AccountEntry[];
  mutualFollowers: AccountEntry[];
} {
  const followersMap = followersData.accounts;
  const followingMap = followingData.accounts;

  // JavaScript Sets for exact O(1) membership lookups
  const setA = new Set<string>(followersMap.keys()); // Followers
  const setB = new Set<string>(followingMap.keys()); // Following

  const nonFollowers: AccountEntry[] = [];
  const mutualFollowers: AccountEntry[] = [];
  const youDontFollowBack: AccountEntry[] = [];

  // Partition B (Following) into (B - A) and (A ∩ B)
  for (const key of setB) {
    const followingAccount = followingMap.get(key)!;
    if (setA.has(key)) {
      // Preserve follower display casing if present, else following display casing
      const followerAccount = followersMap.get(key);
      mutualFollowers.push(followerAccount ?? followingAccount);
    } else {
      nonFollowers.push(followingAccount);
    }
  }

  // Partition A (Followers) for (A - B)
  for (const key of setA) {
    if (!setB.has(key)) {
      youDontFollowBack.push(followersMap.get(key)!);
    }
  }

  const followersCount = setA.size;
  const followingCount = setB.size;
  const nonFollowersCount = nonFollowers.length;
  const youDontFollowBackCount = youDontFollowBack.length;
  const mutualCount = mutualFollowers.length;

  // Verify mathematical invariants
  const followingInvariant = followingCount === mutualCount + nonFollowersCount;
  const followersInvariant = followersCount === mutualCount + youDontFollowBackCount;
  const invariantsValid = followingInvariant && followersInvariant;

  if (!invariantsValid) {
    throw new Error(
      `Set comparison invariant failed: Following(${followingCount}) != Mutual(${mutualCount}) + NonFollowers(${nonFollowersCount}) or Followers(${followersCount}) != Mutual(${mutualCount}) + YouDontFollowBack(${youDontFollowBackCount})`
    );
  }

  const stats: ComparisonStats = {
    followersCount,
    followingCount,
    nonFollowersCount,
    youDontFollowBackCount,
    mutualCount,
    followBackRate: toPercent(mutualCount, followingCount),
    nonFollowerRate: toPercent(nonFollowersCount, followingCount),
    mutualOfFollowersRate: toPercent(mutualCount, followersCount),
    notFollowedBackRate: toPercent(youDontFollowBackCount, followersCount),
    invariantsValid,
  };

  return {
    stats,
    nonFollowers: sortAlphabetically(nonFollowers, 'asc'),
    youDontFollowBack: sortAlphabetically(youDontFollowBack, 'asc'),
    mutualFollowers: sortAlphabetically(mutualFollowers, 'asc'),
  };
}

/**
 * Full end-to-end local analysis pipeline from ZIP source to verified AnalysisResult.
 */
export async function analyzeInstagramZip(
  input: ZipInputSource,
  fileMeta: { fileName: string; fileSizeBytes: number },
  onProgress?: (progress: ZipProcessProgress) => void
): Promise<AnalysisResult> {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  const extracted = await extractInstagramZip(input, onProgress);

  onProgress?.({
    stage: 'comparing',
    percent: 85,
    message: 'Normalizing usernames and computing follow relationships...',
  });

  const parsedFollowers = parseInstagramJsonFiles(extracted.followersFiles, 'followers');
  const parsedFollowing = parseInstagramJsonFiles(extracted.followingFiles, 'following');

  const comparison = compareFollowSets(parsedFollowers, parsedFollowing);

  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const processingTimeMs = Math.max(1, Math.round(endTime - startTime));

  const metadata: AnalysisMetadata = {
    fileName: fileMeta.fileName,
    fileSizeBytes: fileMeta.fileSizeBytes,
    analyzedAt: new Date(),
    followersFileNames: extracted.followersFiles.map((f) => f.name),
    followingFileNames: extracted.followingFiles.map((f) => f.name),
    baseFolderPath: extracted.baseFolderPath,
    rawFollowersParsed: parsedFollowers.rawEntryCount,
    rawFollowingParsed: parsedFollowing.rawEntryCount,
    followerDuplicatesRemoved: parsedFollowers.duplicatesRemoved,
    followingDuplicatesRemoved: parsedFollowing.duplicatesRemoved,
    processingTimeMs,
  };

  onProgress?.({
    stage: 'complete',
    percent: 100,
    message: 'Analysis complete.',
  });

  return {
    ...comparison,
    metadata,
  };
}

/**
 * Selects accounts for a given result category.
 */
export function getAccountsForCategory(
  result: AnalysisResult,
  category: ResultCategory
): AccountEntry[] {
  switch (category) {
    case 'non_followers':
      return result.nonFollowers;
    case 'you_dont_follow_back':
      return result.youDontFollowBack;
    case 'mutual_followers':
      return result.mutualFollowers;
  }
}

/**
 * Applies real-time case-insensitive partial username search and A-Z / Z-A sorting.
 */
export function filterAndSortAccounts(
  accounts: AccountEntry[],
  searchQuery: string,
  sortOrder: SortOrder
): AccountEntry[] {
  const normalizedQuery = searchQuery.trim().replace(/^@+/, '').toLowerCase();

  const filtered = normalizedQuery
    ? accounts.filter((account) =>
        account.normalizedUsername.includes(normalizedQuery)
      )
    : accounts;

  return sortAlphabetically(filtered, sortOrder);
}

export const ACCOUNTS_PER_PAGE = 25;

/**
 * Returns the exact slice of accounts for a 1-indexed page (25 accounts per page).
 */
export function paginateAccounts(
  accounts: AccountEntry[],
  page: number,
  pageSize: number = ACCOUNTS_PER_PAGE
): {
  items: AccountEntry[];
  currentPage: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
} {
  const totalPages = Math.max(1, Math.ceil(accounts.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, accounts.length);
  const items = accounts.slice(startIndex, endIndex);

  return {
    items,
    currentPage,
    totalPages,
    startIndex,
    endIndex,
  };
}
