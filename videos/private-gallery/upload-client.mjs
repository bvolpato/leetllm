import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, open } from 'node:fs/promises';
import { GALLERY_UPLOAD_LIMITS } from './worker.mjs';

export const UPLOAD_CHUNK_BYTES = GALLERY_UPLOAD_LIMITS.chunkBytes;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function transfer(url, options, fetchImpl = fetch) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await fetchImpl(url, { ...options, signal: AbortSignal.timeout(120000) });
      if ((result.status === 429 || result.status >= 500) && attempt < 2) {
        await result.arrayBuffer();
        await new Promise((accept) => setTimeout(accept, 1000 * 2 ** attempt));
        continue;
      }
      return result;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

async function localIdentity(source) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(source)) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  return { sha256: hash.digest('hex'), bytes };
}

function verifyMetadata(response, asset) {
  return (
    response.status === 200 &&
    response.headers.get('X-Content-SHA256') === asset.sha256 &&
    Number(response.headers.get('Content-Length')) === asset.bytes &&
    response.headers.get('Cache-Control') === 'private, no-store'
  );
}

export async function uploadAsset(
  asset,
  source,
  origin,
  auth,
  { chunkBytes = UPLOAD_CHUNK_BYTES, fetchImpl = fetch } = {},
) {
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes < 1 || chunkBytes > UPLOAD_CHUNK_BYTES)
    throw new Error('Invalid upload chunk size.');
  const actual = await localIdentity(source);
  if (actual.sha256 !== asset.sha256 || actual.bytes !== asset.bytes)
    throw new Error(`Local asset changed: ${asset.path}`);
  const existing = await transfer(
    new URL(`/${asset.path}`, origin),
    { method: 'HEAD', redirect: 'manual', headers: { ...auth, 'Accept-Encoding': 'identity' } },
    fetchImpl,
  );
  if (existing.status === 200) {
    if (!verifyMetadata(existing, asset))
      throw new Error(`Immutable hosted asset differs: ${asset.path}`);
    return { mode: 'already-present', parts: 0 };
  }
  if (existing.status !== 404)
    throw new Error(`Asset preflight failed: ${asset.path}, HTTP ${existing.status}`);
  const key = asset.key ?? asset.path;
  if (asset.bytes <= chunkBytes) {
    const bytes = await readFile(source);
    if (sha256(bytes) !== asset.sha256)
      throw new Error(`Local asset changed during upload: ${asset.path}`);
    const uploaded = await transfer(
      new URL(`/__upload/${key}`, origin),
      {
        method: 'PUT',
        body: bytes,
        redirect: 'manual',
        headers: {
          ...auth,
          'Content-Type': asset.contentType,
          'Content-Length': String(bytes.length),
          'X-Content-SHA256': asset.sha256,
        },
      },
      fetchImpl,
    );
    if (![201, 204].includes(uploaded.status))
      throw new Error(`Upload rejected: ${asset.path}, HTTP ${uploaded.status}`);
    await uploaded.arrayBuffer();
    return { mode: 'direct', parts: 1 };
  }
  const parts = [];
  const streamedHash = createHash('sha256');
  let streamedBytes = 0;
  for await (const bytes of createReadStream(source, { highWaterMark: chunkBytes })) {
    streamedHash.update(bytes);
    streamedBytes += bytes.length;
    const part = { index: parts.length + 1, sha256: sha256(bytes), bytes: bytes.length };
    const uploaded = await transfer(
      new URL(`/__upload-chunk/${asset.sha256}/${part.index}/${part.sha256}`, origin),
      {
        method: 'PUT',
        body: bytes,
        redirect: 'manual',
        headers: {
          ...auth,
          'Content-Type': 'application/octet-stream',
          'Content-Length': String(bytes.length),
          'X-Content-SHA256': part.sha256,
        },
      },
      fetchImpl,
    );
    if (![201, 204].includes(uploaded.status))
      throw new Error(`Chunk ${part.index} rejected: ${asset.path}, HTTP ${uploaded.status}`);
    await uploaded.arrayBuffer();
    parts.push(part);
  }
  if (streamedBytes !== asset.bytes || streamedHash.digest('hex') !== asset.sha256)
    throw new Error(`Local asset changed while streaming: ${asset.path}`);
  const body = JSON.stringify({ parts });
  const completed = await transfer(
    new URL(`/__upload-complete/${key}`, origin),
    {
      method: 'POST',
      body,
      redirect: 'manual',
      headers: {
        ...auth,
        'Content-Type': 'application/json',
        'Content-Length': String(Buffer.byteLength(body)),
        'X-Content-SHA256': asset.sha256,
        'X-Object-Length': String(asset.bytes),
        'X-Object-Content-Type': asset.contentType,
      },
    },
    fetchImpl,
  );
  if (![201, 204].includes(completed.status))
    throw new Error(`Completion rejected: ${asset.path}, HTTP ${completed.status}`);
  await completed.arrayBuffer();
  return { mode: 'chunked-stream-assembly', parts: parts.length };
}

export async function verifyRemoteAsset(asset, source, origin, auth, { fetchImpl = fetch } = {}) {
  const local = await localIdentity(source);
  if (local.sha256 !== asset.sha256 || local.bytes !== asset.bytes)
    throw new Error(`Local asset changed: ${asset.path}`);
  const url = new URL(`/${asset.path}`, origin);
  const head = await transfer(
    url,
    { method: 'HEAD', redirect: 'manual', headers: { ...auth, 'Accept-Encoding': 'identity' } },
    fetchImpl,
  );
  if (!verifyMetadata(head, asset))
    throw new Error(`Hosted metadata differs: ${asset.path}, HTTP ${head.status}`);
  const response = await transfer(
    url,
    { redirect: 'manual', headers: { ...auth, 'Accept-Encoding': 'identity' } },
    fetchImpl,
  );
  if (response.status !== 200 || !response.body)
    throw new Error(`Hosted download failed: ${asset.path}, HTTP ${response.status}`);
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of response.body) {
    hash.update(chunk);
    bytes += chunk.length;
  }
  if (hash.digest('hex') !== asset.sha256 || bytes !== asset.bytes)
    throw new Error(`Hosted full payload differs: ${asset.path}`);
  let rangeVerified = false;
  if (asset.contentType === 'video/mp4') {
    const start = Math.floor(asset.bytes / 2),
      end = Math.min(asset.bytes - 1, start + 4095);
    const range = await transfer(
      url,
      { redirect: 'manual', headers: { ...auth, Range: `bytes=${start}-${end}` } },
      fetchImpl,
    );
    const file = await open(source, 'r');
    const expected = Buffer.alloc(end - start + 1);
    try {
      await file.read(expected, 0, expected.length, start);
    } finally {
      await file.close();
    }
    if (
      range.status !== 206 ||
      range.headers.get('Content-Range') !== `bytes ${start}-${end}/${asset.bytes}` ||
      !Buffer.from(await range.arrayBuffer()).equals(expected)
    )
      throw new Error(`Hosted video seek differs: ${asset.path}`);
    rangeVerified = true;
  }
  return {
    path: asset.path,
    sha256: asset.sha256,
    bytes: asset.bytes,
    metadataVerified: true,
    fullHashVerified: true,
    rangeVerified,
  };
}
