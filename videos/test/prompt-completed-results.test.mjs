import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues, sampleNarrationCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { loadMeasuredTimeline } from './helpers/measured-narration.mjs';
import { draw } from '../animations/prompt-optimization.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
registerLessonFonts();
const lesson = await readLesson(
    path.join(root, 'videos/lessons/prompt-optimization.lesson.yaml'),
    root,
  ),
  timeline = await loadMeasuredTimeline('prompt-optimization'),
  text = (a) => a.labels.map((l) => l.text).join('\n');
function probe(sceneId, beat, phrase) {
  const scene = structuredClone(lesson.scenes.find((s) => s.id === sceneId)),
    index = lesson.scenes.findIndex((s) => s.id === sceneId),
    measured = timeline.scenes.find((s) => s.id === sceneId),
    timing = {
      ...measured,
      visualCues: resolveSceneCues(scene, measured),
      cueTiming: 'provider-words',
    },
    copy = structuredClone(scene);
  copy.beats.forEach((b) => delete b.visual_cues);
  copy.beats[beat].visual_cues = [{ id: 'boundary', phrase, targets: ['boundary'] }];
  const c = resolveSceneCues(copy, measured)[0],
    phase = (n) => sampleNarrationCues([c], n / 30).boundary.phase;
  let n = Math.floor(c.end * 30);
  while (phase(n) !== 'after') n++;
  while (phase(n - 1) === 'after') n--;
  const paint = (time) =>
    drawFrame(
      createCanvas(1920, 1080).getContext('2d'),
      lesson,
      scene,
      frameState(timing, time, index, lesson.scenes.length),
      draw,
    );
  return { before: paint((n - 1) / 30), after: paint(n / 30), paint, start: c.start, end: c.end };
}
const specs = [
  ['subject-intro', 1, 'Both get a point', 'numeric-tie', '1 point'],
  ['subject-intro', 1, 'Now only prompt B earns the point', 'text-winner', '0 points'],
  [
    'metric',
    1,
    'The metric awards a point only when both fields match',
    'both-fields',
    'exact contract · 1',
  ],
  [
    'metric',
    1,
    'The unsupported deployment scores zero',
    'wrong-action-zero',
    'route and evidence mismatch',
  ],
  [
    'data-splits',
    1,
    'Group paraphrases of the same policy family together',
    'group-policy-family',
    'Rejected: rollback-102',
  ],
  [
    'bootstrap',
    0,
    'The accepted trace can become a few-shot demonstration in the compiled program',
    'accept-trace',
    'demonstration bank',
  ],
  ['search', 0, 'The exact action-and-record metric scores zero', 'baseline-zero', '0 / 1'],
  [
    'search',
    1,
    'Candidate B abstains with no record',
    'revised-abstain',
    'ABSTAIN · empty record ID',
  ],
  ['search', 1, 'earns one point', 'revised-one', '1 / 1'],
  [
    'search',
    2,
    'Compiled A gets nineteen',
    'development-counts',
    'development score 95%',
  ],
  [
    'search',
    3,
    'Freeze Compiled A',
    'select-program',
    'selected → compiled-a',
  ],
  [
    'sealed-test',
    1,
    'Compiled A gets thirteen',
    'open-heldout',
    'compiled · 13/20',
  ],
  [
    'artifact',
    1,
    'Bind the intended runtime model explicitly',
    'bind-runtime',
    'explicit runtime binding',
  ],
  [
    'optimizer-families',
    0,
    'A partial score of zero point five, a negative number and NaN are truthy',
    'truthy-values',
    'admit',
  ],
  [
    'search-budget',
    1,
    'turn two thousand fifty executions into six thousand one hundred fifty requests',
    'request-expansion',
    '2,050 × 3 = 6,150',
  ],
  [
    'search-budget',
    2,
    'Adding two thousand five hundred logical input tokens at one hundred requests per second gives two hundred fifty thousand extra logical input tokens per second',
    'logical-token-rate',
    '250{,}000',
  ],
  [
    'artifact-safety',
    0,
    'The actual serialization fixture restores two demonstrations and its attached model A',
    'json-restore',
    'Restored: 2 demos + attached model A',
  ],
  [
    'artifact-safety',
    1,
    'The pinned serializer omits the top-level API key',
    'api-key-omitted',
    'omitted by pinned serializer',
  ],
  [
    'artifact-safety',
    1,
    'preserves the fixture’s nested Authorization header string',
    'artifact-content',
    'placeholder string survives serialization',
  ],
  [
    'fresh-budget',
    1,
    'The plan exceeds the six hundred fifty request cap by nineteen before it starts',
    'fresh-reject',
    'REFUSE: 669',
  ],
  [
    'artifact-safety',
    0,
    'Explicitly call set L M with the intended runtime model',
    'set-runtime',
    'Effective attached model is now B',
  ],
];
for (const [scene, beat, phrase, id, label] of specs)
  test(scene + '/' + id + ' waits for the completed operation', () => {
    const p = probe(scene, beat, phrase);
    assert.deepEqual(p.before.issues, []);
    assert.deepEqual(p.after.issues, []);
    assert(!text(p.before).includes(label), 'result already painted before full clause');
    assert(text(p.after).includes(label), 'result missing after full clause');
  });
test('explicit binding replaces the effective A card while preserving the restored input', () => {
  const p = probe('artifact-safety', 0, 'Explicitly call set L M with the intended runtime model');
  assert(text(p.before).includes('Effective attached model remains A'));
  assert(!text(p.after).includes('Effective attached model remains A'));
  assert(text(p.after).includes('Effective attached model is now B'));
  assert(text(p.after).includes('Restored: 2 demos + attached model A'));
  assert(text(p.after).includes('Explicit set_lm(model B)'));
  assert(!text(p.after).includes('set\\_lm'));
});
