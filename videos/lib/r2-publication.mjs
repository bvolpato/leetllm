import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

export const IMMUTABLE_CACHE = 'public, max-age=31536000, immutable';
export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

export function assetKey(lessonId, hash, extension) {
  if (
    !/^[a-z][a-z0-9-]*$/.test(lessonId) ||
    !/^[a-f0-9]{64}$/.test(hash) ||
    !['mp4', 'vtt', 'png', 'jpg', 'webp'].includes(extension)
  ) {
    throw Error('Invalid immutable video asset identity');
  }
  return `lessons/${lessonId}/${hash}.${extension}`;
}

export async function publicationPlan({ root, selectionFile, collectionFile, domain }) {
  const selection = JSON.parse(await fs.readFile(selectionFile, 'utf8'));
  const collection = JSON.parse(await fs.readFile(collectionFile, 'utf8'));
  const available = new Map(collection.lessons.map((row) => [row.id, row]));
  const seen = new Set(),
    slugs = new Set(),
    videos = [];
  for (const row of selection.lessons) {
    const entry = available.get(row.id);
    if (!entry || seen.has(row.id)) throw Error(`Unknown or duplicate selected lesson: ${row.id}`);
    seen.add(row.id);
    const articleDirectory = path.dirname(path.join(root, 'web/src/content', entry.source));
    const article = await fs.readFile(path.join(root, 'web/src/content', entry.source), 'utf8');
    const frontmatter = article.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
    const metadata = frontmatter
      ? JSON.parse(frontmatter[1])
      : JSON.parse(await fs.readFile(path.join(articleDirectory, 'metadata.json'), 'utf8'));
    if (!/^[a-z0-9][a-z0-9-]*$/.test(metadata.slug) || metadata.hidden || slugs.has(metadata.slug))
      throw Error(`${row.id}: invalid, hidden or duplicate canonical article`);
    slugs.add(metadata.slug);
    const directory = path.resolve(root, row.sourceDirectory);
    const receipt = JSON.parse(
      await fs.readFile(path.join(directory, 'verification.json'), 'utf8'),
    );
    if (
      receipt.id !== row.id ||
      receipt.sha256 !== row.movieSha256 ||
      receipt.fullDecode !== 'passed' ||
      !receipt.frameAudit?.passed
    ) {
      throw Error(`${row.id}: selection must match a decoded, geometry-verified movie receipt`);
    }
    if (
      !/^[a-f0-9]{64}$/.test(row.sourceFingerprint ?? '') ||
      row.sourceFingerprint !== receipt.fingerprint
    ) {
      throw Error(`${row.id}: selected source fingerprint differs from the export receipt`);
    }
    const articleSha256 = sha256(Buffer.from(article));
    if (
      receipt.source !== entry.source ||
      receipt.sourceSha256 !== articleSha256 ||
      (row.articleSha256 && row.articleSha256 !== articleSha256)
    ) {
      throw Error(`${row.id}: export article differs from the canonical article`);
    }
    const files = [
      {
        file: path.join(directory, `${row.id}.mp4`),
        extension: 'mp4',
        contentType: 'video/mp4',
        field: 'url',
      },
      {
        file: path.join(directory, `${row.id}.vtt`),
        extension: 'vtt',
        contentType: 'text/vtt; charset=utf-8',
        field: 'captions',
      },
    ];
    if (row.posterPath) {
      const file = path.resolve(root, row.posterPath),
        extension = path.extname(file).slice(1);
      files.push({
        file,
        extension,
        contentType: extension === 'jpg' ? 'image/jpeg' : `image/${extension}`,
        field: 'poster',
      });
    }
    const assets = [];
    for (const file of files) {
      const bytes = await fs.readFile(file.file),
        hash = sha256(bytes);
      if (file.field === 'url' && (hash !== row.movieSha256 || bytes.length !== receipt.bytes))
        throw Error(`${row.id}: movie bytes changed`);
      const artifact = path.relative(directory, file.file).split(path.sep).join('/');
      if (receipt.artifactSha256?.[artifact] !== hash)
        throw Error(`${row.id}: asset does not match the export receipt: ${artifact}`);
      if (file.field === 'captions' && !bytes.toString('utf8').startsWith('WEBVTT'))
        throw Error(`${row.id}: invalid WebVTT captions`);
      if (bytes.length > 300 * 1024 * 1024)
        throw Error(`${row.id}: asset exceeds this REST uploader's 300MiB limit`);
      const key = assetKey(row.id, hash, file.extension);
      assets.push({
        ...file,
        sha256: hash,
        bytes: bytes.length,
        key,
        url: `https://${domain}/${key}`,
      });
    }
    const durationSeconds = receipt.duration;
    if (!Number.isFinite(durationSeconds) || durationSeconds <= 0)
      throw Error(`${row.id}: invalid measured duration`);
    videos.push({
      articleSlug: metadata.slug,
      lessonId: row.id,
      title: row.title ?? receipt.title ?? metadata.title,
      durationSeconds,
      sha256: row.movieSha256,
      sourceFingerprint: receipt.fingerprint,
      assets,
    });
  }
  if (!videos.length) throw Error('No videos selected for publication');
  return {
    schemaVersion: 1,
    domain,
    canonicalLessonIds: collection.lessons.map((row) => row.id),
    videos,
  };
}

export function assertCompletePublication(plan) {
  const selected = new Set(plan.videos.map((row) => row.lessonId));
  const missing = plan.canonicalLessonIds.filter((id) => !selected.has(id));
  if (selected.size !== plan.canonicalLessonIds.length || missing.length) {
    throw Error(
      `A web manifest update requires the complete canonical selection. Missing: ${missing.join(', ')}`,
    );
  }
}

export function webVideoManifest(plan, verifiedKeys) {
  const videos = {};
  for (const row of plan.videos) {
    for (const asset of row.assets)
      if (!verifiedKeys.has(asset.key)) throw Error(`Unverified public asset: ${asset.key}`);
    const { lessonId, title, durationSeconds, sha256: hash } = row;
    videos[row.articleSlug] = {
      lessonId,
      title,
      durationSeconds,
      sha256: hash,
      ...Object.fromEntries(row.assets.map((asset) => [asset.field, asset.url])),
    };
  }
  return { schemaVersion: 1, videos };
}

export function assertCompleteWebManifest(manifest, plan) {
  if (manifest?.schemaVersion !== 1 || !manifest.videos || Array.isArray(manifest.videos))
    throw Error('Existing web manifest must use the complete schemaVersion 1 format');
  const expected = new Set(plan.canonicalLessonIds);
  const seen = new Set();
  for (const [slug, row] of Object.entries(manifest.videos)) {
    if (
      !/^[a-z0-9][a-z0-9-]*$/.test(slug) ||
      !expected.has(row?.lessonId) ||
      seen.has(row.lessonId)
    )
      throw Error(`Existing web manifest has an invalid, foreign or duplicate lesson: ${slug}`);
    seen.add(row.lessonId);
    if (
      typeof row.title !== 'string' ||
      !row.title.trim() ||
      !Number.isFinite(row.durationSeconds) ||
      row.durationSeconds <= 0
    )
      throw Error(`Existing web manifest has invalid title or duration: ${slug}`);
    if (
      !/^[a-f0-9]{64}$/.test(row.sha256 ?? '') ||
      row.url !== `https://${plan.domain}/${assetKey(row.lessonId, row.sha256, 'mp4')}`
    )
      throw Error(`Existing web manifest has an invalid immutable movie URL: ${slug}`);
    for (const [field, extensions] of [
      ['captions', ['vtt']],
      ['poster', ['png', 'jpg', 'webp']],
    ]) {
      if (field === 'poster' && row[field] === undefined) continue;
      const prefix = `https://${plan.domain}/lessons/${row.lessonId}/`;
      const suffix =
        typeof row[field] === 'string' && row[field].startsWith(prefix)
          ? row[field].slice(prefix.length)
          : '';
      const match = suffix.match(/^([a-f0-9]{64})\.([a-z]+)$/);
      if (!match || !extensions.includes(match[2]))
        throw Error(`Existing web manifest has an invalid immutable ${field} URL: ${slug}`);
    }
  }
  if (seen.size !== expected.size)
    throw Error('Existing web manifest must contain the complete canonical collection');
}

export function mergeWebVideoManifest(plan, verifiedKeys, existing) {
  assertCompleteWebManifest(existing, plan);
  const replacement = webVideoManifest(plan, verifiedKeys);
  const videos = { ...existing.videos };
  for (const [slug, row] of Object.entries(replacement.videos)) {
    if (videos[slug] && videos[slug].lessonId !== row.lessonId)
      throw Error(`Updated article slug belongs to another retained lesson: ${slug}`);
    const previousSlug = Object.keys(videos).find((key) => videos[key].lessonId === row.lessonId);
    if (previousSlug && previousSlug !== slug) delete videos[previousSlug];
    videos[slug] = row;
  }
  const merged = { ...existing, videos };
  assertCompleteWebManifest(merged, plan);
  return merged;
}

export async function uploadAsset(request, config, asset, { timeoutMs } = {}) {
  try {
    return await uploadAssetBytes(request, config, asset, timeoutMs);
  } catch (error) {
    throw Error(`${asset.key}: upload failed: ${error.message}`, { cause: error });
  }
}

async function uploadAssetBytes(request, config, asset, timeoutMs) {
  const bytes = await fs.readFile(asset.file);
  if (sha256(bytes) !== asset.sha256 || bytes.length !== asset.bytes)
    throw Error(`Local asset changed: ${asset.file}`);
  return request(`accounts/${config.accountId}/r2/buckets/${config.bucket}/objects/${asset.key}`, {
    method: 'PUT',
    timeoutMs,
    body: bytes,
    headers: {
      'content-type': asset.contentType,
      'content-length': String(asset.bytes),
      'cache-control': IMMUTABLE_CACHE,
      'content-disposition': 'inline',
    },
  });
}

export async function verifyPublicAsset(asset, options = {}) {
  try {
    return await verifyAssetBytes(asset, options);
  } catch (error) {
    throw Error(`${asset.key}: public verification failed: ${error.message}`, { cause: error });
  }
}

async function verifyAssetBytes(asset, { fetcher = fetch } = {}) {
  const publicHeaders = { Origin: 'https://leetllm.com', 'Accept-Encoding': 'identity' };
  const response = await fetcher(asset.url, {
    headers: publicHeaders,
    redirect: 'error',
    signal: AbortSignal.timeout(180_000),
  });
  if (response.status !== 200 || Number(response.headers.get('content-length')) !== asset.bytes) {
    throw Error(
      `${asset.key}: public size/status mismatch: HTTP ${response.status}, Content-Length ${response.headers.get('content-length')}, expected ${asset.bytes}`,
    );
  }
  const checkHeaders = (response, phase) => {
    if (response.headers.get('content-type')?.split(';')[0] !== asset.contentType.split(';')[0])
      throw Error(`${asset.key}: ${phase} MIME mismatch`);
    if (response.headers.get('cache-control') !== IMMUTABLE_CACHE)
      throw Error(`${asset.key}: ${phase} immutable Cache-Control missing`);
    if (!['*', 'https://leetllm.com'].includes(response.headers.get('access-control-allow-origin')))
      throw Error(`${asset.key}: ${phase} CORS missing`);
  };
  checkHeaders(response, 'public');
  const hash = createHash('sha256');
  for await (const chunk of response.body) hash.update(chunk);
  if (hash.digest('hex') !== asset.sha256) throw Error(`${asset.key}: public SHA-256 mismatch`);
  const ranges = [];
  if (asset.field === 'url') {
    const local = await fs.open(asset.file);
    try {
      for (const start of [0, Math.floor(asset.bytes / 2), Math.max(0, asset.bytes - 1024)]) {
        const end = Math.min(start + 1023, asset.bytes - 1),
          size = end - start + 1;
        const partial = await fetcher(asset.url, {
          headers: { ...publicHeaders, Range: `bytes=${start}-${end}` },
          redirect: 'error',
          signal: AbortSignal.timeout(30_000),
        });
        if (
          partial.status !== 206 ||
          partial.headers.get('content-range') !== `bytes ${start}-${end}/${asset.bytes}`
        )
          throw Error(`${asset.key}: seek range failed at ${start}`);
        checkHeaders(partial, 'range');
        const expected = Buffer.alloc(size),
          { bytesRead } = await local.read(expected, 0, size, start);
        if (bytesRead !== size || !expected.equals(Buffer.from(await partial.arrayBuffer())))
          throw Error(`${asset.key}: range bytes mismatch at ${start}`);
        ranges.push({
          start,
          end,
          status: partial.status,
          cacheStatus: partial.headers.get('cf-cache-status'),
        });
      }
    } finally {
      await local.close();
    }
  }
  const head = await fetcher(asset.url, {
    method: 'HEAD',
    headers: publicHeaders,
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  if (head.status !== 200 || Number(head.headers.get('content-length')) !== asset.bytes)
    throw Error(`${asset.key}: HEAD failed`);
  checkHeaders(head, 'HEAD');
  const cached = await fetcher(asset.url, {
    headers: { ...publicHeaders, Range: 'bytes=0-0' },
    redirect: 'error',
    signal: AbortSignal.timeout(30_000),
  });
  checkHeaders(cached, 'cached GET');
  const cachedBytes = Buffer.from(await cached.arrayBuffer());
  if (
    cached.status !== 206 ||
    cached.headers.get('content-range') !== `bytes 0-0/${asset.bytes}` ||
    cachedBytes.length !== 1
  )
    throw Error(`${asset.key}: cached GET range failed`);
  const file = await fs.open(asset.file),
    first = Buffer.alloc(1);
  try {
    await file.read(first, 0, 1, 0);
  } finally {
    await file.close();
  }
  if (!first.equals(cachedBytes)) throw Error(`${asset.key}: cached GET bytes mismatch`);
  if (cached.headers.get('cf-cache-status') !== 'HIT')
    throw Error(
      `${asset.key}: cached GET did not produce a HIT (${cached.headers.get('cf-cache-status')})`,
    );
  return {
    key: asset.key,
    sha256: asset.sha256,
    bytes: asset.bytes,
    cacheStatus: cached.headers.get('cf-cache-status'),
    headCacheStatus: head.headers.get('cf-cache-status'),
    ranges,
  };
}
