import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { pathToFileURL } from 'node:url';
const source =
  process.env.TOOL_SOURCE_OVERRIDE ??
  new URL('../animations/tool-use.mjs', import.meta.url).pathname;
const { draw } = await import(pathToFileURL(source));
registerLessonFonts();
function paint(scene, beat, states = {}) {
  const cues = Object.fromEntries(
    Object.entries(states).map(([id, state]) => [
      'tu-' + id,
      typeof state === 'number'
        ? { phase: 'during', progress: state }
        : { phase: state, progress: state === 'after' ? 1 : 0 },
    ]),
  );
  const audit = drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: scene, title: 'Inspect retained evidence' },
    { beat, beatP: 0.99, opacity: 1, cues },
    draw,
  );
  return { audit, text: audit.labels.map((l) => l.text).join('\n') };
}
const intent = { 'intent-lost-reply': 'after', 'intent-replay': 'after', 'intent-second': 'after' };
test('the changed-candidate request is constructed independently of the immutable saved effects', () => {
  const attempt = paint('intent-ledger', 1, {
    ...intent,
    'intent-attempt': 0.5,
    'intent-collision': 'before',
  });
  assert(attempt.text.includes('Attempted request · op-A'));
  assert(attempt.text.includes('reranker-v18 · weights-18'));
  assert(attempt.text.includes('weights-17'));
  assert(attempt.text.includes('Target effects: 2'));
  assert(!attempt.text.includes('operation identity collision'));
  const rejected = paint('intent-ledger', 1, {
    ...intent,
    'intent-attempt': 'after',
    'intent-collision': 'after',
  });
  assert(rejected.text.includes('reranker-v18 · weights-18'));
  assert(rejected.text.includes('operation identity collision'));
  assert(rejected.text.includes('Target effects: 2'));
  assert(rejected.text.includes('Transport attempts: 4'));
  for (const x of [attempt, rejected])
    assert.deepEqual([...(x.audit.issues ?? []), ...layoutIssues(x.audit)], []);
});
test('a fresh result appends c33 while the original c32 Q2 receipt remains visible and unchanged', () => {
  const ready = paint('fresh-comparison', 1, {
    'fresh-suite-denial': 'after',
    'fresh-read-repair': 'after',
    'fresh-new-score': 'after',
    'fresh-delta': 'after',
  });
  assert(ready.text.includes('Release B · c32'));
  assert(ready.text.includes('Q2 · score 0.89'));
  assert(ready.text.includes('Fresh authorized read · c33'));
  assert(ready.text.includes('Q1 · score 0.83'));
  assert(!ready.text.includes('Fresh c32'));
  assert(ready.text.includes('c31 − c33 = +0.03'));
  assert.deepEqual([...(ready.audit.issues ?? []), ...layoutIssues(ready.audit)], []);
});
test('the new receipt keeps pending score, delta and write decision behind their own completed clauses', () => {
  const early = paint('fresh-comparison', 1, {
    'fresh-suite-denial': 'after',
    'fresh-read-repair': 'after',
    'fresh-new-score': 0.99,
    'fresh-delta': 'before',
  });
  assert(early.text.includes('Fresh authorized read · c33'));
  assert(early.text.includes('score / gate pending'));
  assert(!early.text.includes('Q1 · score 0.83'));
  assert(!early.text.includes('+0.03'));
  assert(!early.text.includes('Promotion effects: 0'));
  assert.deepEqual([...(early.audit.issues ?? []), ...layoutIssues(early.audit)], []);
});
