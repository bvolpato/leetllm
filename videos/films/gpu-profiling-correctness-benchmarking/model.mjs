import { ids, pairedRounds, regimes } from './fixtures.mjs';
import { clamp, ended, mix, motion, spoken, tailAllocation } from './arithmetic.mjs';
import { tracks } from './construction.mjs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
export function sampleModel(id, state) {
  const { step } = tracks[id].sample(state).snapshot,
    q = motion(state.beatP);
  if (id === 'intro')
    return {
      step,
      q,
      time: step === 0 ? 78 * q : 78,
      hostCall: 3,
      eventStart: 5,
      kernelStart: 10,
      kernelEnd: 75,
      complete: 78,
    };
  if (id === 'tail') {
    const count = step === 0 ? Math.floor(8 * q) : 8,
      allocated = tailAllocation(state, step),
      writes = Array.from(
        {
          length: count,
        },
        (_, i) => i,
      ).filter((i) => i <= 5);
    return {
      step,
      q,
      count,
      allocated,
      writes,
      valid: 5,
      illegal: count > 5,
      allocationOverrun: writes.some((i) => i >= allocated),
    };
  }
  if (id === 'tolerance') {
    const ease = (p) => {
        const v = clamp(p);
        return v * v * (3 - 2 * v);
      },
      beatP = step > state.beat ? 0 : state.beatP,
      referenceMove = state.cues ? spoken(state, 'tolerance-beat-2-focus-1', 1) : ease(beatP / 0.2),
      errorMove = state.cues ? spoken(state, 'tolerance-beat-2-focus-2', 1) : ease((beatP - 0.46) / 0.13),
      reference = step === 0 ? 0.1 : step === 1 ? mix(0.1, 0, referenceMove) : 0,
      error = step === 0 ? 1e-6 : step === 1 ? mix(1e-6, 5e-6, errorMove) : 5e-6,
      allowed = 2e-6 + 2e-5 * Math.abs(reference);
    return {
      step,
      q,
      reference,
      error,
      allowed,
      pass: error <= allowed,
    };
  }
  if (id === 'warmup')
    return {
      step,
      q,
      regimes,
      visible: step === 0 ? Math.floor(6 * q) : 6,
    };
  if (id === 'traffic') {
    const intervalChange = state.cues ? spoken(state, 'traffic-interval-shrinks', 1) : q,
      us = step === 0 ? 8 : mix(8, 3, intervalChange),
      bytes = 12 * 1000003;
    return {
      step,
      q: intervalChange,
      us,
      bytes,
      gbps: bytes / (us * 1e-6) / 1e9,
    };
  }
  if (id === 'paired') {
    const visible = Math.min(
        4,
        Math.floor(Math.max(0, state.beatP - 0.03) / (step === 0 ? 0.17 : 0.05)),
      ),
      raw = pairedRounds[step === 0 ? 0 : 1].slice(0, visible),
      median = (arm) => {
        const v = raw
          .filter((r) => r[0] === arm)
          .map((r) => r[1])
          .sort((a, b) => a - b);
        return v.length === 2 ? (v[0] + v[1]) / 2 : null;
      },
      a = median('A'),
      b = median('B');
    return {
      step,
      q,
      raw,
      visible,
      a,
      b,
      complete: visible === 4,
      speedup: a !== null && b !== null ? a / b : null,
      rows: (step === 0
        ? [[12, 10]]
        : [
            [12, 10],
            [9, 10],
          ]
      ).map(([a, b]) => ({
        a,
        b,
        speedup: a / b,
      })),
    };
  }
  const statuses = step === 0 ? [true, true, null, null] : [true, true, true, true];
  return {
    step,
    q,
    statuses,
    artifactChanged: step >= 2 || (step === 1 && q > 0.6),
  };
}
export function validateModel() {
  validateProfileModel();
  const tail = sampleModel('tail', {
    beat: 1,
    beatP: 0.8,
  });
  assert.deepEqual(tail.writes, [0, 1, 2, 3, 4, 5]);
  assert(tail.illegal);
  assert.equal(tail.allocated, 5);
  assert(
    sampleModel('tolerance', {
      beat: 0,
      beatP: 0.8,
    }).pass,
  );
  assert(
    !sampleModel('tolerance', {
      beat: 1,
      beatP: 0.8,
    }).pass,
  );
  const approaching = sampleModel('tolerance', {
      beat: 1,
      beatP: 0.1,
    }),
    nearZero = sampleModel('tolerance', {
      beat: 1,
      beatP: 0.4,
    });
  assert.equal(approaching.reference, 0.05);
  assert.equal(approaching.error, 1e-6);
  assert.equal(nearZero.reference, 0);
  assert.equal(nearZero.error, 1e-6);
  assert(nearZero.pass);
  assert.equal(
    sampleModel('tolerance', {
      beat: 0,
      beatP: 1,
    }).reference,
    sampleModel('tolerance', {
      beat: 1,
      beatP: 0,
    }).reference,
  );
  assert(
    Math.abs(
      sampleModel('traffic', {
        beat: 1,
        beatP: 0.8,
      }).gbps - 4000.012,
    ) < 1e-6,
  );
  assert(
    sampleModel('receipt', {
      beat: 1,
      beatP: 0.8,
    }).artifactChanged,
  );
  assert(
    sampleModel('receipt', {
      beat: 1,
      beatP: 1,
    }).artifactChanged,
  );
  for (let i = 0; i <= 100; i++) {
    const traffic = sampleModel('traffic', {
      beat: 1,
      beatP: i / 100,
    });
    assert.equal(traffic.bytes, 12000036);
    assert(Math.abs(traffic.gbps * traffic.us - 12000.036) < 1e-8);
  }
  assert.deepEqual(
    sampleModel('paired', {
      beat: 1,
      beatP: 0.8,
    }).rows.map((r) => r.speedup),
    [1.2, 0.9],
  );
  assert.equal(
    sampleModel('paired', {
      beat: 0,
      beatP: 0.4,
    }).speedup,
    null,
  );
  assert.equal(
    sampleModel('paired', {
      beat: 0,
      beatP: 0.9,
    }).speedup,
    1.2,
  );
  assert.equal(
    sampleModel('paired', {
      beat: 1,
      beatP: 0.9,
    }).speedup,
    0.9,
  );
  for (const id of ids)
    for (const beat of [0, 1])
      for (const beatP of [0, 0.1, 0.5, 0.8, 0.99999])
        assert.equal(
          sampleModel(id, {
            beat,
            beatP,
          }).step,
          beat,
        );
  return true;
}
export function launchContract(n = 1000003, threads = 256, inclusive = false, allocated = n) {
  const blocks = Math.ceil(n / threads),
    launched = blocks * threads;
  const writeCount = Math.min(launched, n + (inclusive ? 1 : 0)),
    lastWrite = writeCount - 1,
    writes =
      writeCount <= 4096
        ? Array.from(
            {
              length: writeCount,
            },
            (_, i) => i,
          )
        : null;
  return {
    n,
    threads,
    blocks,
    launched,
    excluded: launched - n,
    writeCount,
    lastWrite,
    writes,
    logicalOverrun: lastWrite >= n,
    allocationOverrun: lastWrite >= allocated,
  };
}
export function rotationPool(n, l2, free) {
  const slot = 12 * n,
    target = Math.max(8 * slot, 2 * l2 + slot),
    budget = Math.floor(free / (4 * slot)),
    desired = Math.ceil(target / slot),
    slots = desired;
  if (!Number.isInteger(n) || n < 1 || slots > budget) throw Error('Insufficient rotating pool budget');
  return {
    slot,
    l2,
    target,
    budget,
    desired,
    slots,
    pool: slots * slot,
    warmup: Math.max(20, 2 * slots),
  };
}
export function rooflineFixture(bytesPerElement = 12) {
  const n = 1000003,
    operations = 2 * n,
    traffic = bytesPerElement * n,
    bandwidth = 3e12,
    peak = 60e12,
    intensity = operations / traffic,
    roof = Math.min(peak, intensity * bandwidth);
  return {
    n,
    operations,
    traffic,
    bytesPerElement,
    intensity,
    bandwidth,
    peak,
    ridge: peak / bandwidth,
    roof,
    idealUs: (traffic / bandwidth) * 1e6,
  };
}
export function interpolatedQuantile(values, q) {
  if (!values.length || q < 0 || q > 1 || values.some((v) => !Number.isFinite(v)))
    throw Error('Finite nonempty samples and quantile in [0,1] required');
  const sorted = [...values].sort((a, b) => a - b),
    position = q * (sorted.length - 1),
    lo = Math.floor(position),
    hi = Math.ceil(position),
    fraction = position - lo;
  return {
    sorted,
    position,
    lo,
    hi,
    fraction,
    value: sorted[lo] + fraction * (sorted[hi] - sorted[lo]),
  };
}
export function replayMemory() {
  const initial = {
      X: [1, 2],
      Z: [3, 4],
      Y: [-1, -1],
    },
    saved = structuredClone(initial),
    afterPass = {
      X: [...initial.X],
      Z: [...initial.Z],
      Y: initial.X.map((x, i) => 1.25 * x + initial.Z[i]),
    },
    written = ['Y'],
    restored = structuredClone(afterPass);
  for (const key of written) restored[key] = [...saved[key]];
  return {
    initial,
    saved,
    afterPass,
    written,
    restored,
  };
}
export function serialPayoff(cpu, kernel, factor) {
  if (!(factor > 0)) throw Error('Positive speed factor required');
  const before = cpu + kernel,
    after = cpu + kernel / factor;
  return {
    cpu,
    kernel,
    factor,
    before,
    after,
    speedup: before / after,
  };
}
export const sampleDigest = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function parseSampleArtifact(bytes, expected, { n, dtype, regime, slots, gpu, timer }) {
  if (sampleDigest(bytes) !== expected) throw Error('sample artifact changed');
  if (!Number.isInteger(n) || n <= 0 || typeof n === 'boolean')
    throw Error('positive integer element count required');
  if (dtype !== 'float32') throw Error('this lab requires float32');
  if (
    !Number.isInteger(slots) ||
    slots < 1 ||
    (regime !== 'same-buffer' && regime !== 'buffer-rotated') ||
    (regime === 'same-buffer' && slots !== 1) ||
    (regime === 'buffer-rotated' && slots < 2)
  )
    throw Error('cache policy and slot count disagree');
  if (typeof gpu !== 'string' || !gpu.trim() || typeof timer !== 'string' || !timer.trim())
    throw Error('device and timer labels required');
  const lines = String(bytes).trim().split('\n');
  if (lines.shift() !== 'sample,slot,elapsed_us') throw Error('invalid sample schema');
  const rows = lines.map((line, i) => {
    const fields = line.split(',');
    if (fields.length !== 3 || fields.some((v) => !v.trim())) throw Error('invalid sample row');
    const [sample, slot, elapsed] = fields.map(Number);
    if (
      !Number.isInteger(sample) ||
      sample !== i ||
      !Number.isInteger(slot) ||
      slot !== i % slots ||
      !Number.isFinite(elapsed) ||
      elapsed <= 0
    )
      throw Error('invalid sample index, slot or timing');
    return {
      sample,
      slot,
      elapsed,
    };
  });
  if (rows.length < 2) throw Error('at least two samples required');
  return {
    rows,
    median: interpolatedQuantile(
      rows.map((r) => r.elapsed),
      0.5,
    ).value,
  };
}
export function receiptFixture() {
  const conditions = {
      n: 1000003,
      dtype: 'float32',
      regime: 'buffer-rotated',
      slots: 2,
      gpu: 'fixture-only',
      timer: 'synthetic',
    },
    values = {
      A: [102, 101, 104, 100, 103],
      B: [82, 81, 83, 80, 82],
    },
    csv = Object.fromEntries(
      Object.entries(values).map(([k, vs]) => [
        k,
        'sample,slot,elapsed_us\n' + vs.map((v, i) => `${i},${i % 2},${v}`).join('\n') + '\n',
      ]),
    ),
    digests = Object.fromEntries(Object.entries(csv).map(([k, v]) => [k, sampleDigest(v)])),
    a = parseSampleArtifact(csv.A, digests.A, conditions),
    b = parseSampleArtifact(csv.B, digests.B, conditions);
  return {
    conditions,
    values,
    csv,
    digests,
    a,
    b,
    ratio: a.median / b.median,
  };
}
export function freshProfileSnapshot(state) {
  return {
    launch: launchContract(513, 256, !ended(state, 'fresh-guard-repair', 1), 768),
    failureRevealed: ended(state, 'fresh-extra-write', 1),
    bindingRevealed: ended(state, 'fresh-binding-answer', 3),
    changedBytes: spoken(state, 'changed-byte-question', 2) > 0,
    speedup: 13 / 10,
  };
}
export function validateProfileModel() {
  const c = launchContract();
  assert.equal(c.blocks, 3907);
  assert.equal(c.excluded, 189);
  const wrong = launchContract(513, 256, true, 768);
  assert(wrong.logicalOverrun);
  assert(!wrong.allocationOverrun);
  assert(launchContract(513, 256, true, 513).allocationOverrun);
  assert(!launchContract(513, 256, false).logicalOverrun);
  const pool = rotationPool(1000003, 50331648, 14884405248);
  assert.equal(pool.slots, 10);
  assert.equal(pool.pool, 120000360);
  assert.equal(pool.target, 112663332);
  const roof = rooflineFixture();
  assert.equal(roof.roof, 0.5e12);
  assert(Math.abs(roof.idealUs - 4.000012) < 1e-10);
  assert.equal(interpolatedQuantile([8, 10, 12, 14, 16, 40], 0.9).value, 28);
  assert.deepEqual(replayMemory().restored, replayMemory().initial);
  assert.equal(serialPayoff(60, 40, 2).speedup, 1.25);
  const f = receiptFixture();
  assert.equal(f.ratio, 102 / 82);
  assert.throws(
    () => parseSampleArtifact('truncated', f.digests.B, f.conditions),
    /artifact changed/,
  );
  assert.throws(
    () =>
      parseSampleArtifact(f.csv.A, f.digests.A, {
        ...f.conditions,
        n: true,
      }),
    /integer/,
  );
  const before = freshProfileSnapshot({
    beat: 0,
    beatP: 1,
  });
  assert(!before.failureRevealed);
  assert(!before.bindingRevealed);
  return true;
}
