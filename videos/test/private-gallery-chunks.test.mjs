import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { uploadAsset, verifyRemoteAsset } from '../private-gallery/upload-client.mjs';

const { createGalleryWorker } = await import(
  process.env.GALLERY_WORKER_SOURCE ?? '../private-gallery/worker.mjs'
);
const chunkBytes = 1024 * 1024;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const sourceBytes = Buffer.alloc(2 * chunkBytes + 137, 73);
const digest = hash(sourceBytes);
const key = `media/lesson/${digest}/lesson.mp4`;

function fixedLengthStream(length) {
  let size = 0;
  return new TransformStream({
    transform(bytes, controller) {
      size += bytes.length;
      if (size > length) throw new Error('Too many bytes');
      controller.enqueue(bytes);
    },
    flush() {
      assert.equal(size, length);
    },
  });
}

function storage() {
  const entries = new Map();
  return {
    entries,
    BUCKET: {
      async head(key) {
        return entries.get(key)?.metadata ?? null;
      },
      async put(key, body, options) {
        if (options.onlyIf && entries.has(key)) return null;
        const bytes = Buffer.from(await new Response(body).arrayBuffer());
        assert.equal(
          hash(bytes),
          options.sha256,
          'Storage verifies actual SHA-256 before committing',
        );
        const metadata = {
          size: bytes.length,
          httpEtag: `"${hash(bytes)}"`,
          httpMetadata: options.httpMetadata,
          customMetadata: options.customMetadata,
          checksums: { sha256: createHash('sha256').update(bytes).digest().buffer },
        };
        entries.set(key, { bytes, metadata });
        return metadata;
      },
      async get(key, { range } = {}) {
        const entry = entries.get(key);
        if (!entry) return null;
        const bytes = range
          ? entry.bytes.subarray(range.offset, range.offset + range.length)
          : entry.bytes;
        return { ...entry.metadata, body: new Blob([bytes]).stream() };
      },
      async delete(keys) {
        for (const key of Array.isArray(keys) ? keys : [keys]) entries.delete(key);
      },
    },
  };
}

function fixture() {
  const env = storage();
  const worker = createGalleryWorker({}, { chunkBytes, createLengthStream: fixedLengthStream });
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    const request = new Request(url, options);
    requests.push({
      path: new URL(url).pathname,
      method: request.method,
      bytes: Number(request.headers.get('Content-Length') ?? 0),
    });
    return worker.fetch(request, env);
  };
  return { env, worker, fetchImpl, requests };
}

const request = (route, options) => new Request(`https://private.test/${route}`, options);
const partsOf = (bytes) =>
  Array.from({ length: Math.ceil(bytes.length / chunkBytes) }, (_, index) => {
    const part = bytes.subarray(index * chunkBytes, (index + 1) * chunkBytes);
    return { index: index + 1, sha256: hash(part), bytes: part.length, body: part };
  });
async function stage(worker, env, parts, wholeDigest = digest) {
  for (const part of parts) {
    const response = await worker.fetch(
      request(`__upload-chunk/${wholeDigest}/${part.index}/${part.sha256}`, {
        method: 'PUT',
        body: part.body,
        headers: { 'Content-Length': String(part.bytes), 'X-Content-SHA256': part.sha256 },
      }),
      env,
    );
    assert([201, 204].includes(response.status), `Chunk status ${response.status}`);
  }
}
function completion(
  parts,
  { objectKey = key, wholeDigest = digest, length = sourceBytes.length } = {},
) {
  const body = JSON.stringify({ parts: parts.map(({ body, ...part }) => part) });
  return request(`__upload-complete/${objectKey}`, {
    method: 'POST',
    body,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
      'X-Content-SHA256': wholeDigest,
      'X-Object-Length': String(length),
      'X-Object-Content-Type': 'video/mp4',
    },
  });
}

test('1 MiB requests assemble actual whole bytes, resume idempotently and retain seek semantics', async (t) => {
  const f = fixture();
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gallery-chunks-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'movie.mp4');
  await writeFile(file, sourceBytes);
  const asset = {
    path: key,
    key,
    sha256: digest,
    bytes: sourceBytes.length,
    contentType: 'video/mp4',
  };
  assert.deepEqual(
    await uploadAsset(
      asset,
      file,
      'https://private.test',
      {},
      { chunkBytes, fetchImpl: f.fetchImpl },
    ),
    { mode: 'chunked-stream-assembly', parts: 3 },
  );
  assert.deepEqual(f.env.entries.get(key).bytes, sourceBytes);
  assert.equal(
    [...f.env.entries.keys()].filter((value) => value.startsWith('__gallery_chunks/')).length,
    0,
  );
  assert(f.requests.every((request) => request.bytes <= chunkBytes));
  const verified = await verifyRemoteAsset(
    asset,
    file,
    'https://private.test',
    {},
    { fetchImpl: f.fetchImpl },
  );
  assert.equal(verified.fullHashVerified, true);
  assert.equal(verified.rangeVerified, true);
  assert.equal(
    (
      await uploadAsset(
        asset,
        file,
        'https://private.test',
        {},
        { chunkBytes, fetchImpl: f.fetchImpl },
      )
    ).mode,
    'already-present',
  );
});

test('staged chunks are immutable and actual checksum failures cannot commit', async () => {
  const { worker, env } = fixture(),
    parts = partsOf(sourceBytes);
  await stage(worker, env, parts);
  await stage(worker, env, parts);
  const bad = await worker.fetch(
    request(`__upload-chunk/${digest}/4/${parts[0].sha256}`, {
      method: 'PUT',
      body: Buffer.alloc(chunkBytes, 12),
      headers: { 'Content-Length': String(chunkBytes), 'X-Content-SHA256': parts[0].sha256 },
    }),
    env,
  );
  assert.equal(bad.status, 422);
  assert.equal(await env.BUCKET.head(`__gallery_chunks/${digest}/4/${parts[0].sha256}`), null);
});

test('missing, reordered and duplicate parts never create a final object', async () => {
  const { worker, env } = fixture(),
    parts = partsOf(sourceBytes);
  assert.equal((await worker.fetch(completion(parts), env)).status, 409);
  await stage(worker, env, parts);
  assert.equal((await worker.fetch(completion([parts[1], parts[0], parts[2]]), env)).status, 400);
  assert.equal((await worker.fetch(completion([parts[0], parts[0], parts[2]]), env)).status, 400);
  const malformed = completion(parts);
  const body = JSON.stringify({ parts: [null] });
  const headers = new Headers(malformed.headers);
  headers.set('Content-Length', String(Buffer.byteLength(body)));
  assert.equal(
    (await worker.fetch(new Request(malformed.url, { method: 'POST', body, headers }), env)).status,
    400,
  );
  assert.equal(await env.BUCKET.head(key), null);
});

test('the full assembled SHA-256 is checked independently of correct chunk hashes', async () => {
  const { worker, env } = fixture(),
    parts = partsOf(sourceBytes),
    wrong = '0'.repeat(64);
  const wrongKey = `media/lesson/${wrong}/lesson.mp4`;
  await stage(worker, env, parts, wrong);
  assert.equal(
    (await worker.fetch(completion(parts, { wholeDigest: wrong, objectKey: wrongKey }), env))
      .status,
    422,
  );
  assert.equal(await env.BUCKET.head(wrongKey), null);
  assert.equal(env.entries.size, 3, 'Verified chunks remain available for diagnosis or retry');
});

test('completion keeps existing objects immutable and enforces bounded metadata', async () => {
  const { worker, env } = fixture(),
    parts = partsOf(sourceBytes);
  await stage(worker, env, parts);
  assert.equal((await worker.fetch(completion(parts), env)).status, 201);
  assert.equal((await worker.fetch(completion(parts), env)).status, 204);
  assert.equal(
    (await worker.fetch(completion(parts, { length: sourceBytes.length + 1 }), env)).status,
    409,
  );
  assert.deepEqual(env.entries.get(key).bytes, sourceBytes);
  assert.equal((await worker.fetch(completion(parts, { length: 2 * 1024 ** 3 }), env)).status, 400);
  assert.equal(
    (
      await worker.fetch(
        request(`__upload-chunk/${digest}/129/${digest}`, {
          method: 'PUT',
          body: 'x',
          headers: { 'Content-Length': '1', 'X-Content-SHA256': digest },
        }),
        env,
      )
    ).status,
    400,
  );
  assert.equal(
    (await worker.fetch(request(`__upload-chunk/${digest}/1/${digest}`, { method: 'GET' }), env))
      .status,
    405,
  );
});

test('cleanup failure preserves the completed object and is reported separately', async () => {
  const { worker, env } = fixture(),
    parts = partsOf(sourceBytes);
  await stage(worker, env, parts);
  env.BUCKET.delete = async () => {
    throw new Error('Temporary cleanup failure');
  };
  const result = await worker.fetch(completion(parts), env);
  assert.equal(result.status, 201);
  assert.equal((await result.json()).stagingRemoved, false);
  assert.deepEqual(env.entries.get(key).bytes, sourceBytes);
});

test(
  'a concurrent conditional put cancels the stream instead of hanging',
  { timeout: 2000 },
  async () => {
    const { worker, env } = fixture(),
      parts = partsOf(sourceBytes);
    await stage(worker, env, parts);
    const put = env.BUCKET.put;
    env.BUCKET.put = async (...args) => (args[0] === key ? null : put(...args));
    assert.equal((await worker.fetch(completion(parts), env)).status, 409);
  },
);

test('the client rejects changed local bytes before sending an upload', async (t) => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'gallery-client-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const file = path.join(dir, 'changed.mp4');
  await writeFile(file, 'changed');
  let requests = 0;
  await assert.rejects(
    uploadAsset(
      { path: key, sha256: digest, bytes: sourceBytes.length },
      file,
      'https://private.test',
      {},
      {
        fetchImpl: async () => {
          requests++;
        },
      },
    ),
    /Local asset changed/,
  );
  assert.equal(requests, 0);
});
