import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { addCue, loadCue } from './score.mjs';

const url = new URL(import.meta.url);
const root = url.searchParams.get('course') ?? fileURLToPath(new URL('../../', url));
const source = (file) => pathToFileURL(join(root, 'videos', file)).href;
const { writeScore: courseScore } = await import(source('full-directors/sound.mjs'));
const { fps } = await import(source('director-cuts/lesson-runtime/timeline.mjs'));

export async function scoreForLesson(id, schedule, work, lessonsDir = url.searchParams.get('lessons')) {
  const cue = await loadCue(id, root, lessonsDir);
  const audio = await courseScore(id, schedule, work);
  if (!cue) return { audio, soundtrack: null };
  const out = join(work, 'cued.flac');
  const soundtrack = await addCue(audio, cue, schedule, fps, out);
  return { audio: out, soundtrack };
}

export async function reportSoundtrack(id, output, soundtrack) {
  if (!soundtrack) return;
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(output)) digest.update(chunk);
  console.log(JSON.stringify({ id, output, sha256: digest.digest('hex'), soundtrack }));
}

// Frozen movie renderers read only the returned filename. Their CLI wrapper prints the receipt.
export let soundtrack = null;
export async function writeScore(id, schedule, work) {
  soundtrack = null;
  const score = await scoreForLesson(id, schedule, work);
  soundtrack = score.soundtrack;
  return score.audio;
}
