import test from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../animations/prompt-optimization.mjs';

function paint(scene, beat, cues) {
  const labels = [],
    cards = [],
    routes = [];
  const C = { green: '#8cdeb5', cyan: '#63deec', pink: '#ef9ac8' };
  draw(
    {},
    { id: scene },
    { beat, beatP: 0.9, cues },
    {
      C,
      clamp: (value) => Math.max(0, Math.min(1, value)),
      phase: (p, start, end) => Math.max(0, Math.min(1, (p - start) / (end - start))),
      text: (_ctx, label) => labels.push(label),
      circle() {},
      line() {},
      rect() {},
      math() {},
      focus: {
        target: (_id, callback) => callback(),
        visible: (id) => cues[id]?.phase !== 'before',
      },
      components: {
        card: (options) => {
          cards.push(options);
          return options;
        },
      },
      teaching: { transfer: (options) => routes.push(options) },
    },
  );
  return { cards, routes, labels, C };
}

test('changing the ZIP grader rescores the same two answers only after the spoken result', () => {
  const after = { phase: 'after', progress: 1 };
  const answers = { 'text-copy': after, 'numeric-rule': after };
  const read = (cues) => paint('subject-intro', 1, { ...answers, ...cues }).labels;
  const scores = (labels) => labels.filter((label) => /^\d points?$/.test(label));
  assert.deepEqual(scores(read({})), []);
  const tied = { 'numeric-tie': after };
  assert.deepEqual(scores(read(tied)), ['1 point', '1 point']);
  const exact = { ...tied, 'text-rule': after };
  assert.deepEqual(scores(read(exact)), []);
  const graded = read({ ...exact, 'text-winner': after });
  assert.deepEqual(scores(graded), ['0 points', '1 point']);
  assert(graded.includes('2139') && graded.includes('02139'));
});

test('a rejected current trace cannot take the retained demonstration acceptance path', () => {
  const current = paint('bootstrap', 1, {
    'accept-trace': { phase: 'after', progress: 1 },
    'partial-trace': { phase: 'during', progress: 0.5 },
  });
  assert(current.cards.some((card) => card.label === 'metric = 0'));
  assert(current.cards.some((card) => card.label.includes('demonstration bank\nrollback-101')));
  assert(!current.routes.some((route) => route.color === current.C.green && route.progress > 0));
  assert(
    current.routes.some(
      (route) => route.color === current.C.pink && route.target.shape.label.includes('deploy-201'),
    ),
  );
});
