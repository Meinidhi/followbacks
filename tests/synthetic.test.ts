import JSZip from 'jszip';
import {
  ACCOUNTS_PER_PAGE,
  analyzeInstagramZip,
  filterAndSortAccounts,
  paginateAccounts,
} from '../src/utils/ComparisonEngine';
import {
  CATEGORY_CSV_FILENAMES,
  escapeCsvField,
  generateAccountsCsv,
  revokeAllObjectUrls,
} from '../src/utils/csvUtils';
import { validateSelectedFile } from '../src/utils/ZipProcessor';
import type { AnalyzerError } from '../src/types/analyzer';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

function assertEqual<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(
      `ASSERTION FAILED: ${message} (expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)})`
    );
  }
}

function makeFollowerItem(username: string, timestamp = 1710000000) {
  return {
    title: '',
    media_list_data: [],
    string_list_data: [
      {
        href: `https://www.instagram.com/${username}`,
        value: username,
        timestamp,
      },
    ],
  };
}

function makeFollowingTitleOnlyItem(username: string, timestamp = 1710000500) {
  return {
    title: username,
    string_list_data: [
      {
        href: `https://www.instagram.com/_u/${username}`,
        timestamp,
      },
    ],
  };
}

function makeHrefOnlyItem(username: string, timestamp = 1710000900) {
  return {
    title: '',
    string_list_data: [
      {
        href: `https://www.instagram.com/_u/${username}/`,
        timestamp,
      },
    ],
  };
}

async function buildZipBuffer(files: Record<string, string>): Promise<Uint8Array> {
  const zip = new JSZip();
  for (const [path, content] of Object.entries(files)) {
    zip.file(path, content);
  }
  return zip.generateAsync({ type: 'uint8array' });
}

async function expectAnalyzerError(
  fn: () => Promise<unknown>,
  expectedCode: AnalyzerError['code'],
  label: string
): Promise<AnalyzerError> {
  try {
    await fn();
  } catch (err) {
    const analyzerErr = err as AnalyzerError;
    assertEqual(analyzerErr.code, expectedCode, `${label} error code`);
    return analyzerErr;
  }
  throw new Error(`ASSERTION FAILED: ${label} should have thrown ${expectedCode}`);
}

async function runTests() {
  const results: string[] = [];

  // 1. Single followers file + schema variations + timestamp protection
  {
    const zipBuf = await buildZipBuffer({
      'connections/followers_and_following/followers_1.json': JSON.stringify([
        makeFollowerItem('Alice_One'),
        makeFollowerItem('bob.two'),
        makeHrefOnlyItem('charlie_three'),
        // Timestamp trap: title is numeric timestamp, href has real username
        {
          title: '1710000999',
          string_list_data: [
            { href: 'https://www.instagram.com/real_user_from_href', timestamp: 1710000999 },
          ],
        },
        // Pure timestamp entry with no valid username — MUST be skipped
        {
          title: '',
          string_list_data: [{ value: '1710001234', timestamp: 1710001234 }],
        },
      ]),
      'connections/followers_and_following/following.json': JSON.stringify({
        relationships_following: [
          makeFollowingTitleOnlyItem('alice_one'), // mutual (different casing!)
          makeFollowerItem('dave_nonfollower'),
          makeFollowerItem('eve_nonfollower'),
        ],
      }),
    });

    const res = await analyzeInstagramZip(zipBuf, {
      fileName: 'single.zip',
      fileSizeBytes: zipBuf.byteLength,
    });

    assertEqual(res.stats.followersCount, 4, 'Test 1 unique followers');
    assertEqual(res.stats.followingCount, 3, 'Test 1 unique following');
    assertEqual(res.stats.mutualCount, 1, 'Test 1 mutual');
    assertEqual(res.stats.nonFollowersCount, 2, 'Test 1 non-followers');
    assertEqual(res.stats.youDontFollowBackCount, 3, 'Test 1 you don\'t follow back');
    assert(res.stats.invariantsValid, 'Test 1 invariants');
    assertEqual(
      res.stats.followingCount,
      res.stats.mutualCount + res.stats.nonFollowersCount,
      'Test 1 Following = Mutual + Non-followers'
    );
    assertEqual(
      res.stats.followersCount,
      res.stats.mutualCount + res.stats.youDontFollowBackCount,
      'Test 1 Followers = Mutual + You don\'t follow back'
    );
    // Preserved display casing & no timestamps in usernames
    assertEqual(res.mutualFollowers[0].username, 'Alice_One', 'Test 1 display casing preserved');
    assert(
      !res.youDontFollowBack.some((a) => /^\d{9,14}$/.test(a.username)),
      'Test 1 no timestamps as usernames'
    );
    results.push('1. Single followers file + schema variations + timestamp guard: PASS');
  }

  // 2. Multiple followers files (nested archive folder + natural ordering)
  {
    const zipBuf = await buildZipBuffer({
      'instagram-export-2026/connections/followers_and_following/followers_1.json': JSON.stringify([
        makeFollowerItem('user_a'),
        makeFollowerItem('user_b'),
      ]),
      'instagram-export-2026/connections/followers_and_following/followers_2.json': JSON.stringify([
        makeFollowerItem('user_c'),
      ]),
      'instagram-export-2026/connections/followers_and_following/followers_10.json': JSON.stringify([
        makeFollowerItem('user_d'),
      ]),
      'instagram-export-2026/connections/followers_and_following/following.json': JSON.stringify({
        relationships_following: [
          makeFollowerItem('user_a'),
          makeFollowerItem('user_d'),
          makeFollowerItem('user_z'),
        ],
      }),
      // Noise files that must be ignored
      'instagram-export-2026/connections/followers_and_following/following_hashtags.json': JSON.stringify({
        relationships_following_hashtags: [makeFollowerItem('hashtag_noise')],
      }),
      '__MACOSX/instagram-export-2026/connections/followers_and_following/._followers_1.json': 'binary-junk',
    });

    const res = await analyzeInstagramZip(zipBuf, {
      fileName: 'multi.zip',
      fileSizeBytes: zipBuf.byteLength,
    });

    assertEqual(res.metadata.followersFileNames.length, 3, 'Test 2 detected 3 follower files');
    assertEqual(res.metadata.followersFileNames[2], 'followers_10.json', 'Test 2 natural sort order');
    assertEqual(res.stats.followersCount, 4, 'Test 2 total unique followers across 3 files');
    assertEqual(res.stats.followingCount, 3, 'Test 2 following count ignores hashtags');
    assertEqual(res.stats.mutualCount, 2, 'Test 2 mutual');
    assertEqual(res.stats.nonFollowersCount, 1, 'Test 2 non-followers');
    assertEqual(res.stats.youDontFollowBackCount, 2, 'Test 2 you don\'t follow back');
    results.push('2. Multiple followers_*.json files + nested folder + macOS noise ignore: PASS');
  }

  // 3. Duplicate usernames & different username casing / whitespace / @
  {
    const zipBuf = await buildZipBuffer({
      'connections/followers_and_following/followers_1.json': JSON.stringify([
        makeFollowerItem('  @DesignStudio  '),
        makeFollowerItem('designstudio'),
        makeFollowerItem('DESIGNSTUDIO'),
      ]),
      'connections/followers_and_following/followers_2.json': JSON.stringify([
        makeFollowerItem('@DesignStudio'),
        makeFollowerItem('CleanUser'),
      ]),
      'connections/followers_and_following/following.json': JSON.stringify({
        relationships_following: [
          makeFollowerItem('  @designstudio '),
          makeFollowerItem('DESIGNSTUDIO'),
          makeFollowerItem('@OnlyFollowed'),
          makeFollowerItem('onlyfollowed'),
        ],
      }),
    });

    const res = await analyzeInstagramZip(zipBuf, {
      fileName: 'dupes.zip',
      fileSizeBytes: zipBuf.byteLength,
    });

    assertEqual(res.stats.followersCount, 2, 'Test 3 deduplicated followers');
    assertEqual(res.stats.followingCount, 2, 'Test 3 deduplicated following');
    assertEqual(res.stats.mutualCount, 1, 'Test 3 case-insensitive mutual match');
    assertEqual(res.stats.nonFollowersCount, 1, 'Test 3 non-follower');
    assertEqual(res.stats.youDontFollowBackCount, 1, 'Test 3 you don\'t follow back');
    assertEqual(res.metadata.followerDuplicatesRemoved, 3, 'Test 3 follower duplicates count');
    assertEqual(res.metadata.followingDuplicatesRemoved, 2, 'Test 3 following duplicates count');
    assertEqual(res.mutualFollowers[0].username, 'DesignStudio', 'Test 3 preserved original casing without @');
    assertEqual(res.nonFollowers[0].username, 'OnlyFollowed', 'Test 3 non-follower display casing without @');
    results.push('3. Duplicate usernames + casing + @ trimming + whitespace normalization: PASS');
  }

  // 4. Invalid / Corrupted ZIP
  {
    const corruptBytes = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    await expectAnalyzerError(
      () =>
        analyzeInstagramZip(corruptBytes, {
          fileName: 'corrupt.zip',
          fileSizeBytes: corruptBytes.byteLength,
        }),
      'CORRUPTED_ZIP',
      'Test 4 corrupted ZIP'
    );
    results.push('4. Invalid / corrupted ZIP error handling: PASS');
  }

  // 5. Missing following.json, missing folder, invalid JSON structure
  {
    const missingFollowingZip = await buildZipBuffer({
      'connections/followers_and_following/followers_1.json': JSON.stringify([
        makeFollowerItem('only_follower'),
      ]),
    });
    await expectAnalyzerError(
      () =>
        analyzeInstagramZip(missingFollowingZip, {
          fileName: 'no-following.zip',
          fileSizeBytes: missingFollowingZip.byteLength,
        }),
      'MISSING_FOLLOWING_JSON',
      'Test 5a missing following.json'
    );

    const missingFolderZip = await buildZipBuffer({
      'media/posts/photo.txt': 'hello',
    });
    await expectAnalyzerError(
      () =>
        analyzeInstagramZip(missingFolderZip, {
          fileName: 'no-folder.zip',
          fileSizeBytes: missingFolderZip.byteLength,
        }),
      'MISSING_CONNECTIONS_FOLDER',
      'Test 5b missing connections folder'
    );

    const invalidJsonZip = await buildZipBuffer({
      'connections/followers_and_following/followers_1.json': '{ not valid json',
      'connections/followers_and_following/following.json': JSON.stringify({
        relationships_following: [],
      }),
    });
    await expectAnalyzerError(
      () =>
        analyzeInstagramZip(invalidJsonZip, {
          fileName: 'bad-json.zip',
          fileSizeBytes: invalidJsonZip.byteLength,
        }),
      'INVALID_JSON_STRUCTURE',
      'Test 5c malformed JSON'
    );
    results.push('5. Missing following.json + missing folder + malformed JSON: PASS');
  }

  // 6. Empty lists & Zero non-followers
  {
    const emptyZip = await buildZipBuffer({
      'connections/followers_and_following/followers_1.json': JSON.stringify([]),
      'connections/followers_and_following/following.json': JSON.stringify({
        relationships_following: [],
      }),
    });
    const emptyRes = await analyzeInstagramZip(emptyZip, {
      fileName: 'empty.zip',
      fileSizeBytes: emptyZip.byteLength,
    });
    assertEqual(emptyRes.stats.followersCount, 0, 'Test 6a empty followers');
    assertEqual(emptyRes.stats.followingCount, 0, 'Test 6a empty following');
    assertEqual(emptyRes.stats.followBackRate, 0, 'Test 6a divide-by-zero safe rate');

    const zeroNonFollowersZip = await buildZipBuffer({
      'connections/followers_and_following/followers_1.json': JSON.stringify([
        makeFollowerItem('friend_1'),
        makeFollowerItem('friend_2'),
        makeFollowerItem('fan_1'),
      ]),
      'connections/followers_and_following/following.json': JSON.stringify({
        relationships_following: [
          makeFollowerItem('friend_1'),
          makeFollowerItem('friend_2'),
        ],
      }),
    });
    const zeroNonRes = await analyzeInstagramZip(zeroNonFollowersZip, {
      fileName: 'all-mutual.zip',
      fileSizeBytes: zeroNonFollowersZip.byteLength,
    });
    assertEqual(zeroNonRes.stats.nonFollowersCount, 0, 'Test 6b zero non-followers');
    assertEqual(zeroNonRes.stats.mutualCount, 2, 'Test 6b all following are mutual');
    assertEqual(zeroNonRes.stats.followBackRate, 100, 'Test 6b 100% follow-back rate');
    results.push('6. Empty lists + zero non-followers state: PASS');
  }

  // 7. Thousands of accounts across multiple files (6,500 followers, 5,200 following)
  {
    // Mutual: user_0000 .. user_3999 (4,000)
    // Followers only (you don't follow back): fan_0000 .. fan_2499 (2,500) => Total Followers = 6,500
    // Following only (don't follow back): celeb_0000 .. celeb_1199 (1,200) => Total Following = 5,200
    const allFollowers = [
      ...Array.from({ length: 4000 }, (_, i) =>
        makeFollowerItem(`User_${String(i).padStart(4, '0')}`)
      ),
      ...Array.from({ length: 2500 }, (_, i) =>
        makeFollowerItem(`fan_${String(i).padStart(4, '0')}`)
      ),
    ];
    const allFollowing = [
      ...Array.from({ length: 4000 }, (_, i) =>
        makeFollowingTitleOnlyItem(`user_${String(i).padStart(4, '0')}`)
      ),
      ...Array.from({ length: 1200 }, (_, i) =>
        makeFollowerItem(`celeb_${String(i).padStart(4, '0')}`)
      ),
    ];

    const largeZip = await buildZipBuffer({
      'connections/followers_and_following/followers_1.json': JSON.stringify(
        allFollowers.slice(0, 2000)
      ),
      'connections/followers_and_following/followers_2.json': JSON.stringify(
        allFollowers.slice(2000, 4000)
      ),
      'connections/followers_and_following/followers_3.json': JSON.stringify(
        allFollowers.slice(4000, 6000)
      ),
      'connections/followers_and_following/followers_4.json': JSON.stringify(
        allFollowers.slice(6000)
      ),
      'connections/followers_and_following/following.json': JSON.stringify({
        relationships_following: allFollowing,
      }),
    });

    const largeRes = await analyzeInstagramZip(largeZip, {
      fileName: 'large_6500.zip',
      fileSizeBytes: largeZip.byteLength,
    });

    assertEqual(largeRes.stats.followersCount, 6500, 'Test 7 followers count');
    assertEqual(largeRes.stats.followingCount, 5200, 'Test 7 following count');
    assertEqual(largeRes.stats.mutualCount, 4000, 'Test 7 mutual count');
    assertEqual(largeRes.stats.nonFollowersCount, 1200, 'Test 7 non-followers count');
    assertEqual(largeRes.stats.youDontFollowBackCount, 2500, 'Test 7 you don\'t follow back count');
    assert(largeRes.stats.invariantsValid, 'Test 7 invariants valid');

    // Search, sorting & pagination verification on 1,200 non-followers
    const searchMatches = filterAndSortAccounts(largeRes.nonFollowers, 'CELEB_001', 'asc');
    assertEqual(searchMatches.length, 10, 'Test 7 case-insensitive partial search (celeb_0010..0019)');
    assertEqual(searchMatches[0].username, 'celeb_0010', 'Test 7 A-Z first match');

    const descMatches = filterAndSortAccounts(largeRes.nonFollowers, 'celeb_001', 'desc');
    assertEqual(descMatches[0].username, 'celeb_0019', 'Test 7 Z-A first match');

    const page1 = paginateAccounts(largeRes.nonFollowers, 1, ACCOUNTS_PER_PAGE);
    assertEqual(page1.items.length, 25, 'Test 7 page 1 has 25 accounts');
    assertEqual(page1.totalPages, 48, 'Test 7 1200 / 25 = 48 pages');
    assertEqual(page1.startIndex, 0, 'Test 7 page 1 start index');

    const page2 = paginateAccounts(largeRes.nonFollowers, 2, ACCOUNTS_PER_PAGE);
    assertEqual(page2.startIndex, 25, 'Test 7 page 2 start index (serial starts at 26)');
    assertEqual(page2.items.length, 25, 'Test 7 page 2 has 25 accounts');

    results.push(
      `7. Thousands of accounts (6,500 followers / 5,200 following in ${largeRes.metadata.processingTimeMs}ms) + search + sort + pagination: PASS`
    );
  }

  // 8. HTML export detection (inside ZIP and direct .html selection)
  {
    const htmlZip = await buildZipBuffer({
      'connections/followers_and_following/followers_1.html': '<html><body>Followers</body></html>',
      'connections/followers_and_following/following.html': '<html><body>Following</body></html>',
    });

    const htmlErr = await expectAnalyzerError(
      () =>
        analyzeInstagramZip(htmlZip, {
          fileName: 'instagram-html.zip',
          fileSizeBytes: htmlZip.byteLength,
        }),
      'HTML_EXPORT_UNSUPPORTED',
      'Test 8a HTML ZIP export'
    );
    assert(Boolean(htmlErr.showInstructionsAction), 'Test 8a HTML error includes View Download Instructions action');

    // Direct HTML file validation
    const mockHtmlFile = { name: 'followers_1.html', size: 1200, type: 'text/html' } as File;
    const directErr = validateSelectedFile(mockHtmlFile);
    assert(directErr !== null, 'Test 8b direct .html file rejected');
    assertEqual(directErr!.code, 'HTML_EXPORT_UNSUPPORTED', 'Test 8b direct .html error code');
    results.push('8. HTML ZIP export & direct HTML file rejection with instructions CTA: PASS');
  }

  // 9. CSV special characters, UTF-8 BOM, RFC 4180 escaping, and exact filenames
  {
    assertEqual(CATEGORY_CSV_FILENAMES.non_followers, 'instagram_non_followers.csv', 'Test 9 filename non_followers');
    assertEqual(
      CATEGORY_CSV_FILENAMES.you_dont_follow_back,
      'instagram_you_dont_follow_back.csv',
      'Test 9 filename you_dont_follow_back'
    );
    assertEqual(
      CATEGORY_CSV_FILENAMES.mutual_followers,
      'instagram_mutual_followers.csv',
      'Test 9 filename mutual_followers'
    );

    assertEqual(escapeCsvField('simple_user'), 'simple_user', 'Test 9 plain CSV field');
    assertEqual(escapeCsvField('user,with,commas'), '"user,with,commas"', 'Test 9 comma escaping');
    assertEqual(escapeCsvField('user"quote"name'), '"user""quote""name"', 'Test 9 quote escaping');
    assertEqual(escapeCsvField('line1\nline2'), '"line1\nline2"', 'Test 9 newline escaping');

    const csv = generateAccountsCsv([
      {
        normalizedUsername: 'café,"studio"',
        username: 'Café,"Studio"',
        profileUrl: 'https://www.instagram.com/Caf%C3%A9%2C%22Studio%22/',
      },
      {
        normalizedUsername: 'normal.user',
        username: 'Normal.User',
        profileUrl: 'https://www.instagram.com/Normal.User/',
      },
    ]);

    assert(csv.startsWith('\uFEFFSerial Number,Username,Profile URL\r\n'), 'Test 9 UTF-8 BOM + exact header');
    assert(
      csv.includes('1,"Café,""Studio""",https://www.instagram.com/Caf%C3%A9%2C%22Studio%22/'),
      'Test 9 escaped special characters and UTF-8 preserved'
    );
    assert(
      csv.includes('2,Normal.User,https://www.instagram.com/Normal.User/'),
      'Test 9 normal row formatted cleanly'
    );

    // Clear Data object URL revocation safety check
    revokeAllObjectUrls();
    results.push('9. CSV special characters + UTF-8 BOM + exact filenames + Clear Data cleanup: PASS');
  }

  console.log('\nFOLLOWBACK Synthetic Test Suite Results:');
  console.log('=========================================');
  for (const line of results) {
    console.log(`  ✓ ${line}`);
  }
  console.log(`\nAll ${results.length} test groups passed with 100% accuracy.\n`);
}

runTests().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
