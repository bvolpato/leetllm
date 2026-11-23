import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { pathToFileURL } from 'node:url';
import { readLesson, makeSceneTimeline, frameState } from '../lib/lesson.mjs';
import { resolveSceneCues } from '../lib/narration-cues.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';

registerLessonFonts();
const root = new URL('../../', import.meta.url).pathname;
const lesson = await readLesson(root + 'videos/lessons/constitutional-ai.lesson.yaml', root);
const model = await import(
  pathToFileURL(root + (process.env.CA_TEST_SOURCE ?? 'videos/animations/constitutional-ai.mjs'))
);
const canvas = createCanvas(1920, 1080);
const cases = [
  ['order-normalization', 'order-remap', (s) => s.includes('1-0.70=0.30')],
  ['order-normalization', 'order-normalization-1', (s) => s.includes('P(A)=(0.80+0.30)/2=0.55')],
  ['policy-rl', 'policy-rl-1', (s) => s.some((t) => t.endsWith('= 0.120'))],
  ['policy-rl', 'policy-kl', (s) => s.some((t) => t.endsWith('=0.1927'))],
  ['policy-rl', 'policy-penalty', (s) => s.includes('-0.0385')],
  ['policy-rl', 'policy-base-objective', (s) => s.some((t) => t.startsWith('Candidate wins'))],
  ['policy-rl', 'policy-changed-answer', (s) => s.some((t) => t.startsWith('Candidate loses'))],
  ['attack-search', 'attack-search-2', (s) => s.includes('Choose C after exact checks')],
  ['audit-accounting', 'audit-asr', (s) => s.includes('ASR 2/6 · roleplay 2/2')],
  [
    'audit-accounting',
    'audit-frr',
    (s) => s.includes('False refusal 1/5') && s.includes('Helpfulness 3/5'),
  ],
  [
    'audit-accounting',
    'audit-accounting-2',
    (s) => s.some((t) => t.includes('sample bounds 2/7 to 3/7')),
  ],
  [
    'audit-accounting',
    'audit-benign-bounds',
    (s) => s.includes('Benign helpfulness bounds 3/6 to 4/6'),
  ],
  ['judge-audit', 'judge-counts', (s) => s.some((t) => t.startsWith('TP 2 · FP 1'))],
  ['judge-audit', 'judge-audit-2', (s) => s.some((t) => t.startsWith('Coverage 5/6'))],
  ['judge-audit', 'judge-brier', (s) => s.some((t) => t.startsWith('Brier 0.325'))],
  ['multi-turn', 'multi-turn-1', (s) => s.includes('STOP · violation at turn 3 · six messages')],
  ['evaluate', 'release-answer', (s) => s.includes('Public part → explain documented rules')],
  ['evaluate', 'release-benign-rates', (s) => s.some((t) => t.startsWith('FRR 2/8 = 25%'))],
  ['evaluate', 'release-counts', (s) => s.some((t) => t.startsWith('Known 1/5 · coverage 5/7'))],
];
function fixture(sceneId) {
  const scene = lesson.scenes.find((s) => s.id === sceneId),
    sounds = scene.beats.map((b, beatIndex) => ({
      beatIndex,
      words: b.say
        .split(/\s+/)
        .map((text, i) => ({ text, start: i * 0.4, end: (i + 1) * 0.4 - 0.005 })),
    }));
  const timing = makeSceneTimeline(
    scene,
    sounds.map((s) => s.words.at(-1).end),
  );
  timing.sounds = sounds;
  timing.visualCues = resolveSceneCues(scene, timing, sounds);
  return { scene, timing };
}
function paint(f, time) {
  return drawFrame(
    canvas.getContext('2d'),
    lesson,
    f.scene,
    frameState(f.timing, time, lesson.scenes.indexOf(f.scene), lesson.scenes.length),
    model.draw,
  )
    .labels.filter((l) => l.alpha > 0.25)
    .map((l) => l.text);
}
for (const [scene, cueId, result] of cases)
  test(`${scene} keeps ${cueId} pending until its full clause completes`, () => {
    const f = fixture(scene),
      cue = f.timing.visualCues.find((c) => c.id === cueId);
    assert.equal(
      result(paint(f, cue.end - 0.01)),
      false,
      'fixed consequence leads its completed clause',
    );
    assert.equal(
      result(paint(f, cue.end + 0.01)),
      true,
      'earned consequence must remain available',
    );
  });
test('the clamp label describes the moving dot until it reaches the final target', () => {
  const f = fixture('order-normalization'),
    cue = f.timing.visualCues.find((c) => c.id === 'clamp-target'),
    mid = paint(f, (cue.start + cue.end) / 2);
  assert(mid.includes('Clamping target · current 0.775'));
  assert(!mid.includes('CoT target clamped to 0.60'));
  assert(paint(f, cue.end + 0.01).includes('CoT target clamped to 0.60'));
});
for (const [id, index] of [
  ['order-normalization', 0],
  ['policy-rl', 1],
  ['evaluate', 3],
])
  test(`${id} holds a neutral question before its separate answer`, () => {
    const f = fixture(id),
      b = f.timing.beats[index];
    assert(b.hold >= 1.5);
    const labels = paint(f, (b.end + b.until) / 2);
    const answer = cases.find(
      (c) =>
        c[0] === id &&
        (id === 'order-normalization'
          ? c[1] === 'order-normalization-1'
          : id === 'policy-rl'
            ? c[1] === 'policy-changed-answer'
            : c[1] === 'release-answer'),
    );
    assert.equal(answer[2](labels), false);
  });
test('the swapped-order complement stays pending until its remapping clause completes', () => {
  const f = fixture('order-normalization'),
    cue = f.timing.visualCues.find((c) => c.id === 'order-remap'),
    pending = paint(f, cue.end - 0.01);
  assert(pending.includes('A pending'));
  assert(!pending.includes('A 0.30'));
  assert(paint(f, cue.end + 0.01).includes('A 0.30'));
});
test('the pending stop decision describes the third reply already retained on screen', () => {
  const f = fixture('multi-turn'),
    cue = f.timing.visualCues.find((c) => c.id === 'multi-turn-1'),
    labels = paint(f, cue.end - 0.01);
  assert(labels.includes('A3 · FIXTURE DISCLOSURE'));
  assert(labels.includes('Third assistant reply retained · stop decision pending'));
  assert(!labels.some((t) => t.includes('await third assistant reply')));
});
