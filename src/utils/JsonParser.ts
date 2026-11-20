import type { AccountEntry, AnalyzerError, ParsedAccountList } from '../types/analyzer';

interface StringListDatum {
  href?: unknown;
  value?: unknown;
  timestamp?: unknown;
}

interface RawInstagramEntry {
  title?: unknown;
  string_list_data?: unknown;
  media_list_data?: unknown;
}

const RESERVED_INSTAGRAM_SEGMENTS = new Set([
  'p',
  'reel',
  'reels',
  'stories',
  'explore',
  'accounts',
  'direct',
  'tv',
  'tags',
  'locations',
  'about',
  'legal',
  'developer',
  'web',
  'api',
  'graphql',
  'oauth',
  '_u',
  '_n',
]);

/**
 * Checks whether a candidate string or value looks like a numeric/ISO timestamp
 * so timestamps are never mistaken for Instagram usernames.
 */
export function isLikelyTimestamp(candidate: unknown, recordTimestamp?: number): boolean {
  if (typeof candidate === 'number') {
    return true;
  }
  if (typeof candidate !== 'string') {
    return true;
  }
  const trimmed = candidate.trim();
  if (!trimmed) {
    return true;
  }
  if (recordTimestamp !== undefined && trimmed === String(recordTimestamp)) {
    return true;
  }
  // Unix timestamp in seconds (9-10 digits) or milliseconds (12-14 digits)
  if (/^\d{9,14}$/.test(trimmed)) {
    return true;
  }
  // ISO-8601 date/time strings
  if (/^\d{4}-\d{2}-\d{2}(?:[T\s]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?Z?)?$/i.test(trimmed)) {
    return true;
  }
  return false;
}

/**
 * Extracts a username from a valid Instagram profile URL.
 * Supports:
 *  - https://www.instagram.com/username
 *  - https://www.instagram.com/username/
 *  - https://www.instagram.com/_u/username
 *  - https://instagram.com/_u/username/?hl=en
 */
export function extractUsernameFromInstagramUrl(rawHref: unknown): string | null {
  if (typeof rawHref !== 'string') {
    return null;
  }
  const trimmed = rawHref.trim();
  if (!trimmed) {
    return null;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsedUrl.hostname.toLowerCase();
  if (host !== 'instagram.com' && host !== 'www.instagram.com' && host !== 'm.instagram.com') {
    return null;
  }

  const segments = parsedUrl.pathname
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  let candidate: string;
  if (segments[0].toLowerCase() === '_u') {
    if (segments.length < 2) {
      return null;
    }
    candidate = segments[1];
  } else {
    candidate = segments[0];
  }

  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    // Keep raw segment if malformed percent encoding
  }

  const cleaned = candidate.trim().replace(/^@+/, '').trim();
  if (!cleaned) {
    return null;
  }
  if (RESERVED_INSTAGRAM_SEGMENTS.has(cleaned.toLowerCase())) {
    return null;
  }
  if (isLikelyTimestamp(cleaned)) {
    return null;
  }
  return cleaned;
}

/**
 * Normalizes a raw username string:
 * - Trims leading/trailing whitespace
 * - Removes leading '@' characters
 * - Rejects timestamps or empty values
 * - Returns canonical lowercase key and preserved display casing
 */
export function normalizeUsername(
  raw: unknown,
  recordTimestamp?: number
): { normalized: string; display: string } | null {
  if (typeof raw !== 'string') {
    return null;
  }
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  // If someone placed a full Instagram URL in value/title, extract the username from it
  if (/^https?:\/\//i.test(trimmed)) {
    const fromUrl = extractUsernameFromInstagramUrl(trimmed);
    if (!fromUrl) {
      return null;
    }
    return {
      normalized: fromUrl.toLowerCase(),
      display: fromUrl,
    };
  }

  const display = trimmed.replace(/^@+/, '').trim();
  if (!display) {
    return null;
  }
  if (isLikelyTimestamp(display, recordTimestamp)) {
    return null;
  }

  return {
    normalized: display.toLowerCase(),
    display,
  };
}

/**
 * Builds a clean Instagram profile URL for a given display username.
 */
export function buildProfileUrl(displayUsername: string): string {
  const safePath = /^[a-zA-Z0-9._-]+$/.test(displayUsername)
    ? displayUsername
    : encodeURIComponent(displayUsername);
  return `https://www.instagram.com/${safePath}/`;
}

/**
 * Extracts an AccountEntry from a single raw Instagram relationship record.
 * Priority:
 *  1. string_list_data[0].value
 *  2. entry.title
 *  3. valid Instagram profile URL in string_list_data[0].href
 */
function extractAccountFromEntry(entry: unknown): AccountEntry | null {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const record = entry as RawInstagramEntry;
  const stringList = Array.isArray(record.string_list_data)
    ? (record.string_list_data as StringListDatum[])
    : [];
  const firstItem = stringList[0];

  const recordTimestamp =
    firstItem && typeof firstItem.timestamp === 'number'
      ? firstItem.timestamp
      : undefined;

  // 1. string_list_data[0].value
  if (firstItem && firstItem.value !== undefined && firstItem.value !== null) {
    const normalized = normalizeUsername(firstItem.value, recordTimestamp);
    if (normalized) {
      return {
        normalizedUsername: normalized.normalized,
        username: normalized.display,
        profileUrl: buildProfileUrl(normalized.display),
        timestamp: recordTimestamp,
      };
    }
  }

  // 2. title
  if (record.title !== undefined && record.title !== null) {
    const normalized = normalizeUsername(record.title, recordTimestamp);
    if (normalized) {
      return {
        normalizedUsername: normalized.normalized,
        username: normalized.display,
        profileUrl: buildProfileUrl(normalized.display),
        timestamp: recordTimestamp,
      };
    }
  }

  // 3. Valid Instagram profile URL in string_list_data[0].href
  if (firstItem && firstItem.href !== undefined && firstItem.href !== null) {
    const fromHref = extractUsernameFromInstagramUrl(firstItem.href);
    if (fromHref && !isLikelyTimestamp(fromHref, recordTimestamp)) {
      return {
        normalizedUsername: fromHref.toLowerCase(),
        username: fromHref,
        profileUrl: buildProfileUrl(fromHref),
        timestamp: recordTimestamp,
      };
    }
  }

  // Fallback: check subsequent string_list_data items if present
  for (let i = 1; i < stringList.length; i++) {
    const item = stringList[i];
    const ts = typeof item?.timestamp === 'number' ? item.timestamp : recordTimestamp;
    const fromVal = normalizeUsername(item?.value, ts);
    if (fromVal) {
      return {
        normalizedUsername: fromVal.normalized,
        username: fromVal.display,
        profileUrl: buildProfileUrl(fromVal.display),
        timestamp: ts,
      };
    }
    const fromHref = extractUsernameFromInstagramUrl(item?.href);
    if (fromHref && !isLikelyTimestamp(fromHref, ts)) {
      return {
        normalizedUsername: fromHref.toLowerCase(),
        username: fromHref,
        profileUrl: buildProfileUrl(fromHref),
        timestamp: ts,
      };
    }
  }

  return null;
}

function createJsonError(fileName: string, detail: string): AnalyzerError {
  return {
    code: 'INVALID_JSON_STRUCTURE',
    title: 'Invalid Instagram JSON structure',
    message: `Could not parse "${fileName}": ${detail}`,
    suggestion:
      'Make sure you uploaded an unmodified Instagram data export downloaded in JSON format.',
    showInstructionsAction: true,
  };
}

/**
 * Extracts the array of relationship entries from parsed JSON, handling Instagram export variations:
 * - Top-level array (common for followers_1.json, followers_2.json, etc.)
 * - Object with `relationships_followers` or `relationships_following`
 * - Object with a single array property containing relationship entries
 */
function extractRecordsArray(
  parsed: unknown,
  kind: 'followers' | 'following',
  fileName: string
): unknown[] {
  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (parsed && typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    const preferredKey =
      kind === 'followers' ? 'relationships_followers' : 'relationships_following';

    if (preferredKey in obj) {
      if (Array.isArray(obj[preferredKey])) {
        return obj[preferredKey] as unknown[];
      }
      throw createJsonError(
        fileName,
        `Expected "${preferredKey}" to be a list of accounts.`
      );
    }

    // Check alternate known Instagram keys
    const alternateKeys =
      kind === 'followers'
        ? ['followers', 'followers_list']
        : ['following', 'following_list', 'relationships_following'];

    for (const key of alternateKeys) {
      if (key in obj && Array.isArray(obj[key])) {
        return obj[key] as unknown[];
      }
    }

    // Fallback: if the object contains exactly one array property whose items look like Instagram entries (or empty)
    const arrayEntries = Object.entries(obj).filter(([, value]) => Array.isArray(value));
    if (arrayEntries.length === 1) {
      const candidateArr = arrayEntries[0][1] as unknown[];
      if (
        candidateArr.length === 0 ||
        candidateArr.some(
          (item) =>
            item !== null &&
            typeof item === 'object' &&
            ('string_list_data' in (item as object) || 'title' in (item as object))
        )
      ) {
        return candidateArr;
      }
    }
  }

  throw createJsonError(
    fileName,
    kind === 'followers'
      ? 'Expected an array of follower records or a "relationships_followers" list.'
      : 'Expected a "relationships_following" object or an array of following records.'
  );
}

/**
 * Parses one or more Instagram JSON files (e.g., all followers_*.json files or following.json),
 * normalizes usernames, deduplicates case-insensitively while preserving original display casing,
 * and returns the deduplicated map plus parsing statistics.
 */
export function parseInstagramJsonFiles(
  files: { name: string; content: string }[],
  kind: 'followers' | 'following'
): ParsedAccountList {
  const accounts = new Map<string, AccountEntry>();
  let rawEntryCount = 0;
  let duplicatesRemoved = 0;
  let skippedInvalidCount = 0;

  for (const file of files) {
    let parsed: unknown;
    try {
      // Strip potential UTF-8 BOM before JSON.parse
      const cleanContent = file.content.replace(/^\uFEFF/, '');
      parsed = JSON.parse(cleanContent);
    } catch {
      throw createJsonError(
        file.name,
        'The file does not contain valid JSON syntax.'
      );
    }

    const records = extractRecordsArray(parsed, kind, file.name);

    // Validate that non-empty arrays actually look like Instagram relationship objects
    if (records.length > 0) {
      const hasAnyObject = records.some((r) => r !== null && typeof r === 'object');
      if (!hasAnyObject) {
        throw createJsonError(
          file.name,
          'The account list does not match Instagram JSON export format.'
        );
      }
    }

    for (const record of records) {
      rawEntryCount += 1;
      const account = extractAccountFromEntry(record);
      if (!account) {
        skippedInvalidCount += 1;
        continue;
      }

      if (accounts.has(account.normalizedUsername)) {
        duplicatesRemoved += 1;
      } else {
        accounts.set(account.normalizedUsername, account);
      }
    }
  }

  return {
    accounts,
    rawEntryCount,
    duplicatesRemoved,
    skippedInvalidCount,
  };
}
