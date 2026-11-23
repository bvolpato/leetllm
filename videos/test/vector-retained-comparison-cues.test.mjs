import test from 'node:test';
import assert from 'node:assert/strict';
import { draw } from '../animations/vector-search.mjs';

function paint(wide, beat = 1, beatP = 0.98) {
  const labels = [],
    colors = [];
  const api = {
    C: {
      blue: 'blue',
      pink: 'pink',
      yellow: 'yellow',
      green: 'green',
      ink: 'white',
      muted: 'gray',
      panel: 'navy',
      cyan: 'cyan',
    },
    phase: (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a))),
    focus: { target: (_id, fn) => fn() },
    components: { card: (props) => labels.push(props.label) },
    teaching: { flowGraph: (props) => colors.push(...props.nodes.map((x) => [x.id, x.color])) },
    text: (_ctx, value) => labels.push(value),
    math: () => {},
  };
  draw(
    {},
    { id: 'hierarchy-beam' },
    {
      beat,
      beatP,
      cues: {
        'narrow-discards-bridge': { phase: 'after', progress: 1 },
        'wide-retained-bridge': { phase: wide ? 'after' : 'before', progress: wide ? 1 : 0 },
      },
    },
    api,
  );
  return { labels, colors };
}

test('the painter retains the bridge during the spoken wider-set comparison', () => {
  const narrow = paint(false),
    wide = paint(true);
  assert.ok(narrow.labels.includes('Retained: entry'));
  assert.ok(narrow.colors.some(([id, color]) => id === 'bridge' && color === 'pink'));
  assert.ok(wide.labels.includes('Retained: entry · bridge'));
  assert.ok(wide.colors.some(([id, color]) => id === 'bridge' && color === 'yellow'));
  assert.ok(wide.labels.includes('Distance evaluations: 2 / 3'));
});

test('the following paragraph continues from the retained bridge and then expands it', () => {
  assert.ok(paint(true, 2, 0).labels.includes('Retained: entry · bridge'));
  assert.ok(paint(true, 2, 0.8).labels.includes('Retained: best · entry · bridge'));
  assert.ok(paint(true, 2, 0.99).labels.includes('Distance evaluations: 3 / 3'));
});
