import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../animations/gpu-profiling-correctness-benchmarking.mjs';

const cue = (progress) => ({ phase: progress === 1 ? 'after' : 'during', progress });

test('the rounded launch separates a logical extra writer from an allocation overrun', () => {
  const hidden = m.launchContract(513, 256, true, 768);
  assert.equal(hidden.launched, 768);
  assert.equal(hidden.lastWrite, 513);
  assert(hidden.logicalOverrun);
  assert(!hidden.allocationOverrun);
  assert(m.launchContract(513, 256, true, 513).allocationOverrun);
  assert.equal(m.launchContract(513, 256, false, 768).lastWrite, 512);
});

test('artifact integrity fails before parsing and runtime declarations cannot masquerade as valid conditions', () => {
  const f = m.receiptFixture();
  assert.throws(
    () => m.parseSampleArtifact('not even CSV', f.digests.A, { n: true }),
    /artifact changed/,
  );
  const truncated = f.csv.B.slice(0, -3);
  assert(truncated.endsWith('4,0,'));
  assert.notEqual(m.sampleDigest(truncated), f.digests.B);
  assert.throws(
    () => m.parseSampleArtifact(truncated, f.digests.B, f.conditions),
    /artifact changed/,
  );
  for (const mutation of [{ n: true }, { dtype: 'float16' }, { slots: 1 }, { timer: '' }]) {
    assert.throws(() =>
      m.parseSampleArtifact(f.csv.A, f.digests.A, { ...f.conditions, ...mutation }),
    );
  }
  for (const rows of ['0,0,10\n2,1,11', '0,1,10\n1,0,11', '0,0,10\n1,1,NaN', '0,0,10']) {
    const bytes = 'sample,slot,elapsed_us\n' + rows + '\n';
    assert.throws(() => m.parseSampleArtifact(bytes, m.sampleDigest(bytes), f.conditions));
  }
  assert.equal(f.ratio, 102 / 82);
});

test('interpolated quantiles retain the tail and leave acquisition order intact', () => {
  const samples = [40, 8, 16, 10, 14, 12];
  const original = [...samples];
  assert.equal(m.interpolatedQuantile(samples, 0.5).value, 13);
  assert.equal(m.interpolatedQuantile(samples, 0.1).value, 9);
  assert.equal(m.interpolatedQuantile(samples, 0.9).value, 28);
  assert.deepEqual(samples, original);
});

test('replay restores written output bytes without changing the input arrays', () => {
  const state = m.replayMemory();
  assert.deepEqual(state.afterPass.Y, [4.25, 6.5]);
  assert.deepEqual(state.restored, state.initial);
  assert.deepEqual(state.written, ['Y']);
  state.restored.Y[0] = 99;
  assert.equal(state.saved.Y[0], -1);
});

test('new-input failure and changed-artifact answers wait for their separate spoken reveals', () => {
  for (const progress of [0, 0.5, 0.999]) {
    const state = m.freshProfileSnapshot({
      beat: 1,
      cues: { 'fresh-extra-write': cue(progress), 'fresh-guard-repair': cue(0) },
    });
    assert(!state.failureRevealed);
    assert(state.launch.logicalOverrun);
    assert(
      !m.freshProfileSnapshot({ beat: 3, cues: { 'fresh-binding-answer': cue(progress) } })
        .bindingRevealed,
    );
  }
  const failure = m.freshProfileSnapshot({
    beat: 1,
    cues: { 'fresh-extra-write': cue(1), 'fresh-guard-repair': cue(0) },
  });
  assert(failure.failureRevealed && failure.launch.logicalOverrun);
  const repaired = m.freshProfileSnapshot({
    beat: 1,
    cues: { 'fresh-extra-write': cue(1), 'fresh-guard-repair': cue(1) },
  });
  assert(!repaired.launch.logicalOverrun);
  assert(
    m.freshProfileSnapshot({ beat: 3, cues: { 'fresh-binding-answer': cue(1) } }).bindingRevealed,
  );
});

test('traffic and system changes alter only their declared model quantities', () => {
  const useful = m.rooflineFixture(12),
    measured = m.rooflineFixture(16);
  assert.equal(useful.operations, measured.operations);
  assert.equal(measured.traffic / useful.traffic, 4 / 3);
  assert(Math.abs(measured.idealUs / useful.idealUs - 4 / 3) < 1e-14);
  assert.equal(m.serialPayoff(60, 40, 2).after, 80);
  assert.equal(m.serialPayoff(95, 5, 2).after, 97.5);
});
