import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { parse } from 'yaml';
import { draw, sampleModel } from '../animations/deep-dive-skyrl.mjs';
const lesson = parse(
  await fs.readFile(new URL('../lessons/deep-dive-skyrl.lesson.yaml', import.meta.url), 'utf8'),
);
function paint(beat) {
  const stack = [],
    marks = [],
    state = { beat, beatP: 0.8 };
  const record = (kind, label) => marks.push({ kind, label, targets: [...stack] });
  draw({}, { id: 'intro' }, state, {
    C: new Proxy({}, { get: (_, key) => key }),
    focus: {
      target: (id, fn) => {
        stack.push(id);
        try {
          return fn();
        } finally {
          stack.pop();
        }
      },
    },
    components: {
      card: (spec) => {
        record('card', spec.label);
        return spec;
      },
    },
    teaching: { transfer() {} },
    text: (_ctx, label) => record('text', label),
  });
  return { marks, model: sampleModel('intro', state) };
}
test('the environment-return narration focuses its actual observation and computed trajectory reward', () => {
  const cue = lesson.scenes
    .find((s) => s.id === 'intro')
    .beats[1].visual_cues.find((c) => c.id === 'intro-beat-2-focus-1');
  const { marks, model } = paint(1),
    selected = marks.filter((mark) => mark.targets.some((target) => cue.targets.includes(target)));
  assert(
    selected.some((mark) => mark.kind === 'card' && mark.label === 'Database: verified result'),
  );
  assert(
    selected.some(
      (mark) =>
        mark.kind === 'text' && mark.label === `Trajectory reward: ${model.reward.toFixed(1)}`,
    ),
  );
  assert(!selected.some((mark) => mark.label === 'Repaired SQL action'));
});
test('the visible reward retains the same trajectory accumulation through error, repair and trainer handoff', () => {
  for (const [beat, expected] of [
    [0, -0.2],
    [1, 0.8],
    [2, 0.8],
  ]) {
    const { marks, model } = paint(beat);
    assert.equal(model.reward, expected);
    assert(marks.some((mark) => mark.label === `Trajectory reward: ${expected.toFixed(1)}`));
  }
});
