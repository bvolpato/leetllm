import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
const require = createRequire(import.meta.url),
  mod = process.env.DEEPSPEED_SOURCE
    ? 'data:text/javascript;base64,' +
      Buffer.from(
        fs
          .readFileSync(process.env.DEEPSPEED_SOURCE, 'utf8')
          .replace(
            "from 'vizmatic'",
            "from '" + pathToFileURL(require.resolve('vizmatic')).href + "'",
          ),
      ).toString('base64')
    : new URL('../animations/deep-dive-deepspeed.mjs', import.meta.url),
  { draw } = await import(mod);
const lesson = await readLesson(
  new URL('../lessons/deep-dive-deepspeed.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(id, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === id),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { ...c, phase: 'before', progress: 0, strength: 0, active: false },
        ]),
      ),
    );
  for (const [k, p] of Object.entries(values))
    cues[k] = {
      ...cues[k],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: 0,
      active: false,
    };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues },
    draw,
  ).labels.map((l) => l.text);
}
for (const [id, beat, key, token] of [
  ['reduce', 2, 'ds-reduce-b2-s0', 'w ≈ 0.990000'],
  ['accumulation', 1, 'ds-accumulation-b1-s1', '=64'],
  ['bucket-units', 0, 'ds-bucket-units-b0-s2', '2 bytes × 200M = 400 MB'],
  ['offload', 1, 'ds-offload-b1-s1', '2 seconds hidden within independent work'],
  ['offload', 2, 'ds-offload-b2-s0', '2 seconds exposed before dependent work'],
  ['topology-conversion', 0, 'ds-topology-conversion-b0-s2', 'final dense size remains 48 bytes'],
])
  test(id + '/' + key + ' holds its fixed conclusion through the whole result clause', () => {
    for (const p of [0, 0.5, 0.999])
      assert(
        !paint(id, beat, { [key]: p, 'ds-bucket-units-b0-s1': 1 }).some((t) => t.includes(token)),
        'pending ' + token + ' at ' + p,
      );
    assert(
      paint(id, beat, { [key]: 1, 'ds-bucket-units-b0-s1': 1 }).some((t) => t.includes(token)),
      'earned ' + token,
    );
  });
test('late-gradient prediction keeps all premises while its wait instruction remains concealed', () => {
  const labels = paint('late-gradient', 0, { 'ds-late-gradient-b0-s5': 1 });
  assert(labels.includes('W0 belongs to R0 · completed accumulation = 8 / 8'));
  assert(labels.includes('R0 · received gradient 1'));
  assert(labels.includes('R1 · expected 3; receipt pending'));
  assert(labels.includes('Initial state: w = 1 · m = 0 · v = 0'));
  assert(!labels.some((t) => /; wait|Hold the update|update held/i.test(t)));
});
test('late-gradient hold instruction waits for its own complete answer and preserves actual receipt arrival', () => {
  for (const p of [0, 0.5, 0.999])
    assert(
      !paint('late-gradient', 1, { 'ds-late-gradient-b1-s0': p }).some((t) =>
        /Hold the update|update held/.test(t),
      ),
    );
  const held = paint('late-gradient', 1, { 'ds-late-gradient-b1-s0': 1 });
  assert(held.some((t) => t.startsWith('Hold the update')));
  const arrival = paint('late-gradient', 1, {
    'ds-late-gradient-b1-s0': 1,
    'ds-late-gradient-b1-s2': 0.8,
  });
  assert(arrival.includes('R1 · gradient 3 received'));
  assert(arrival.includes('Both values: sum 1 + 3 = 4'));
  assert(!arrival.some((t) => t.startsWith('After update:')));
});
