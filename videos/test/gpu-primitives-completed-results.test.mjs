import test from 'node:test';
import assert from 'node:assert/strict';
import { freshPrefixSnapshot } from '../animations/gpu-primitives.mjs';

const resultCues = ['fresh-offset-five', 'fresh-odd-row-step-2', 'fresh-reduction'];
for (const [index, field] of ['offsetShown', 'revealed', 'reductionShown'].entries()) {
  test(`the fresh scan ${field} waits for its own complete result clause`, () => {
    const cue = resultCues[index];
    const otherCues = Object.fromEntries(
      resultCues.map((id, i) => [
        id,
        { phase: i < index ? 'after' : 'before', progress: i < index ? 1 : 0 },
      ]),
    );
    for (const progress of [0.001, 0.5, 0.999]) {
      const during = freshPrefixSnapshot(1, 1, {
        ...otherCues,
        [cue]: { phase: 'during', progress },
      });
      assert.equal(during[field], false);
      if (field === 'revealed') assert.equal(during.output, null);
      if (field === 'reductionShown') assert.equal(during.total, null);
    }
    const completed = freshPrefixSnapshot(1, 1, {
      ...otherCues,
      [cue]: { phase: 'after', progress: 1 },
    });
    assert.equal(completed[field], true);
    if (field === 'offsetShown') assert.equal(completed.offset, 5);
    if (field === 'revealed') assert.deepEqual(completed.output, [0, 2, -1, 4, 5, 3, 7]);
    if (field === 'reductionShown') assert.equal(completed.total, 13);
  });
}
