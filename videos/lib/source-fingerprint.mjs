import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { conceptSourceFiles } from './concepts.mjs';
import { renderEngineBytes } from './render-engine.mjs';
import { verifyProductionSources } from './lesson-production.mjs';

export async function currentSourceFingerprint(root, id, receipt) {
  if (receipt.sourceManifest !== undefined) {
    if (receipt.id !== id) throw new Error('Source fingerprint lesson differs from receipt');
    return (await verifyProductionSources(root, receipt)).fingerprint;
  }
  const adapter = path.resolve(root, receipt.ttsAdapter?.path ?? 'videos/tts.py'),
    relative = path.relative(root, adapter);
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative))
    throw Error('TTS adapter is outside the repository');
  const files = [
    `videos/lessons/${id}.lesson.yaml`,
    `videos/animations/${id}.mjs`,
    'videos/render.mjs',
    ...[
      'lib/scene.mjs',
      'lib/lesson.mjs',
      'lib/narration-cues.mjs',
      'lib/captions.mjs',
      'lib/delivery.mjs',
      'lib/brand.mjs',
      'lib/frame-audit.mjs',
      'lib/layout-review.mjs',
      'assets/leetllm-mark.svg',
      'package-lock.json',
      ...conceptSourceFiles(),
    ].map((file) => `videos/${file}`),
  ];
  const bytes = await Promise.all(files.map((file) => fs.readFile(path.resolve(root, file))));
  return createHash('sha256')
    .update(Buffer.concat([...bytes, renderEngineBytes(), await fs.readFile(adapter)]))
    .digest('hex');
}
