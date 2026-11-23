import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parse } from 'yaml';
import { draw, graphCost } from '../animations/gpu-runtime-execution-lab.mjs';
const lesson = parse(
  await fs.readFile(
    new URL('../lessons/gpu-runtime-execution-lab.lesson.yaml', import.meta.url),
    'utf8',
  ),
);
test('the fixed graph setup clause selects the actual setup intercept and cheaper replay slope', () => {
  const cue = lesson.scenes
    .find((s) => s.id === 'graphs')
    .beats[1].visual_cues.find((c) => c.id === 'graphs-beat-2-focus-2');
  const stack = [],
    curves = [];
  draw(
    {},
    { id: 'graphs' },
    { beat: 1, beatP: 0.5 },
    {
      C: { blue: 'blue', cyan: 'cyan', yellow: 'yellow', muted: 'gray' },
      components: {},
      focus: {
        target: (id, paint) => {
          stack.push(id);
          try {
            return paint();
          } finally {
            stack.pop();
          }
        },
      },
      teaching: {
        axes: () => ({ point: (x, y) => ({ x, y }) }),
        curve: (spec) => curves.push({ ...spec, targets: [...stack] }),
      },
      circle() {},
      text() {},
    },
  );
  const selected = curves.filter((c) => c.targets.some((id) => cue.targets.includes(id)));
  assert.equal(selected.length, 1);
  assert.equal(selected[0].color, 'cyan');
  assert.deepEqual(selected[0].points, [
    { x: 0, y: graphCost(0).graph },
    { x: 4000, y: graphCost(4000).graph },
  ]);
  assert.equal(selected[0].points[0].y, 12);
  assert(graphCost(2001).graph < graphCost(2001).eager);
});
