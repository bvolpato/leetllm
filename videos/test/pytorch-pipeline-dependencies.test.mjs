import test from 'node:test';
import assert from 'node:assert/strict';
import { pipelineSlots, sampleModel } from '../animations/deep-dive-pytorch.mjs';

test('the displayed 1F1B schedule completes each forward and reverse dependency before use', () => {
  const schedule = pipelineSlots(2, '1f1b');
  assert.equal(schedule.work.length, 8);
  for (const item of schedule.work) {
    const previous =
      item.kind === 'B'
        ? schedule.work.find(
            (other) => other.mb === item.mb && other.stage === item.stage && other.kind === 'F',
          )
        : item.stage === 1
          ? schedule.work.find(
              (other) => other.mb === item.mb && other.stage === 0 && other.kind === 'F',
            )
          : null;
    if (previous) assert(previous.end <= item.start);
    if (item.kind === 'B' && item.stage === 0) {
      const downstream = schedule.work.find(
        (other) => other.mb === item.mb && other.stage === 1 && other.kind === 'B',
      );
      assert(downstream.end <= item.start);
    }
    assert.equal(
      schedule.work.filter((other) => other.stage === item.stage && other.start === item.start)
        .length,
      1,
    );
  }
  const stage1 = schedule.work.filter((item) => item.stage === 1).map((item) => item.kind);
  assert.deepEqual(stage1, ['F', 'B', 'F', 'B']);
});

test('completed numeric clauses independently hold the fresh branches and restore the counter', () => {
  const pending = (id) => ({ phase: 'during', progress: 0.999 });
  assert.equal(
    sampleModel('fresh-counter', { beat: 1, beatP: 1, cues: { 'pt-fresh-correct': pending() } })
      .goodVisible,
    false,
  );
  assert.equal(
    sampleModel('fresh-counter', { beat: 1, beatP: 1, cues: { 'pt-fresh-wrong': pending() } })
      .badVisible,
    false,
  );
  const rerun = sampleModel('fresh-counter', {
    beat: 2,
    beatP: 0.5,
    cues: { 'pt-fresh-restored': { phase: 'during', progress: 0.5 } },
  });
  assert.equal(rerun.badNow.step, 3);
  assert.equal(rerun.restored, false);
  const final = sampleModel('fresh-counter', {
    beat: 2,
    beatP: 1,
    cues: { 'pt-fresh-restored': { phase: 'after', progress: 1 } },
  });
  assert.equal(final.badNow.w, final.good.w);
  assert.equal(final.badNow.step, final.good.step);
});

test('the two tensor-parallel projections preserve the same feature ownership', async () => {
  const { tpProjectionFixture } = await import('../animations/deep-dive-pytorch.mjs');
  const fixture = tpProjectionFixture();
  assert.deepEqual(fixture.hidden, [1, 2, 3, -1]);
  assert.deepEqual(fixture.partials, [
    [1, 2],
    [3, -1],
  ]);
  assert.deepEqual(fixture.result, [4, 1]);
});
