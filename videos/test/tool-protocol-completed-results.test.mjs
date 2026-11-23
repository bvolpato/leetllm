import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { readLesson } from '../lib/lesson.mjs';
import { drawFrame } from '../lib/scene.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { pathToFileURL } from 'node:url';
const { draw } = await import(
  process.env.TOOL_PROTOCOL_SOURCE
    ? pathToFileURL(process.env.TOOL_PROTOCOL_SOURCE).href
    : new URL('../animations/tool-protocol.mjs', import.meta.url)
);
const lesson = await readLesson(
  new URL('../lessons/tool-protocol.lesson.yaml', import.meta.url).pathname,
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
  for (const [key, p] of Object.entries(values)) {
    const name = 't-' + id + '-' + key;
    cues[name] = {
      ...cues[name],
      phase: p === 1 ? 'after' : p === 0 ? 'before' : 'during',
      progress: p,
      strength: 0,
      active: false,
    };
  }
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    lesson,
    scene,
    { t: 10, duration: 100, opacity: 1, beat, beatP: 0.5, cues, cueTiming: 'explicit-regression' },
    draw,
  );
}
const rows = [
  ['reuse-arithmetic', 0, 'pairs', '3 × 4 = 12'],
  ['reuse-arithmetic', 0, 'roles', '3 + 4 = 7'],
  ['discover-and-negotiate', 2, 'missing', 'ID 42 · error'],
  ['bounded-stdio', 1, 'timeout', 'direct child killed + reaped'],
  ['validate-results', 0, 'error', 'ID 51 · protocol error'],
  ['validate-results', 1, 'lookup', 'backend: release not found'],
  ['validate-results', 1, 'tool-error', 'ID 52 · complete'],
  ['validate-results', 2, 'schema', 'field set and types pass'],
  ['validate-results', 2, 'identity', 'wrong target · observation discarded'],
  ['result-contract', 0, 'domain', 'complete · isError true', 520, 535],
  ['result-contract', 1, 'error', 'tool failure'],
  ['result-contract', 1, 'continue', 'continue workflow'],
  ['result-contract', 1, 'legacy', 'complete', 0, 1000, 1000],
  ['result-contract', 1, 'false-string', 'invalid flag'],
  ['http-binding', 2, 'reject-changed', 'mismatch → HTTP 400', 0, 1000, 0, { change: 1 }],
  ['http-identity', 0, 'origin', 'present invalid Origin → HTTP 403'],
  ['http-identity', 2, 'exact', 'reject response', 480, 495],
  ['http-identity', 2, 'missing', 'reject response', 605, 620],
  ['http-identity', 2, 'unadvertised', 'issuer check passes', 730, 745, 0, { missing: 1 }],
  ['fresh-tool', 1, 'reject', 'reject wrong target'],
  ['fresh-tool', 1, 'repair', 'target matches', 0, 1000, 0, { reject: 1 }],
  ['fresh-tool', 1, 'hold', 'status observation accepted', 0, 1000, 0, { reject: 1, repair: 1 }],
  ['era-fallback', 0, 'version', 'modern', 400, 420],
  ['era-fallback', 0, 'capability', 'modern', 660, 680, 0, { version: 1 }],
  ['era-fallback', 1, 'modern', 'modern', 400, 420],
  ['era-fallback', 1, 'legacy', 'supported legacy fallback', 660, 680],
  ['era-fallback', 2, 'correct-modern', 'modern', 400, 420, 0, { body: 1 }],
  [
    'era-fallback',
    2,
    'empty',
    'supported legacy fallback',
    660,
    680,
    0,
    { body: 1, 'correct-modern': 1 },
  ],
  ['scoped-cache', 1, 'private', 'miss: scope/parameters', 470, 485],
  ['scoped-cache', 1, 'cursor', 'miss: scope/parameters', 595, 610, 0, { private: 1 }],
  ['scoped-cache', 1, 'invalidate', 'invalidate', 345, 360, 0, { private: 1, cursor: 1, zero: 1 }],
  [
    'scoped-cache',
    2,
    'retry',
    'bypass: MRTR',
    345,
    360,
    0,
    { private: 1, cursor: 1, zero: 1, invalidate: 1 },
  ],
  ['catalog-and-trust', 1, 'review', 'promote_model', 800, 820],
  ['catalog-and-trust', 1, 'scope', 'promotion absent from this scope', 800, 820, 0, { review: 1 }],
  ['result-contract', 0, 'unknown', 'complete · isError true', 690, 705, 0, { domain: 1 }],
  ['result-contract', 2, 'target', 'schema passes · target binding fails'],
];
for (const [id, beat, key, token, y0 = 0, y1 = 1000, x0 = 0, setup = {}] of rows)
  test(`${id}/${key} earns its fixed result after the complete clause`, () => {
    const matches = (a) =>
      a.labels.some(
        (l) => l.alpha > 0.1 && l.x >= x0 && l.y >= y0 && l.y <= y1 && l.text.includes(token),
      );
    for (const p of [0.01, 0.5, 0.999])
      assert(!matches(paint(id, beat, { ...setup, [key]: p })), `${token} pending at ${p}`);
    assert(matches(paint(id, beat, { ...setup, [key]: 1 })), `${token} earned after`);
  });
test('current inputs and operations persist while verdicts wait', () => {
  let a = paint('reuse-arithmetic', 0, { pairs: 0.5 });
  const pairs = a.connectors.filter((c) => c.kind === 'line');
  assert.equal(new Set(pairs.map((c) => JSON.stringify([c.from, c.to]))).size, 6);
  for (const label of ['incident assistant', 'operations console', 'IDE', 'status', 'policy', 'telemetry', 'traffic'])
    assert(a.labels.some((l) => l.text === label && l.alpha > 0.1));
  assert(!a.labels.some((l) => l.text.includes('3 × 4 = 12')));
  a = paint('bounded-stdio', 1, { timeout: 0.5 });
  assert(a.labels.some((l) => l.text === 'Wait-clock illustration: 2.5 / 5 s ceiling'));
  assert(!a.labels.some((l) => l.text === 'direct child killed + reaped'));
  a = paint('http-binding', 2, { change: 1, 'reject-changed': 0.5 });
  assert(a.labels.some((l) => l.text === 'name: shift_traffic'));
  assert(a.labels.some((l) => l.text === 'name: get_release_status'));
  a = paint('fresh-tool', 1, { reject: 1, repair: 0.5 });
  assert(a.labels.some((l) => l.text === 'ID: 72'));
  assert(a.labels.some((l) => l.text === 'release_id: reranker-v18'));
  assert(a.labels.some((l) => l.text === 'retained: reply 71 · v17 · rejected'));
  assert(!a.labels.some((l) => l.text === 'target matches'));
});
