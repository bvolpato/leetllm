import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import {
  assetKey,
  assertCompletePublication,
  assertCompleteWebManifest,
  publicationPlan,
  sha256,
  verifyPublicAsset,
  uploadAsset,
  webVideoManifest,
  mergeWebVideoManifest,
  IMMUTABLE_CACHE,
} from '../lib/r2-publication.mjs';
import { cloudflareClient, configureVideoBucket } from '../lib/cloudflare-r2.mjs';
import { parsePublicationOptions } from '../publish-r2.mjs';

test('publication tuning preserves defaults and rejects unbounded or invalid options', () => {
  const defaults = parsePublicationOptions([]);
  assert.equal(defaults.concurrency, 4);
  assert.equal(defaults.uploadTimeoutMs, 180_000);
  const tuned = parsePublicationOptions(['--concurrency', '2', '--upload-timeout-ms', '600000']);
  assert.equal(tuned.concurrency, 2);
  assert.equal(tuned.uploadTimeoutMs, 600_000);
  assert.equal(parsePublicationOptions(['--concurrency', '8']).concurrency, 8);
  assert.equal(parsePublicationOptions(['--upload-timeout-ms', '900000']).uploadTimeoutMs, 900_000);
  for (const value of ['0', '9', '-1', '2.5', 'Infinity', 'not-a-number'])
    assert.throws(() => parsePublicationOptions(['--concurrency', value]), /--concurrency must/);
  for (const value of ['0', '999', '900001', '-1', '1000.5', 'Infinity', '600000ms'])
    assert.throws(
      () => parsePublicationOptions(['--upload-timeout-ms', value]),
      /--upload-timeout-ms must/,
    );
});

test('actual upload request receives its bounded override without changing other Cloudflare deadlines', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'leetllm-r2-deadline-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const bytes = Buffer.from('Synthetic upload integrity fixture');
  const file = path.join(directory, 'asset.mp4');
  await fs.writeFile(file, bytes);
  const asset = {
    file,
    bytes: bytes.length,
    sha256: sha256(bytes),
    key: assetKey('lesson', sha256(bytes), 'mp4'),
    contentType: 'video/mp4',
  };
  const deadlines = [],
    requests = [];
  const originalTimeout = AbortSignal.timeout;
  t.mock.method(AbortSignal, 'timeout', (milliseconds) => {
    deadlines.push(milliseconds);
    return originalTimeout.call(AbortSignal, milliseconds);
  });
  const fetcher = async (url, options) => {
    requests.push({ url, ...options });
    return new Response(JSON.stringify({ success: true, result: { stored: true } }));
  };
  const request = cloudflareClient('synthetic-test-token', { fetcher });
  await request('accounts/account/r2/buckets');
  await uploadAsset(request, { accountId: 'account', bucket: 'bucket' }, asset, {
    timeoutMs: 600_000,
  });
  await cloudflareClient('synthetic-test-token', { fetcher, timeoutMs: 900_000 })(
    'accounts/account/r2/buckets',
  );
  assert.deepEqual(deadlines, [180_000, 600_000, 900_000]);
  assert.equal(requests[1].method, 'PUT');
  assert(requests[1].body.equals(bytes));
  assert(requests[1].signal instanceof AbortSignal);
  for (const value of [0, 999, 900_001, Infinity, NaN])
    assert.throws(
      () => cloudflareClient('synthetic-test-token', { timeoutMs: value, fetcher }),
      /request timeout must/,
    );
  await assert.rejects(request('unused', { timeoutMs: Infinity }), /request timeout must/);

  const timeout = new DOMException('The operation was aborted due to timeout', 'TimeoutError');
  await assert.rejects(
    uploadAsset(
      async () => {
        throw timeout;
      },
      {},
      asset,
    ),
    (error) => {
      assert.match(error.message, new RegExp(`${asset.key}: upload failed:`));
      assert.equal(error.cause, timeout);
      return true;
    },
  );
  await assert.rejects(
    verifyPublicAsset(asset, {
      fetcher: async () => {
        throw timeout;
      },
    }),
    (error) => {
      assert.match(error.message, new RegExp(`${asset.key}: public verification failed:`));
      assert.equal(error.cause, timeout);
      return true;
    },
  );
});

test('the propagated finite request signal actually expires', async () => {
  let observed;
  const request = cloudflareClient('synthetic-test-token', {
    timeoutMs: 1_000,
    fetcher: async (_url, options) => {
      observed = options.signal;
      return new Response(JSON.stringify({ success: true, result: {} }));
    },
  });
  await request('synthetic-deadline');
  assert.equal(observed.aborted, false);
  await delay(1_100);
  assert.equal(observed.aborted, true);
  assert.equal(observed.reason.name, 'TimeoutError');
});

test('exhausted transport errors retain safe nested codes and request identity without credentials', async () => {
  let calls = 0;
  const token = 'synthetic-secret-never-log';
  const transport = Object.assign(new Error('unlogged nested request details'), {
    code: 'UND_ERR_SOCKET',
    headers: { authorization: token },
  });
  const request = cloudflareClient(token, {
    fetcher: async () => {
      calls++;
      throw new TypeError(`fetch failed ${token}`, { cause: transport });
    },
  });
  await assert.rejects(
    request('accounts/account/r2/buckets/bucket/objects/asset', { method: 'PUT' }),
    (error) => {
      assert.match(
        error.message,
        /Cloudflare PUT accounts\/account\/r2\/buckets\/bucket\/objects\/asset/,
      );
      assert.match(error.message, /transport: UND_ERR_SOCKET/);
      assert.equal(error.message.includes(token), false);
      assert.equal(error.message.includes('unlogged nested request details'), false);
      return true;
    },
  );
  assert.equal(calls, 3);
});

test('immutable asset keys bind every file to its own bytes and reject path traversal', () => {
  const a = sha256('old recording'),
    b = sha256('new recording');
  assert.notEqual(assetKey('one-lesson', a, 'mp4'), assetKey('one-lesson', b, 'mp4'));
  assert.throws(() => assetKey('../other', a, 'mp4'));
  assert.throws(() => assetKey('one-lesson', 'unversioned', 'mp4'));
});

test('the web manifest stays unpublished until every selected public asset is verified', () => {
  const plan = {
    videos: [
      {
        articleSlug: 'canonical-article',
        lessonId: 'short-id',
        title: 'A lesson',
        durationSeconds: 12,
        sha256: sha256('movie'),
        assets: [
          { field: 'url', key: 'movie', url: 'https://videos.leetllm.com/movie.mp4' },
          { field: 'captions', key: 'vtt', url: 'https://videos.leetllm.com/captions.vtt' },
        ],
      },
    ],
  };
  assert.throws(() => webVideoManifest(plan, new Set(['movie'])), /Unverified public asset: vtt/);
  const manifest = webVideoManifest(plan, new Set(['movie', 'vtt']));
  assert.equal(manifest.videos['canonical-article'].lessonId, 'short-id');
  assert.equal(
    manifest.videos['canonical-article'].captions,
    'https://videos.leetllm.com/captions.vtt',
  );
  assert.equal(manifest.videos['short-id'], undefined);
});

test('updating article availability rejects a subset that would remove other recordings', () => {
  assert.throws(
    () =>
      assertCompletePublication({ canonicalLessonIds: ['a', 'b'], videos: [{ lessonId: 'a' }] }),
    /Missing: b/,
  );
  assert.doesNotThrow(() =>
    assertCompletePublication({
      canonicalLessonIds: ['a', 'b'],
      videos: [{ lessonId: 'a' }, { lessonId: 'b' }],
    }),
  );
});

function subsetFixture() {
  const domain = 'videos.leetllm.com';
  const publicRow = (id) => ({
    lessonId: id,
    title: `Retained ${id}`,
    durationSeconds: 12,
    sha256: sha256(`old ${id}`),
    url: `https://${domain}/${assetKey(id, sha256(`old ${id}`), 'mp4')}`,
    captions: `https://${domain}/${assetKey(id, sha256(`captions ${id}`), 'vtt')}`,
  });
  const movie = sha256('updated a');
  const captions = sha256('updated captions a');
  const plan = {
    domain,
    canonicalLessonIds: ['a', 'b'],
    videos: [
      {
        articleSlug: 'article-a',
        lessonId: 'a',
        title: 'Updated a',
        durationSeconds: 15,
        sha256: movie,
        sourceFingerprint: sha256('actual receipt fingerprint'),
        assets: [
          {
            field: 'url',
            key: assetKey('a', movie, 'mp4'),
            url: `https://${domain}/${assetKey('a', movie, 'mp4')}`,
          },
          {
            field: 'captions',
            key: assetKey('a', captions, 'vtt'),
            url: `https://${domain}/${assetKey('a', captions, 'vtt')}`,
          },
        ],
      },
    ],
  };
  return {
    plan,
    existing: {
      schemaVersion: 1,
      videos: { 'article-a': publicRow('a'), 'article-b': publicRow('b') },
    },
    verified: new Set(plan.videos[0].assets.map((asset) => asset.key)),
  };
}

test('an explicit verified subset replaces only selected public rows and preserves the complete collection', () => {
  const { plan, existing, verified } = subsetFixture();
  const before = structuredClone(existing);
  const merged = mergeWebVideoManifest(plan, verified, existing);
  assert.deepEqual(existing, before);
  assert.deepEqual(merged.videos['article-b'], before.videos['article-b']);
  assert.equal(merged.videos['article-a'].sha256, plan.videos[0].sha256);
  assert.equal(merged.videos['article-a'].durationSeconds, 15);
  assert.equal(Object.keys(merged.videos).length, 2);
  assert.equal('sourceFingerprint' in merged.videos['article-a'], false);
  assert.equal('recommendation' in merged.videos['article-a'], false);
  assert.throws(() => mergeWebVideoManifest(plan, new Set(), existing), /Unverified public asset/);
  assert.throws(() => assertCompletePublication(plan), /Missing: b/);
});

test('subset merge rejects missing, duplicate or foreign retained lessons and altered immutable URLs', () => {
  const { plan, existing, verified } = subsetFixture();
  const missing = structuredClone(existing);
  delete missing.videos['article-b'];
  assert.throws(
    () => mergeWebVideoManifest(plan, verified, missing),
    /complete canonical collection/,
  );
  const duplicate = structuredClone(existing);
  duplicate.videos.another = duplicate.videos['article-b'];
  assert.throws(() => assertCompleteWebManifest(duplicate, plan), /duplicate lesson/);
  const foreign = structuredClone(existing);
  foreign.videos['article-b'].lessonId = 'foreign';
  assert.throws(() => assertCompleteWebManifest(foreign, plan), /foreign or duplicate lesson/);
  const changed = structuredClone(existing);
  changed.videos['article-b'].url = changed.videos['article-a'].url;
  assert.throws(() => assertCompleteWebManifest(changed, plan), /immutable movie URL/);
  changed.videos['article-b'] = structuredClone(existing.videos['article-b']);
  changed.videos['article-b'].captions = 'https://another.example/captions.vtt';
  assert.throws(() => assertCompleteWebManifest(changed, plan), /immutable captions URL/);
});

test('a selected canonical slug rename cannot overwrite another retained lesson', () => {
  const { plan, existing, verified } = subsetFixture();
  plan.videos[0].articleSlug = 'renamed-a';
  const merged = mergeWebVideoManifest(plan, verified, existing);
  assert.equal(merged.videos['article-a'], undefined);
  assert.equal(merged.videos['renamed-a'].lessonId, 'a');
  assert.deepEqual(merged.videos['article-b'], existing.videos['article-b']);
  plan.videos[0].articleSlug = 'article-b';
  assert.throws(() => mergeWebVideoManifest(plan, verified, existing), /another retained lesson/);
});

test('publication binds the canonical article, movie and caption bytes to the selected export', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'leetllm-r2-plan-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const content = path.join(root, 'web/src/content/foundations/topic');
  const directory = path.join(root, 'delivery/short-id');
  await fs.mkdir(content, { recursive: true });
  await fs.mkdir(directory, { recursive: true });
  const article = '---\n{"slug":"canonical-article","title":"Article"}\n---\nLesson.';
  await fs.writeFile(path.join(content, 'content.md'), article);
  const movie = Buffer.from('teaching movie'),
    captions = Buffer.from('WEBVTT\n\n00:00:00.000 --> 00:00:02.000\nHello.\n');
  await fs.writeFile(path.join(directory, 'short-id.mp4'), movie);
  await fs.writeFile(path.join(directory, 'short-id.vtt'), captions);
  const receipt = {
    id: 'short-id',
    title: 'Lecture',
    fingerprint: sha256('source'),
    source: 'foundations/topic/content.md',
    sourceSha256: sha256(article),
    sha256: sha256(movie),
    bytes: movie.length,
    fullDecode: 'passed',
    frameAudit: { passed: true },
    duration: 2,
    artifactSha256: { 'short-id.mp4': sha256(movie), 'short-id.vtt': sha256(captions) },
  };
  await fs.writeFile(path.join(directory, 'verification.json'), JSON.stringify(receipt));
  const selectionFile = path.join(root, 'selection.json'),
    collectionFile = path.join(root, 'collection.json');
  await fs.writeFile(
    selectionFile,
    JSON.stringify({
      lessons: [
        {
          id: 'short-id',
          sourceDirectory: directory,
          movieSha256: sha256(movie),
          sourceFingerprint: sha256('source'),
        },
      ],
    }),
  );
  await fs.writeFile(
    collectionFile,
    JSON.stringify({ lessons: [{ id: 'short-id', source: 'foundations/topic/content.md' }] }),
  );
  const options = { root, selectionFile, collectionFile, domain: 'videos.leetllm.com' };
  const plan = await publicationPlan(options);
  assert.equal(plan.videos[0].articleSlug, 'canonical-article');
  assert.equal(plan.videos[0].assets[1].sha256, sha256(captions));
  await fs.writeFile(
    path.join(directory, 'verification.json'),
    JSON.stringify({ ...receipt, fingerprint: sha256('different source') }),
  );
  await assert.rejects(publicationPlan(options), /selected source fingerprint differs/);
  await fs.writeFile(
    path.join(directory, 'verification.json'),
    JSON.stringify({ ...receipt, source: 'foundations/another-article/content.md' }),
  );
  await assert.rejects(publicationPlan(options), /export article differs/);
  await fs.writeFile(path.join(directory, 'verification.json'), JSON.stringify(receipt));
  await fs.writeFile(path.join(directory, 'short-id.vtt'), 'WEBVTT\nDifferent lesson.');
  await assert.rejects(publicationPlan(options), /asset does not match the export receipt/);
});

test('public verification checks complete bytes and first, middle and end seek ranges', async (t) => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'leetllm-r2-range-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const bytes = Buffer.from(Array.from({ length: 4096 }, (_, i) => i % 251)),
    file = path.join(directory, 'movie.mp4');
  await fs.writeFile(file, bytes);
  const asset = {
    file,
    url: 'https://videos.leetllm.com/movie.mp4',
    key: 'movie.mp4',
    field: 'url',
    bytes: bytes.length,
    sha256: sha256(bytes),
    contentType: 'video/mp4',
  };
  const fake =
    (corrupt, missingRangeCors = false, rangeCache = 'HIT') =>
    async (_, options) => {
      const range = options.headers.Range?.match(/bytes=(\d+)-(\d+)/),
        headers = {
          'content-type': 'video/mp4',
          'cache-control': IMMUTABLE_CACHE,
          'access-control-allow-origin': '*',
          'cf-cache-status': 'HIT',
        };
      if (range) {
        const start = Number(range[1]),
          end = Number(range[2]);
        headers['cf-cache-status'] = rangeCache;
        if (missingRangeCors) delete headers['access-control-allow-origin'];
        headers['content-range'] = `bytes ${start}-${end}/${bytes.length}`;
        const body = Buffer.from(bytes.subarray(start, end + 1));
        if (corrupt) body[0] ^= 1;
        return new Response(body, { status: 206, headers });
      }
      if (options.method === 'HEAD') headers['cf-cache-status'] = 'DYNAMIC';
      headers['content-length'] = String(bytes.length);
      return new Response(options.method === 'HEAD' ? null : bytes, { headers });
    };
  const proof = await verifyPublicAsset(asset, { fetcher: fake(false) });
  assert.deepEqual(
    proof.ranges.map((row) => row.start),
    [0, 2048, 3072],
  );
  assert.equal(proof.headCacheStatus, 'DYNAMIC');
  assert.equal(proof.cacheStatus, 'HIT');
  await assert.rejects(verifyPublicAsset(asset, { fetcher: fake(true) }), /range bytes mismatch/);
  await assert.rejects(
    verifyPublicAsset(asset, { fetcher: fake(false, true) }),
    /range CORS missing/,
  );
  await assert.rejects(
    verifyPublicAsset(asset, { fetcher: fake(false, false, 'DYNAMIC') }),
    /cached GET did not produce a HIT/,
  );
});

test('bucket setup adds a host-scoped cache rule without replacing unrelated rules', async () => {
  const calls = [],
    otherRule = { id: 'existing', ref: 'keep-this' };
  const request = async (resource, options = {}) => {
    calls.push({ resource, ...options });
    if (resource.endsWith('/buckets')) return { buckets: [{ name: 'leetllm-videos' }] };
    if (resource.endsWith('/domains/custom'))
      return { domains: [{ domain: 'videos.leetllm.com', enabled: true }] };
    if (resource.endsWith('/entrypoint')) return { id: 'ruleset', rules: [otherRule] };
    return {};
  };
  await configureVideoBucket(request, {
    accountId: 'account',
    zoneId: 'zone',
    bucket: 'leetllm-videos',
    domain: 'videos.leetllm.com',
  });
  const added = calls.find((row) => row.resource.endsWith('/rulesets/ruleset/rules'));
  assert.equal(added.method, 'POST');
  assert.match(JSON.parse(added.body).expression, /http.host eq "videos.leetllm.com"/);
  assert.equal(
    calls.some((row) => row.method === 'PUT' && row.resource.includes('/rulesets/')),
    false,
  );
  assert.deepEqual(otherRule, { id: 'existing', ref: 'keep-this' });
});
