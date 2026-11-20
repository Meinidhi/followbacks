import JSZip from 'jszip';
import type {
  AnalyzerError,
  ZipExtractionResult,
  ZipProcessProgress,
} from '../types/analyzer';

const FOLLOWERS_FILE_REGEX = /^followers(?:_\d+)?\.json$/i;
const FOLLOWING_FILE_REGEX = /^following(?:_\d+)?\.json$/i;
const HTML_FOLLOW_FILE_REGEX = /^(?:followers(?:_\d+)?|following(?:_\d+)?)\.html?$/i;

function normalizeZipPath(path: string): string {
  return path.replace(/\\/g, '/').replace(/^\/+/, '');
}

function isIgnoredSystemEntry(normalizedPath: string): boolean {
  const segments = normalizedPath.split('/');
  return segments.some(
    (seg) =>
      seg === '__MACOSX' ||
      seg === '.DS_Store' ||
      seg.startsWith('._')
  );
}

function getBasename(normalizedPath: string): string {
  const idx = normalizedPath.lastIndexOf('/');
  return idx === -1 ? normalizedPath : normalizedPath.slice(idx + 1);
}

function getDirname(normalizedPath: string): string {
  const idx = normalizedPath.lastIndexOf('/');
  return idx === -1 ? '' : normalizedPath.slice(0, idx);
}

/**
 * Natural numerical sort so followers_2.json comes before followers_10.json.
 */
function naturalSortFileNames(a: string, b: string): number {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

export function createHtmlExportError(detail?: string): AnalyzerError {
  return {
    code: 'HTML_EXPORT_UNSUPPORTED',
    title: 'HTML Instagram export is not supported',
    message:
      detail ||
      'Your Instagram export contains HTML files instead of JSON. FOLLOWBACK requires the official Instagram JSON export format to accurately read your followers and following lists.',
    suggestion:
      'Re-download your Instagram information and set Format to JSON and Date Range to All time.',
    showInstructionsAction: true,
  };
}

/**
 * Validates file type before reading with JSZip.
 * Immediately catches .html/.htm files with the dedicated HTML error.
 */
export function validateSelectedFile(file: File): AnalyzerError | null {
  const nameLower = file.name.toLowerCase();

  if (nameLower.endsWith('.html') || nameLower.endsWith('.htm')) {
    return createHtmlExportError(
      `You selected an HTML file ("${file.name}"). HTML files cannot be analyzed — FOLLOWBACK requires the ZIP archive exported in JSON format.`
    );
  }

  const isZipExtension = nameLower.endsWith('.zip');
  const isZipMime =
    file.type === 'application/zip' ||
    file.type === 'application/x-zip-compressed' ||
    file.type === 'multipart/x-zip' ||
    file.type === '';

  if (!isZipExtension && !isZipMime) {
    return {
      code: 'INVALID_FILE_TYPE',
      title: 'Unsupported file format',
      message: `"${file.name}" is not a ZIP archive. Please upload the .zip file downloaded from Instagram Accounts Center.`,
      suggestion:
        'Look for a file named similar to "instagram-username-YYYY-MM-DD.zip" in your Downloads folder.',
    };
  }

  if (!isZipExtension) {
    return {
      code: 'INVALID_FILE_TYPE',
      title: 'Please select a .zip archive',
      message: `"${file.name}" does not have a .zip extension. Upload the original ZIP archive downloaded from Instagram without extracting it first.`,
      suggestion: 'Select the original .zip file directly.',
    };
  }

  if (file.size === 0) {
    return {
      code: 'CORRUPTED_ZIP',
      title: 'Empty ZIP file',
      message: `"${file.name}" is 0 bytes and contains no data.`,
      suggestion: 'Re-download your Instagram data archive and try again.',
    };
  }

  return null;
}

export type ZipInputSource = File | ArrayBuffer | Uint8Array;

/**
 * Processes an Instagram ZIP archive entirely in the browser using JSZip.
 * Dynamically locates `connections/followers_and_following/` (at any nesting depth),
 * detects unsupported HTML exports, and extracts ALL `followers_*.json` files and `following.json`.
 */
export async function extractInstagramZip(
  input: ZipInputSource,
  onProgress?: (progress: ZipProcessProgress) => void
): Promise<ZipExtractionResult> {
  onProgress?.({
    stage: 'reading',
    percent: 15,
    message: 'Reading ZIP archive locally in your browser...',
  });

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(input);
  } catch {
    const error: AnalyzerError = {
      code: 'CORRUPTED_ZIP',
      title: 'Corrupted or unreadable ZIP file',
      message:
        'We could not open this ZIP archive. The file may be corrupted, incomplete, password-protected, or not a valid ZIP file.',
      suggestion:
        'Try downloading your Instagram information again and upload the fresh ZIP file without modifying it.',
    };
    throw error;
  }

  onProgress?.({
    stage: 'scanning',
    percent: 40,
    message: 'Locating connections/followers_and_following folder...',
  });

  const allFileEntries: { path: string; lowerPath: string; entry: JSZip.JSZipObject }[] = [];

  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) {
      return;
    }
    const normalized = normalizeZipPath(relativePath);
    if (!normalized || isIgnoredSystemEntry(normalized)) {
      return;
    }
    allFileEntries.push({
      path: normalized,
      lowerPath: normalized.toLowerCase(),
      entry: zipEntry,
    });
  });

  if (allFileEntries.length === 0) {
    const error: AnalyzerError = {
      code: 'CORRUPTED_ZIP',
      title: 'ZIP archive is empty',
      message: 'This ZIP archive does not contain any files.',
      suggestion:
        'Download your Instagram Followers and following export in JSON format and try again.',
      showInstructionsAction: true,
    };
    throw error;
  }

  // Locate `connections/followers_and_following/` dynamically at any nesting depth
  const connectionsFolderRegex = /(?:^|\/)connections\/followers_and_following\/[^/]+$/i;
  const directFolderRegex = /(?:^|\/)followers_and_following\/[^/]+$/i;

  let folderFiles = allFileEntries.filter((f) => connectionsFolderRegex.test(f.lowerPath));
  if (folderFiles.length === 0) {
    folderFiles = allFileEntries.filter((f) => directFolderRegex.test(f.lowerPath));
  }

  // Check for HTML export anywhere in the target folder or ZIP
  const htmlFilesInTarget = folderFiles.filter((f) => {
    const base = getBasename(f.path);
    return HTML_FOLLOW_FILE_REGEX.test(base) || base.toLowerCase().endsWith('.html') || base.toLowerCase().endsWith('.htm');
  });

  const anyHtmlFollowFilesInZip = allFileEntries.filter((f) =>
    HTML_FOLLOW_FILE_REGEX.test(getBasename(f.path))
  );

  // Determine follower and following JSON files within the located folder
  const followerEntries = folderFiles
    .filter((f) => FOLLOWERS_FILE_REGEX.test(getBasename(f.path)))
    .sort((a, b) => naturalSortFileNames(getBasename(a.path), getBasename(b.path)));

  const followingEntries = folderFiles
    .filter((f) => FOLLOWING_FILE_REGEX.test(getBasename(f.path)))
    .sort((a, b) => naturalSortFileNames(getBasename(a.path), getBasename(b.path)));

  // If HTML follow export was detected and JSON files are absent, show explicit HTML error
  if (
    (htmlFilesInTarget.length > 0 || anyHtmlFollowFilesInZip.length > 0) &&
    followerEntries.length === 0 &&
    followingEntries.length === 0
  ) {
    throw createHtmlExportError(
      'We detected HTML files (such as followers_1.html or following.html) in this ZIP archive. Instagram defaults to HTML format, which is unsupported. Please re-export your data with Format set to JSON.'
    );
  }

  // If connections/followers_and_following folder is completely missing
  if (folderFiles.length === 0) {
    // Check if the ZIP contains general HTML files (likely a full HTML Instagram export)
    const hasAnyHtml = allFileEntries.some(
      (f) => f.lowerPath.endsWith('.html') || f.lowerPath.endsWith('.htm')
    );
    if (hasAnyHtml) {
      throw createHtmlExportError(
        'This archive contains HTML files and is missing the JSON connections/followers_and_following folder. Please re-download your Instagram data in JSON format.'
      );
    }

    const error: AnalyzerError = {
      code: 'MISSING_CONNECTIONS_FOLDER',
      title: 'Missing connections/followers_and_following folder',
      message:
        'We could not find the "connections/followers_and_following" folder inside this ZIP archive.',
      suggestion:
        'When downloading from Instagram Accounts Center, make sure you select "Some of your information" → "Followers and following" and choose Format: JSON.',
      showInstructionsAction: true,
    };
    throw error;
  }

  // Validate required JSON files exist
  if (followerEntries.length === 0 && followingEntries.length === 0) {
    const error: AnalyzerError = {
      code: 'MISSING_FOLLOWERS_JSON',
      title: 'Missing followers and following JSON files',
      message:
        'Found the followers_and_following folder, but it does not contain followers_*.json or following.json.',
      suggestion:
        'Ensure your Instagram export Format was set to JSON and Date Range was set to All time.',
      showInstructionsAction: true,
    };
    throw error;
  }

  if (followerEntries.length === 0) {
    const error: AnalyzerError = {
      code: 'MISSING_FOLLOWERS_JSON',
      title: 'Missing followers JSON file',
      message:
        'Found following.json, but could not find any followers_*.json file (e.g., followers_1.json) in connections/followers_and_following.',
      suggestion:
        'Re-export your Instagram data with "Followers and following" selected, Format set to JSON, and Date Range set to All time.',
      showInstructionsAction: true,
    };
    throw error;
  }

  if (followingEntries.length === 0) {
    const error: AnalyzerError = {
      code: 'MISSING_FOLLOWING_JSON',
      title: 'Missing following.json file',
      message:
        'Found your followers data, but "following.json" is missing from connections/followers_and_following.',
      suggestion:
        'Make sure you included "Followers and following" with Date Range set to All time in JSON format.',
      showInstructionsAction: true,
    };
    throw error;
  }

  onProgress?.({
    stage: 'parsing',
    percent: 65,
    message: `Reading ${followerEntries.length} follower file${
      followerEntries.length === 1 ? '' : 's'
    } and ${followingEntries.length} following file${
      followingEntries.length === 1 ? '' : 's'
    }...`,
  });

  const followersFiles: { name: string; content: string }[] = [];
  for (const item of followerEntries) {
    const content = await item.entry.async('string');
    followersFiles.push({
      name: getBasename(item.path),
      content,
    });
  }

  const followingFiles: { name: string; content: string }[] = [];
  for (const item of followingEntries) {
    const content = await item.entry.async('string');
    followingFiles.push({
      name: getBasename(item.path),
      content,
    });
  }

  const baseFolderPath = getDirname(followerEntries[0].path) || 'connections/followers_and_following';

  return {
    followersFiles,
    followingFiles,
    baseFolderPath,
    totalFilesInZip: allFileEntries.length,
  };
}
