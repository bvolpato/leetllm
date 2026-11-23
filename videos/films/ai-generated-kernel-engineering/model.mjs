import { calls, hostKernelFixtures } from './fixtures.mjs';
import {
  binaryAddress,
  dispatch,
  executeHostKernelCase,
  freshPromotion,
  hostTensorRow,
  isolatedCommand,
  layoutDispatch,
  rms,
  sum,
  tolerance,
  warpSectors,
} from './arithmetic.mjs';
import { hiddenCaseSnapshot, sampleModel } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(rms([3, 4], [1, 2], 1e-5).mean, 12.5);
  assert.equal(rms([0, 0], [1, 1], 1e-5).outputs[0], 0);
  assert.deepEqual(calls.map(dispatch), [true, false, false, false, false]);
  assert.equal(
    sampleModel('tail', {
      beat: 0,
      beatP: 0.9,
    }).mean,
    11.6,
  );
  assert.equal(
    sampleModel('tail', {
      beat: 1,
      beatP: 0.9,
    }).mean,
    11,
  );
  assert(
    !sampleModel('hidden', {
      beat: 1,
      beatP: 0.9,
    }).pass,
  );
  const e = sampleModel('epsilon', {
    beat: 1,
    beatP: 0.99,
  });
  assert(Math.abs(e.value - e.reference) < 1e-12);
  assert(
    Math.abs(
      sampleModel('traffic', {
        beat: 0,
        beatP: 0.5,
      }).logicalRate - 5.2,
    ) < 1e-12,
  );
  for (const beatP of [0, 0.5, 0.99])
    assert.equal(
      sampleModel('intro', {
        beat: 0,
        beatP,
      }).stage,
      0,
    );
  assert(
    sampleModel('intro', {
      beat: 1,
      beatP: 0.25,
    }).stage <
      sampleModel('intro', {
        beat: 1,
        beatP: 0.5,
      }).stage,
  );
  assert.equal(
    sampleModel('intro', {
      beat: 1,
      beatP: 0.9,
    }).stage,
    8,
  );
  assert.deepEqual(layoutDispatch().rows[1].addresses, [6, 7, 8, 9]);
  assert.deepEqual(layoutDispatch().flattenedValues, [null, null, 5, 6]);
  assert.equal(layoutDispatch().contiguous, false);
  assert(
    !dispatch({
      cuda: true,
      contiguous: layoutDispatch().contiguous,
      h: 256,
      grad: false,
    }),
  );
  assert(isolatedCommand('build-K1').allowed);
  assert(!isolatedCommand('read-credentials').allowed);
  assert(!isolatedCommand('network').allowed);
  assert.equal(binaryAddress(7).value, 8);
  assert.equal(binaryAddress(8).error, 'OUT_OF_ALLOCATION');
  const cases = hostKernelFixtures.map(executeHostKernelCase);
  assert.deepEqual(
    cases.map((row) => row.matches),
    [true, true, true, true, false, false],
  );
  assert.deepEqual(cases[4].rows[0].values, [1, 2, 3, 4, 5]);
  assert.equal(cases[4].reference[0].mean, 11);
  assert.deepEqual(cases[5].rows[0], {
    addresses: [0, 2, 4, 6],
    values: [1, 3, 5, 7],
  });
  assert.equal(cases[5].reference[0].mean, 21);
  assert.deepEqual(cases[5].rows[1], {
    addresses: [1, 3, 5, 7],
    values: [2, 4, 6, 8],
  });
  assert.deepEqual(cases[5].candidate[0], [0, 0, 0, 0]);
  for (const result of cases) {
    assert.equal(result.guardedRoute, result.supported ? 'candidate' : 'reference');
    assert.deepEqual(result.guardedOutput, result.reference.map(row => row.outputs));
  }
  assert.equal(cases[5].guardedOutput[0][2].toFixed(4), '1.0911');
  assert.equal(cases[4].reference[0].outputs[4].toFixed(4), '1.5076');
  assert.deepEqual([1, 2, 8].map(stride => warpSectors(stride).sectors.length), [4, 8, 32]);
  const final = freshPromotion();
  assert.deepEqual(final.addresses, [0, 2]);
  assert.deepEqual(final.outputs.map(v => v.toFixed(3)), ['0.544', '2.611']);
  assert.equal(final.route, 'REFERENCE');
  assert(final.wideEligible);
  assert(cases[5].maxError > 1);
  assert.throws(
    () =>
      hostTensorRow(
        {
          ...hostKernelFixtures[0],
          strides: [40, 1],
        },
        1,
      ),
    RangeError,
  );
  for (const beat of [0, 1])
    for (let i = 0; i <= 100; i++) {
      const current = hiddenCaseSnapshot(beat, i / 100),
        row = current.current.rows[0];
      assert.deepEqual(current.loadedAddresses, row.addresses.slice(0, current.readCount));
      assert.deepEqual(
        current.loadedValues,
        current.loadedAddresses.map((address) => current.current.fixture.storage[address]),
      );
      assert.equal(
        current.partialSquareSum,
        sum(current.loadedValues.map((value) => value * value)),
      );
      assert.equal(
        current.current.matches,
        current.current.reference.every((r, j) =>
          r.outputs.every((value, k) => tolerance(value, current.current.candidate[j][k], 1e-6, 1e-5).pass),
        ),
      );
    }
  return true;
}
