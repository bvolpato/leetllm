import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

export const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

export async function readGallerySources(root) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, 'gallery-source-manifest.json'), 'utf8'),
  );
  assert.equal(manifest.kind, 'leetllm.inspection-gallery-source');
  const gallery = path.join(root, 'gallery');
  const realRoot = await fs.realpath(gallery);
  const assets = {};
  for (const file of manifest.files) {
    assert(
      !path.isAbsolute(file.path) &&
        !file.path.split(/[\\/]/).some((part) => part === '..' || !part),
      'Unsafe gallery source path',
    );
    const source = path.join(gallery, file.path);
    const actual = await fs.realpath(source);
    assert(actual.startsWith(realRoot + path.sep), 'Gallery source escapes directory');
    const bytes = await fs.readFile(source);
    assert.equal(digest(bytes), file.sha256, `Gallery source changed: ${file.path}`);
    assert.equal(bytes.length, file.bytes, `Gallery source length changed: ${file.path}`);
    assert(!assets[file.path], 'Duplicate gallery source');
    assets[file.path] = { body: bytes.toString('utf8'), contentType: file.contentType };
  }
  assert(assets['index.html'] && assets['inspection.js'] && assets['inspection.css']);
  const data = JSON.parse(assets['status-index.json'].body);
  assert.equal(data.lessons.length, 199);
  assert.equal(new Set(data.lessons.map((row) => row.id)).size, 199);
  for (const row of data.lessons) {
    assert(/^[a-f0-9]{64}$/.test(row.playback.movieSha256), `Missing movie identity: ${row.id}`);
    if (row.candidate) assert.equal(row.playback.movieSha256, row.candidate.media.video.sha256);
    if (row.exactCandidateReview)
      assert.equal(row.exactCandidateReview.movieSha256, row.playback.movieSha256);
  }
  return { assets, data, manifest };
}
