import { ids, outputs, receipt, tests } from './fixtures.mjs';
import {
  admission,
  cache,
  evaluate,
  memory,
  place,
  prefillRequest,
  rates,
  releaseCases,
  sampleModel,
  stream,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert(Math.abs(cache(16384, 4).total - 2.415919104) < 1e-10);
  assert.equal(cache(16384, 8).total, 2 * cache(16384, 4).total);
  assert.equal(cache(32768, 4).sliding, cache(16384, 4).sliding);
  assert(memory(16384, true).fits);
  assert(!memory(16384, false).fits);
  assert.equal(place(16).gpuBlocks, 32);
  assert.equal(place(8).gpuBlocks, 16);
  assert.equal(place(8).boundaries, 1);
  assert.deepEqual(place(16).output, place(8).output);
  assert.equal(rates(receipt).prefill, 2000);
  assert.equal(rates(receipt).output, 40);
  assert.equal(
    rates({
      ...receipt,
      outputNs: 0,
    }).output,
    null,
  );
  assert.throws(() =>
    rates({
      ...receipt,
      cached: 1001,
    }),
  );
  assert.throws(() =>
    rates({
      ...receipt,
      outputNs: true,
    }),
  );
  assert(stream(1).total > stream(0).total);
  assert.equal(stream(2).payload, 7.6);
  assert.equal(evaluate(outputs.baseline).score, 3);
  assert.equal(evaluate(outputs.candidate).score, 3);
  assert.equal(tests[0].check(outputs.baseline[0]), true);
  assert.equal(tests[0].check(outputs.candidate[0]), false);
  assert.equal(cache(16384, 4, false).total.toFixed(3), '22.549');
  assert.equal(prefillRequest(15).freeGB.toFixed(3), '13.984');
  assert(!prefillRequest(15).fits);
  assert(prefillRequest(6).fits);
  assert.equal(admission(8).total.toFixed(3), '16.579');
  assert(!admission(8).fits);
  assert.equal(admission(7).total.toFixed(3), '15.707');
  assert(admission(7).fits);
  const release = releaseCases();
  assert.equal(release.passes, 4);
  assert.equal(release.lost.id, 'Rollback');
  assert(!release.promote);
  for (const id of ids)
    for (let beat = 0; beat < 3; beat++)
      for (const beatP of [0, 0.25, 0.5, 0.75, 0.999999]) {
        const s = sampleModel(id, {
          beat,
          beatP,
        });
        assert.equal(s.step, beat);
        if (id === 'intro' || id === 'retention')
          assert(Math.abs(s.weights + s.workspace + s.kv - s.total) < 1e-10);
        if (id === 'placement') {
          assert.equal(s.gpuBlocks + s.cpuBlocks, 32);
          assert(s.processed <= 32);
        }
        if (id === 'transfers') {
          assert.equal(s.payload, 7.6);
          assert(s.elapsed <= s.total);
        }
        if (id === 'quality') {
          assert(!s.approved);
          assert(s.evaluated >= 0 && s.evaluated <= tests.length);
          if (beat > 0) assert.equal(s.evaluated, tests.length);
        }
      }
  assert.equal(
    sampleModel('quality', {
      beat: 0,
      beatP: 0,
    }).evaluated,
    0,
  );
  assert.equal(
    sampleModel('quality', {
      beat: 0,
      beatP: 0.5,
    }).evaluated,
    2,
  );
  assert.equal(
    sampleModel('quality', {
      beat: 0,
      beatP: 0.88,
    }).evaluated,
    4,
  );
  for (const id of ids) {
    assert.equal(
      sampleModel(id, {
        beat: 0,
        beatP: 1,
      }).step,
      1,
    );
    assert.equal(
      sampleModel(id, {
        beat: 1,
        beatP: 1,
      }).step,
      2,
    );
  }
  return true;
}
