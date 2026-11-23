// Sites must retain owner-only access. Its dispatch protects HTML and media alike.
const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
};
const response = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { ...privateHeaders, ...headers } });
const validKey = (key) =>
  /^(media|assets)\/[a-zA-Z0-9._/-]+$/.test(key) &&
  !key.split('/').some((part) => part === '.' || part === '..' || !part);
const storedDigest = (object) =>
  [...new Uint8Array(object.checksums?.sha256 ?? [])]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
export const GALLERY_UPLOAD_LIMITS = Object.freeze({
  chunkBytes: 8 * 1024 * 1024,
  objectBytes: 1024 * 1024 * 1024,
  parts: 128,
});
const shaPattern = /^[a-f0-9]{64}$/;
const chunkKey = (digest, part) => `__gallery_chunks/${digest}/${part.index}/${part.sha256}`;
const matchesObject = (object, digest, bytes) =>
  object &&
  storedDigest(object) === digest &&
  object.customMetadata?.sha256 === digest &&
  object.size === bytes;

async function uploadChunk(request, env, suffix, limits) {
  if (request.method !== 'PUT') return response('Method not allowed', 405, { Allow: 'PUT' });
  const match = /^([a-f0-9]{64})\/([1-9]\d{0,2})\/([a-f0-9]{64})$/.exec(suffix);
  const length = Number(request.headers.get('Content-Length'));
  if (
    !match ||
    Number(match[2]) > limits.parts ||
    request.headers.get('X-Content-SHA256') !== match[3] ||
    !Number.isSafeInteger(length) ||
    length < 1 ||
    length > limits.chunkBytes
  )
    return response('Invalid chunk metadata', 400);
  const key = chunkKey(match[1], { index: Number(match[2]), sha256: match[3] });
  const old = await env.BUCKET.head(key);
  if (old)
    return matchesObject(old, match[3], length)
      ? response(null, 204)
      : response('Immutable chunk differs', 409);
  try {
    const object = await env.BUCKET.put(key, request.body, {
      onlyIf: { etagDoesNotMatch: '*' },
      sha256: match[3],
      customMetadata: { sha256: match[3] },
    });
    return object
      ? response(null, 201)
      : response('Concurrent chunk upload; retry exact bytes', 409);
  } catch {
    return response('Chunk failed checksum or storage validation', 422);
  }
}

async function completeUpload(request, env, key, limits, createLengthStream) {
  if (request.method !== 'POST') return response('Method not allowed', 405, { Allow: 'POST' });
  const digest = request.headers.get('X-Content-SHA256');
  const length = Number(request.headers.get('X-Object-Length'));
  const bodyLength = Number(request.headers.get('Content-Length'));
  if (
    !validKey(key) ||
    !shaPattern.test(digest ?? '') ||
    !Number.isSafeInteger(length) ||
    length < 1 ||
    length > limits.objectBytes ||
    !Number.isSafeInteger(bodyLength) ||
    bodyLength < 1 ||
    bodyLength > 64 * 1024 ||
    (key.startsWith('media/') && key.split('/')[2] !== digest)
  )
    return response('Invalid completion metadata', 400);
  const old = await env.BUCKET.head(key);
  if (old)
    return matchesObject(old, digest, length)
      ? response(null, 204, { 'X-Content-SHA256': digest })
      : response('Immutable object differs', 409);
  let parts;
  try {
    ({ parts } = await request.json());
  } catch {
    return response('Invalid completion JSON', 400);
  }
  if (
    !Array.isArray(parts) ||
    !parts.length ||
    parts.length > limits.parts ||
    parts.some(
      (part, index) =>
        !part ||
        typeof part !== 'object' ||
        part.index !== index + 1 ||
        !shaPattern.test(part.sha256 ?? '') ||
        !Number.isSafeInteger(part.bytes) ||
        part.bytes < 1 ||
        part.bytes > limits.chunkBytes ||
        (index < parts.length - 1 && part.bytes !== limits.chunkBytes),
    ) ||
    parts.reduce((sum, part) => sum + part.bytes, 0) !== length
  )
    return response('Invalid ordered chunk list', 400);
  for (const part of parts) {
    if (!matchesObject(await env.BUCKET.head(chunkKey(digest, part)), part.sha256, part.bytes))
      return response('A verified chunk is missing or differs', 409);
  }
  const stream = createLengthStream(length);
  const writer = stream.writable.getWriter();
  const pumping = (async () => {
    try {
      for (const part of parts) {
        const object = await env.BUCKET.get(chunkKey(digest, part));
        if (!object?.body || object.size !== part.bytes)
          throw new Error('Chunk changed before assembly');
        const reader = object.body.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            await writer.write(value);
          }
        } finally {
          reader.releaseLock();
        }
      }
      await writer.close();
    } catch (error) {
      await writer.abort(error).catch(() => {});
      throw error;
    }
  })();
  // Attach a handler immediately: put() may reject while the pump is still unwinding.
  pumping.catch(() => {});
  try {
    const object = await env.BUCKET.put(key, stream.readable, {
      onlyIf: { etagDoesNotMatch: '*' },
      sha256: digest,
      httpMetadata: {
        contentType: request.headers.get('X-Object-Content-Type') ?? 'application/octet-stream',
        cacheControl: 'private, no-store',
      },
      customMetadata: { sha256: digest },
    });
    if (!object) {
      await writer.abort(new Error('Concurrent completion')).catch(() => {});
      await pumping.catch(() => {});
      return response('Concurrent completion; verify object before retrying', 409);
    }
    await pumping;
    let stagingRemoved = true;
    try {
      await env.BUCKET.delete(parts.map((part) => chunkKey(digest, part)));
    } catch {
      stagingRemoved = false;
    }
    return response(
      JSON.stringify({
        key,
        sha256: digest,
        bytes: object.size,
        chunks: parts.length,
        stagingRemoved,
      }),
      201,
      { 'Content-Type': 'application/json' },
    );
  } catch {
    await writer.abort(new Error('Assembly failed')).catch(() => {});
    await pumping.catch(() => {});
    return response(
      'Assembly failed checksum or storage validation; verified chunks retained',
      422,
    );
  }
}

export function parseRange(value, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(value ?? '');
  if (!match || !size || (!match[1] && !match[2])) return null;
  let start, end;
  if (!match[1]) {
    const suffix = Number(match[2]);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return null;
    start = Math.max(0, size - suffix);
    end = size - 1;
  } else {
    start = Number(match[1]);
    end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  }
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start >= size || start > end)
    return null;
  return { offset: start, length: end - start + 1 };
}

export function createGalleryWorker(
  assets = {},
  {
    chunkBytes = GALLERY_UPLOAD_LIMITS.chunkBytes,
    createLengthStream = (length) => new FixedLengthStream(length),
  } = {},
) {
  const limits = { ...GALLERY_UPLOAD_LIMITS, chunkBytes };
  return {
    async fetch(request, env) {
      const url = new URL(request.url);
      let path;
      try {
        path = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      } catch {
        return response('Invalid path', 400);
      }
      if (path.split('/').some((part) => part === '..' || part === '.'))
        return response('Invalid path', 400);
      if (path.startsWith('__upload-chunk/'))
        return uploadChunk(request, env, path.slice('__upload-chunk/'.length), limits);
      if (path.startsWith('__upload-complete/'))
        return completeUpload(
          request,
          env,
          path.slice('__upload-complete/'.length),
          limits,
          createLengthStream,
        );
      if (path.startsWith('__upload/')) {
        if (request.method !== 'PUT') return response('Method not allowed', 405, { Allow: 'PUT' });
        const key = path.slice('__upload/'.length),
          digest = request.headers.get('X-Content-SHA256');
        const length = Number(request.headers.get('Content-Length'));
        if (
          !validKey(key) ||
          !/^[a-f0-9]{64}$/.test(digest ?? '') ||
          !Number.isSafeInteger(length) ||
          length < 1 ||
          length > 40 * 1024 * 1024
        ) {
          return response('Invalid upload metadata', 400);
        }
        if (key.startsWith('media/') && key.split('/')[2] !== digest)
          return response('Content hash differs from object path', 400);
        const old = await env.BUCKET.head(key);
        if (old)
          return storedDigest(old) === digest &&
            old.customMetadata?.sha256 === digest &&
            old.size === length
            ? response(null, 204, { 'X-Content-SHA256': digest })
            : response('Immutable object differs', 409);
        try {
          const object = await env.BUCKET.put(key, request.body, {
            onlyIf: { etagDoesNotMatch: '*' },
            sha256: digest,
            httpMetadata: {
              contentType: request.headers.get('Content-Type') ?? 'application/octet-stream',
              cacheControl: 'private, no-store',
            },
            customMetadata: { sha256: digest },
          });
          if (!object) return response('Concurrent upload; verify object before retrying', 409);
          return response(JSON.stringify({ key, sha256: digest, bytes: object.size }), 201, {
            'Content-Type': 'application/json',
          });
        } catch {
          return response('Upload failed checksum or storage validation', 422);
        }
      }
      if (!['GET', 'HEAD'].includes(request.method))
        return response('Method not allowed', 405, { Allow: 'GET, HEAD' });
      const route = path || 'index.html';
      if (assets[route]) {
        const asset = assets[route];
        return response(request.method === 'HEAD' ? null : asset.body, 200, {
          'Content-Type': asset.contentType,
        });
      }
      const key = path.startsWith('media/') ? path : `assets/${path}`;
      if (!validKey(key)) return response('Not found', 404);
      const metadata = await env.BUCKET.head(key);
      if (!metadata) return response('Not found', 404);
      const headers = {
        'Content-Type': metadata.httpMetadata?.contentType ?? 'application/octet-stream',
        'Content-Length': String(metadata.size),
        'Accept-Ranges': 'bytes',
        ETag: metadata.httpEtag,
        'X-Content-SHA256': storedDigest(metadata),
      };
      if (request.method === 'HEAD') return response(null, 200, headers);
      const requestedRange = request.headers.get('Range');
      const ifRange = request.headers.get('If-Range');
      const useRange = requestedRange && (!ifRange || ifRange === metadata.httpEtag);
      const range = useRange ? parseRange(requestedRange, metadata.size) : undefined;
      if (useRange && !range)
        return response(null, 416, {
          ...headers,
          'Content-Length': '0',
          'Content-Range': `bytes */${metadata.size}`,
        });
      const object = await env.BUCKET.get(key, range ? { range } : undefined);
      if (!object?.body) return response('Object unavailable', 503);
      if (range) {
        headers['Content-Length'] = String(range.length);
        headers['Content-Range'] =
          `bytes ${range.offset}-${range.offset + range.length - 1}/${metadata.size}`;
      }
      return response(object.body, range ? 206 : 200, headers);
    },
  };
}

const EMBEDDED_ASSETS = {};
export default createGalleryWorker(EMBEDDED_ASSETS);
