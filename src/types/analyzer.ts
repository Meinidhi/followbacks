export type ResultCategory =
  | 'non_followers'
  | 'you_dont_follow_back'
  | 'mutual_followers';

export type SortOrder = 'asc' | 'desc';

export interface AccountEntry {
  /** Lowercased, trimmed, @-stripped canonical key used for Set comparison */
  normalizedUsername: string;
  /** Original display casing preserved from Instagram export (without leading @) */
  username: string;
  /** Canonical Instagram profile URL */
  profileUrl: string;
  /** Optional Unix timestamp if present in export */
  timestamp?: number;
}

export interface ParsedAccountList {
  accounts: Map<string, AccountEntry>;
  rawEntryCount: number;
  duplicatesRemoved: number;
  skippedInvalidCount: number;
}

export interface ZipProcessProgress {
  stage: 'reading' | 'scanning' | 'parsing' | 'comparing' | 'complete';
  percent: number;
  message: string;
}

export interface ZipExtractionResult {
  followersFiles: { name: string; content: string }[];
  followingFiles: { name: string; content: string }[];
  baseFolderPath: string;
  totalFilesInZip: number;
}

export type AnalyzerErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'CORRUPTED_ZIP'
  | 'HTML_EXPORT_UNSUPPORTED'
  | 'MISSING_CONNECTIONS_FOLDER'
  | 'MISSING_FOLLOWING_JSON'
  | 'MISSING_FOLLOWERS_JSON'
  | 'INVALID_JSON_STRUCTURE'
  | 'FILE_READ_ERROR';

export interface AnalyzerError {
  code: AnalyzerErrorCode;
  title: string;
  message: string;
  suggestion?: string;
  showInstructionsAction?: boolean;
}

export interface ComparisonStats {
  followersCount: number;
  followingCount: number;
  nonFollowersCount: number;
  youDontFollowBackCount: number;
  mutualCount: number;
  /** Percentage of Following who follow you back (Mutual / Following) */
  followBackRate: number;
  /** Percentage of Following who do not follow you back (Non-followers / Following) */
  nonFollowerRate: number;
  /** Percentage of Followers whom you also follow (Mutual / Followers) */
  mutualOfFollowersRate: number;
  /** Percentage of Followers whom you do not follow back */
  notFollowedBackRate: number;
  /** Verification that Following === Mutual + Non-followers and Followers === Mutual + You Don't Follow Back */
  invariantsValid: boolean;
}

export interface AnalysisMetadata {
  fileName: string;
  fileSizeBytes: number;
  analyzedAt: Date;
  followersFileNames: string[];
  followingFileNames: string[];
  baseFolderPath: string;
  rawFollowersParsed: number;
  rawFollowingParsed: number;
  followerDuplicatesRemoved: number;
  followingDuplicatesRemoved: number;
  processingTimeMs: number;
}

export interface AnalysisResult {
  stats: ComparisonStats;
  nonFollowers: AccountEntry[];
  youDontFollowBack: AccountEntry[];
  mutualFollowers: AccountEntry[];
  metadata: AnalysisMetadata;
}
