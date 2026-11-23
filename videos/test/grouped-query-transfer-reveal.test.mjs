import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { drawFrame } from '../lib/scene.mjs';
import { layoutIssues } from '../lib/frame-audit.mjs';
import { registerLessonFonts } from '../lib/fonts.mjs';
import { draw, cacheBytes } from '../animations/grouped-query-attention.mjs';
registerLessonFonts();
const ids = [
  'earned-owner',
  'earned-rank-copies',
  'earned-head-bytes',
  'earned-logical-bytes',
  'earned-bytes',
  'earned-mha-bytes',
  'earned-saving',
];
function paint(beat, after = []) {
  return drawFrame(
    createCanvas(1920, 1080).getContext('2d'),
    {},
    { id: 'earned-transfer', title: 'Predict the map and then count the replicas' },
    {
      beat,
      beatP: 0.99,
      opacity: 1,
      cues: Object.fromEntries(
        ids.map((id) => [
          id,
          { phase: after.includes(id) ? 'after' : 'before', progress: after.includes(id) ? 1 : 0 },
        ]),
      ),
    },
    draw,
  );
}
const labels = (a) => a.labels.map((l) => l.text).join('\n');
test('physical-head, logical, replicated, MHA and saving labels follow distinct completed clauses', () => {
  const stages = [
    [],
    ['earned-rank-copies'],
    ['earned-rank-copies', 'earned-head-bytes'],
    ['earned-rank-copies', 'earned-head-bytes', 'earned-logical-bytes'],
    ['earned-rank-copies', 'earned-head-bytes', 'earned-logical-bytes', 'earned-bytes'],
    [
      'earned-rank-copies',
      'earned-head-bytes',
      'earned-logical-bytes',
      'earned-bytes',
      'earned-mha-bytes',
    ],
    ids.filter((id) => id !== 'earned-owner'),
  ].map((ids) => paint(2, ids));
  assert(!labels(stages[0]).includes('8 MiB'));
  assert(!labels(stages[1]).includes('8 MiB'));
  assert(labels(stages[2]).includes('8 MiB'));
  assert(!labels(stages[2]).includes('48 MiB'));
  assert(labels(stages[3]).includes('48 MiB'));
  assert(!labels(stages[3]).includes('96 MiB'));
  assert(labels(stages[4]).includes('96 MiB'));
  assert(!labels(stages[4]).includes('384 MiB'));
  assert(!labels(stages[4]).includes('fourfold saving'));
  assert(labels(stages[5]).includes('384 MiB'));
  assert(!labels(stages[5]).includes('fourfold saving'));
  assert(labels(stages[6]).includes('fourfold saving'));
  for (const a of stages) assert.deepEqual([...(a.issues ?? []), ...layoutIssues(a)], []);
});
test('the withheld owner prediction has its own clear area and preserves the exact byte model', () => {
  const a = paint(0),
    question = a.labels.find((l) => l.text === 'Which KV group owns query 19?'),
    kv = a.labels.filter((l) => /^KV[0-5]$/.test(l.text));
  assert(question);
  assert.equal(kv.length, 6);
  assert(question.y > Math.max(...kv.map((l) => l.y)) + 70);
  assert(!labels(a).includes('19 ÷ 8 → KV group 2'));
  assert(labels(paint(1, ['earned-owner'])).includes('19 ÷ 8 → KV group 2'));
  const head = cacheBytes({ layers: 32, batch: 1, tokens: 1024, kvHeads: 1, width: 64, bytes: 2 });
  assert.equal(head, 8 * 2 ** 20);
  assert.equal(6 * head, 48 * 2 ** 20);
  assert.equal(12 * head, 96 * 2 ** 20);
  assert.equal(48 * head, 384 * 2 ** 20);
  assert.equal((48 * head) / (12 * head), 4);
});
