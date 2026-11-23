// From the course root, run node videos/scripts/check-cuda-mean-cue.mjs.
// If the installed Vizmatic lacks assertCueReveal, add --vizmatic PATH_TO_BUILT_CHECKOUT.
// Add --measured to check this beat against its recording in LEETLLM_SPEECH_CACHE.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createPicture } from '../director-cuts/lesson-runtime/picture.mjs';
import {
  buildTimeline,
  estimateTakes,
  firstFrameAt,
} from '../director-cuts/lesson-runtime/timeline.mjs';
import { loadFullFilm } from '../full-directors/film.mjs';
import { prepareTakes } from '../lib/course-speech.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';

const { values } = parseArgs({
  options: {
    vizmatic: { type: 'string' },
    measured: { type: 'boolean' },
    'lessons-dir': { type: 'string' },
  },
});
const requireHelper = createRequire(
  values.vizmatic ? resolve(values.vizmatic, 'package.json') : import.meta.url,
);
const { assertCueReveal } = requireHelper('vizmatic');
assert.equal(
  typeof assertCueReveal,
  'function',
  'Supply --vizmatic with a build that exports assertCueReveal.',
);

async function speechTakes(film) {
  if (!values.measured) return estimateTakes(film);
  assert(process.env.LEETLLM_SPEECH_CACHE, '--measured needs LEETLLM_SPEECH_CACHE');
  const work = await mkdtemp(join(tmpdir(), 'cuda-mean-takes-'));
  try {
    const texts = film.beats.map((beat) => beat.say);
    const { takes } = await prepareTakes(texts, work, { retainedOnly: true });
    return takes;
  } finally {
    await rm(work, { recursive: true, force: true });
  }
}

const film = await loadFullFilm('cuda-execution', { lessonsDir: values['lessons-dir'] });
const prediction = film.beats.find((beat) => beat.id === 'c15-b12');
assert(prediction, 'Missing the CUDA microbatch prediction beat c15-b12');
const excerpt = { ...film, beats: [prediction] };
const timeline = buildTimeline(excerpt, await speechTakes(excerpt));
const [entry] = timeline.schedule;
const phrase = 'point six nine three';
const result = 'Mean loss ≈ 0.693';
const beat = { ...entry.beat, visual_cues: [{ id: 'rounded-mean', phrase, targets: ['mean'] }] };
const timing = {
  beats: [{ say: beat.say, start: 0, end: entry.speechDuration }],
  sounds: [{ words: entry.words }],
};
const [cue] = resolveSceneCues({ id: beat.chapterId, beats: [beat] }, timing);
const fromFrame = firstFrameAt(entry.phraseStart('Together the tickets'));
const cueFrame = firstFrameAt(cue.end);
assert(cueFrame < entry.frames, 'The CUDA cue falls outside its beat');

const picture = createPicture(film);
const ctx = picture.canvas.getContext('2d');
function digitInk() {
  const rgba = ctx.getImageData(1180, 846, 158, 60).data;
  const ink = new Set();
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i] > 180 && rgba[i + 1] > 145 && rgba[i + 2] < 180) ink.add(i);
  }
  return ink;
}

// Draw the known headline in the course font. The crop contains only “0.693”.
ctx.fillStyle = '#103430';
ctx.fillRect(0, 0, picture.canvas.width, picture.canvas.height);
ctx.scale(2, 2);
ctx.font = '600 26px "Lesson Sans"';
ctx.textBaseline = 'middle';
ctx.fillStyle = '#ffd181';
ctx.fillText('Full-batch weight    0 + 1 = 1      ' + result, 48, 438, 865);
const reference = digitInk();
assert(reference.size > 0, 'Expected gold digits in the CUDA readout crop');

function visibleAt(frame) {
  picture.draw(timeline.clockAtFrame(frame));
  const ink = digitInk();
  if (!ink.size) return false;
  const overlap = ink.intersection(reference).size / ink.union(reference).size;
  assert(overlap >= 0.97, 'Unrecognized gold ink in the 0.693 crop at beat frame ' + frame);
  return true;
}
const window = { result, phrase, fromFrame, cueFrame };
const cut = assertCueReveal({ ...window, visibleAt });
const source = values.measured ? 'measured' : 'estimated';
console.log(
  JSON.stringify({ beat: beat.id, timing: source, frameOrigin: 'beat start', ...window, ...cut }),
);
