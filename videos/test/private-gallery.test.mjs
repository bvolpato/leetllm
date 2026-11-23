import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createGalleryWorker, parseRange } from '../private-gallery/worker.mjs';

test('media ranges support browser seeks, suffixes, and clamped ends', () => {
  assert.deepEqual(parseRange('bytes=2-5', 10), { offset: 2, length: 4 });
  assert.deepEqual(parseRange('bytes=8-', 10), { offset: 8, length: 2 });
  assert.deepEqual(parseRange('bytes=-4', 10), { offset: 6, length: 4 });
  assert.deepEqual(parseRange('bytes=8-100', 10), { offset: 8, length: 2 });
  for (const range of [
    'bytes=10-',
    'bytes=5-2',
    'bytes=-0',
    'bytes=-',
    'bytes=0-1,4-5',
    'bytes=9007199254740993-',
  ])
    assert.equal(parseRange(range, 10), null);
});

function storage() {
  const entries = new Map();
  return {
    entries,
    BUCKET: {
      async head(key) {
        return entries.get(key)?.metadata ?? null;
      },
      async put(key, body, options) {
        const bytes = new Uint8Array(await new Response(body).arrayBuffer());
        assert.equal(createHash('sha256').update(bytes).digest('hex'), options.sha256);
        const checksum = createHash('sha256').update(bytes).digest();
        const metadata = {
          size: bytes.length,
          httpEtag: '"fixture-etag"',
          httpMetadata: options.httpMetadata,
          customMetadata: options.customMetadata,
          checksums: {
            sha256: checksum.buffer.slice(
              checksum.byteOffset,
              checksum.byteOffset + checksum.byteLength,
            ),
          },
        };
        entries.set(key, { bytes, metadata });
        return metadata;
      },
      async get(key, { range } = {}) {
        const row = entries.get(key);
        if (!row) return null;
        return {
          ...row.metadata,
          body: new Blob([
            range ? row.bytes.slice(range.offset, range.offset + range.length) : row.bytes,
          ]).stream(),
        };
      },
    },
  };
}
const bytes = new TextEncoder().encode('abcdefghij');
const digest = createHash('sha256').update(bytes).digest('hex');
const key = `media/lesson/${digest}/lesson.mp4`;
const request = (path, init) => new Request(`https://private.test/${path}`, init);
const upload = (path = key, hash = digest) =>
  request(`__upload/${path}`, {
    method: 'PUT',
    body: bytes,
    headers: {
      'X-Content-SHA256': hash,
      'Content-Length': String(bytes.length),
      'Content-Type': 'video/mp4',
    },
  });

test('protected media supports actual GET, HEAD and range bytes with private caching', async () => {
  const worker = createGalleryWorker(),
    env = storage();
  assert.equal((await worker.fetch(upload(), env)).status, 201);
  const head = await worker.fetch(request(key, { method: 'HEAD' }), env);
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('Content-Length'), '10');
  assert.equal(await head.text(), '');
  const range = await worker.fetch(request(key, { headers: { Range: 'bytes=2-5' } }), env);
  assert.equal(range.status, 206);
  assert.equal(await range.text(), 'cdef');
  assert.equal(range.headers.get('Content-Range'), 'bytes 2-5/10');
  assert.equal(range.headers.get('X-Content-SHA256'), digest);
  assert.equal(range.headers.get('Cache-Control'), 'private, no-store');
  const full = await worker.fetch(
    request(key, { headers: { Range: 'bytes=2-5', 'If-Range': '"outdated"' } }),
    env,
  );
  assert.equal(full.status, 200);
  assert.equal(await full.text(), 'abcdefghij');
  const bad = await worker.fetch(request(key, { headers: { Range: 'bytes=99-' } }), env);
  assert.equal(bad.status, 416);
  assert.equal(bad.headers.get('Content-Range'), 'bytes */10');
});

test('upload is immutable, checksum-bound, size-limited and path-restricted', async () => {
  const worker = createGalleryWorker(),
    env = storage();
  assert.equal((await worker.fetch(upload(), env)).status, 201);
  assert.equal((await worker.fetch(upload(), env)).status, 204);
  assert.equal((await worker.fetch(upload(key, '0'.repeat(64)), env)).status, 400);
  assert.equal((await worker.fetch(upload('arbitrary/file'), env)).status, 400);
  assert.equal(
    (
      await worker.fetch(
        request('__upload/assets/file', {
          method: 'PUT',
          body: bytes,
          headers: { 'X-Content-SHA256': digest, 'Content-Length': '50000000' },
        }),
        env,
      )
    ).status,
    400,
  );
  assert.equal(
    (await worker.fetch(request(`__upload/${key}`, { method: 'GET' }), env)).status,
    405,
  );
  const existing = env.entries.get(key);
  existing.metadata.customMetadata.sha256 = '0'.repeat(64);
  assert.equal((await worker.fetch(upload(), env)).status, 409);
  existing.metadata.customMetadata.sha256 = digest;
  existing.metadata.checksums.sha256 = new ArrayBuffer(32);
  assert.equal((await worker.fetch(upload(), env)).status, 409);
});

test('gallery HTML and missing routes are private and non-indexable', async () => {
  const worker = createGalleryWorker({
    'index.html': { body: '<h1>Review</h1>', contentType: 'text/html' },
  });
  const page = await worker.fetch(request(''), storage());
  assert.equal(await page.text(), '<h1>Review</h1>');
  assert.match(page.headers.get('X-Robots-Tag'), /noindex/);
  assert.equal((await worker.fetch(request('missing'), storage())).status, 404);
  assert.equal(
    (await worker.fetch(request('index.html', { method: 'POST' }), storage())).status,
    405,
  );
});
