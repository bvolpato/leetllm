import {
  coverage,
  enumeratedAccesses,
  nativeOnlyRuns,
  residency,
  resolve,
  specializationFixture,
  vectorLane,
} from './arithmetic.mjs';
import { ARTIFACT } from './fixtures.mjs';
import { compilerIntroFrame, sampleModel } from './construction.mjs';
import { publishable } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.deepEqual(vectorLane(1), { x: 0.25, y: -2, sum: -1.75 });
  assert.deepEqual(
    nativeOnlyRuns.map((run) => run.selection),
    ['LOAD NATIVE', 'MISSING IMAGE'],
  );
  const at33 = residency(33);
  assert.equal(65536 - at33.blocks * at33.perBlock, 4096);
  assert.equal(residency(40).perBlock, at33.perBlock);
  assert.equal(residency(41).blocks, 5);
  for (const [n, block] of [
    [256, 256],
    [257, 256],
    [768, 128],
    [769, 128],
  ]) {
    const expected = Array.from({ length: n }, (_, index) => index);
    assert.deepEqual(enumeratedAccesses(n, block, false), expected);
    assert.deepEqual(enumeratedAccesses(n, block, true), n % block ? [...expected, n] : expected);
  }
  assert.deepEqual(
    [32, 33, 41, 65, 129].map((r) => residency(r).warps),
    [64, 48, 40, 24, 8],
  );
  assert.deepEqual(
    [32, 33, 41, 65, 129].map((r) => residency(r).perWarp),
    [1024, 1280, 1536, 2304, 4352],
  );
  assert.deepEqual(
    [32, 33, 41, 65, 129].map((r) => residency(r).perBlock),
    [8192, 10240, 12288, 18432, 34816],
  );
  assert.equal(resolve(false, false), 'MISSING IMAGE');
  assert.equal(resolve(false, true), 'JIT THEN LOAD');
  assert.equal(resolve(true, true), 'LOAD NATIVE');
  const intro = compilerIntroFrame({
    beat: 1,
    beatP: 1,
  });
  assert.deepEqual(intro.output, [-3, -1.75, -0.5, 0.75]);
  assert.deepEqual(intro.stages, [1, 1, 1, 1]);
  assert(intro.loaded && intro.compatible);
  assert.equal(intro.target, intro.imageTarget);
  for (const seconds of [0, 4, 5, 6.5, 8, 10.2, 11.5, 12.675, 20]) {
    const f = compilerIntroFrame({
      beat: 1,
      beatP: seconds / 23.474,
    });
    assert(f.stages.every((v) => v >= 0 && v <= 1));
    assert(f.stages[2] === 0 || f.stages[1] === 1);
    assert(f.stages[3] === 0 || f.stages[2] === 1);
    assert.equal(f.loaded, f.stages[3] === 1);
  }
  for (const [n, block] of [
    [0, 4],
    [1, 4],
    [10, 4],
    [257, 256],
  ])
    assert.deepEqual(
      coverage(n, block)
        .flat()
        .filter((r) => r.valid)
        .map((r) => r.index),
      Array.from(
        {
          length: n,
        },
        (_, i) => i,
      ),
    );
  const s = sampleModel('identity', {
    beat: 1,
    beatP: 0.5,
  });
  assert.equal(s.required, 18);
  assert.equal(s.cached, 9);
  assert(!s.keyMatches);
  assert.equal(specializationFixture(2, false).current, null);
  assert.equal(specializationFixture(2, true).current, 18);
  assert.equal(specializationFixture(3, true).current, 27);
  assert.equal(publishable(ARTIFACT), true);
  assert.equal(publishable(ARTIFACT.slice(0, 7)), false);
  assert.equal(publishable([0, ...ARTIFACT.slice(1)]), false);
  for (const [beatP, expected] of [
    [0.02, 1],
    [0.5, 2],
    [0.98, 3],
  ])
    assert.equal(
      sampleModel('ownership', {
        beat: 0,
        beatP,
      }).visiblePrograms,
      expected,
    );
  for (const [beatP, expected] of [
    [0.02, 1],
    [0.5, 3],
    [0.98, 4],
  ])
    assert.equal(
      sampleModel('artifacts', {
        beat: 0,
        beatP,
      }).revealed,
      expected,
    );
  for (const r of [32, 33, 41, 65, 129]) {
    const row = residency(r);
    assert.equal(row.perWarp, Math.ceil((32 * r) / 256) * 256);
    assert.equal(row.perBlock, row.perWarp * 8);
    assert.equal(row.warps, row.blocks * 8);
    assert(row.perBlock * row.blocks <= 65536);
    assert(row.perBlock * (row.blocks + 1) > 65536 || row.blocks === 8);
  }
  assert.equal(
    sampleModel('registers', {
      beat: 0,
      beatP: 0.65,
    }).r,
    32,
  );
  assert.equal(
    sampleModel('registers', {
      beat: 0,
      beatP: 0.67,
    }).r,
    33,
  );
  assert.equal(
    sampleModel('registers', {
      beat: 0,
      beatP: 0.98,
    }).r,
    33,
  );
  assert.equal(
    sampleModel('ownership', {
      beat: 1,
      beatP: 0.02,
    }).stage,
    'surfaces',
  );
  const blocks = coverage(10, 4).flat();
  assert.deepEqual(
    blocks.filter((r) => r.valid).map((r) => r.index),
    Array.from(
      {
        length: 10,
      },
      (_, i) => i,
    ),
  );
  assert.equal(blocks.filter((r) => !r.valid).length, 2);
  for (const beatP of [0, 0.2, 0.5, 0.8, 0.99]) {
    const p = sampleModel('publication', {
      beat: 0,
      beatP,
    });
    assert(!p.published || p.built === 8);
    assert(p.publicBytes === 0 || p.publicBytes === 8);
  }
  return true;
}
