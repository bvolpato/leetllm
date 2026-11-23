import assert from 'node:assert/strict';
import test from 'node:test';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, ABSTENTION_TEXT } from '../animations/capstone-document-qa-product.mjs';
const lesson = await readLesson(
  new URL('../lessons/capstone-document-qa-product.lesson.yaml', import.meta.url).pathname,
  new URL('../..', import.meta.url).pathname,
);
registerLessonFonts();
function paint(sceneId, beat, values) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    cues = Object.fromEntries(
      scene.beats.flatMap((b) =>
        (b.visual_cues ?? []).map((c) => [
          c.id,
          { ...c, phase: 'before', progress: 0, strength: 0, active: false },
        ]),
      ),
    );
  for (const [id, p] of Object.entries(values))
    cues[id] = {
      ...cues[id],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: 0,
      active: false,
    };
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'explicit-regression' },
    draw,
  )
    .labels.filter((l) => l.alpha > 0.1)
    .map((l) => l.text);
}
const contracts = [
  [
    'access global empty',
    'access',
    1,
    'access-result-complete',
    { 'access-global': 1 },
    (v) => v.some((x) => x.includes('discard → 0 results')),
  ],
  [
    'access readable alternative',
    'access',
    1,
    'access-result-complete',
    { 'access-global': 1, 'access-alternative': 1 },
    (v) => v.some((x) => x.includes('EU-A is retained')),
  ],
  ['entailed answer', 'support', 1, 'receipt-entailed', {}, (v) => v.includes('ANSWER')],
  ...['contradicted', 'unknown', 'missing', 'stale'].map((id) => [
    id + ' refusal',
    'support',
    1,
    'receipt-refusals-complete',
    { ['receipt-' + id]: 1 },
    (v) => v.includes('ABSTAIN'),
  ]),
  [
    'worker fencing',
    'research-checkpoint',
    1,
    'worker-fence',
    {},
    (v) => v.includes('REJECT stale token') || v.includes('ACCEPT current token'),
  ],
  [
    'unknown claim',
    'research-claims',
    1,
    'claim-unknown',
    {},
    (v) => v.includes('Semantic receipt: unknown → BLOCK'),
  ],
  [
    'private-source claim',
    'research-claims',
    1,
    'claim-private',
    {},
    (v) => v.includes('Source admission: false → BLOCK before report release'),
  ],
  [
    'fresh fallback',
    'fresh-qa',
    1,
    'fresh-fallback-complete',
    { 'fresh-response': 1 },
    (v) => v.includes(ABSTENTION_TEXT),
  ],
  [
    'fresh citations',
    'fresh-qa',
    1,
    'fresh-empty-cites',
    { 'fresh-response': 1 },
    (v) => v.includes('citations: []'),
  ],
  [
    'fresh refusal reason',
    'fresh-qa',
    1,
    'fresh-reason-complete',
    { 'fresh-response': 1 },
    (v) => v.includes('ABSTAIN · question-bound review rejected'),
  ],
];
for (const [name, scene, beat, cue, setup, visible] of contracts)
  test(name + ' waits for its full result clause', () => {
    for (const p of [0.01, 0.5, 0.999])
      assert.equal(visible(paint(scene, beat, { ...setup, [cue]: p })), false, name + '/' + p);
    assert.equal(visible(paint(scene, beat, { ...setup, [cue]: 1 })), true, name + '/complete');
  });
test('support outcomes retain each distinct checked refusal in the completed history', () => {
  const values = Object.fromEntries(
    ['entailed', 'contradicted', 'unknown', 'missing', 'stale'].map((x) => ['receipt-' + x, 1]),
  );
  const labels = paint('support', 1, { ...values, 'receipt-refusals-complete': 1 });
  for (const id of ['contradicted', 'unknown', 'missing', 'stale'])
    assert(labels.includes(id + ': ABSTAIN'));
  assert(labels.includes('entailed: ANSWER'));
});
