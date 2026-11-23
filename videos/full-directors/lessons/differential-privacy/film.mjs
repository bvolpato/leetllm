import assert from 'node:assert/strict';
import booth from '../../../director-cuts/lessons/differential-privacy/film.mjs';
import { opening, adjacency, aggregate, event, audits, mechanisms } from './participation.mjs';
import { clipping, noise, sampler, alignment, coordinates } from './gradients.mjs';
import { checkpoint, accounting, practice, planState } from './releases.mjs';
import {
  customer,
  customerRail,
  visibleMessages,
  clipVector,
  privacyEventBand,
  releaseEvent,
  raw,
  record,
  other,
  withRecord,
  drawNoise,
  noisy,
  replacement,
  scaledTrace,
  scores,
  selected,
  wheel,
  audit,
  passages,
  samples,
  utilityDiagnostics,
  dimensions,
  sumNoiseRms,
  stepNoiseRms,
  budget,
} from './examples.mjs';

const shots = [
  opening,
  adjacency,
  aggregate,
  event,
  audits,
  mechanisms,
  clipping,
  noise,
  sampler,
  alignment,
  coordinates,
  checkpoint,
  accounting,
  practice,
];
function draw(ctx, clock) {
  shots[clock.beat.chapterIndex](ctx, clock);
}
function check() {
  const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} differs from ${b}`);
  close(customer.aliceTickets[0] + customer.aliceTickets[1], 1.5);
  for (const removed of [0, 1, 4, 12]) {
    assert.equal(
      [0, 1, 2].flatMap((t) => visibleMessages(t, removed)).filter(Boolean).length,
      12 - removed,
    );
    assert.deepEqual(visibleMessages(3, removed), [true, true]);
  }
  for (const [clip, divide, full, other, gap] of [
    [false, false, 1.75, 0.25, 1.5],
    [true, false, 1.25, 0.25, 1],
    [true, true, 0.625, 0.125, 0.5],
  ]) {
    const s = customerRail(clip, divide);
    close(s.full, full);
    close(s.other, other);
    close(s.delta, gap);
    close(s.full - s.other, s.delta);
  }
  const { epsilon, slack, withoutAlice: q, withAlice: p, scale } = releaseEvent;
  assert.deepEqual([q * scale, p * scale, slack * scale], [10, 17, 1]);
  for (const d of [0, slack]) {
    const range = privacyEventBand(epsilon, d, q);
    assert.equal(p >= range.lower && p <= range.upper, d > 0);
    assert.equal(p <= Math.exp(epsilon) * q + d && q <= Math.exp(epsilon) * p + d, d > 0);
    assert.deepEqual(
      [range.lower, range.upper].map((p) => (p * scale).toFixed(2)),
      d === 0 ? ['6.07', '16.49'] : ['5.46', '17.49'],
    );
  }
  assert.equal(audit[0].target, audit[1].target);
  assert.ok(audit[0].reference < audit[1].reference);
  assert.equal(audit.filter((r) => !r.member).length, 1);
  assert.deepEqual(
    passages.map((p) => p.reference === p.output),
    [true, false],
  );
  close(wheel.filter((v) => v === 'all').length / wheel.length, 0.05);
  booth.check();
  close(clipVector(raw).norm, 5);
  close(record[0], 0.6);
  close(record[1], 0.8);
  assert.deepEqual(clipVector([0, 0]).clipped, [0, 0]);
  close(Math.hypot(Math.SQRT1_2, Math.SQRT1_2), 1);
  assert.ok(Math.hypot(0.71, 0.71) > 1);
  for (let axis = 0; axis < 2; axis++) {
    close(other[axis] + record[axis], withRecord[axis]);
    close(withRecord[axis] + drawNoise[axis], noisy[axis]);
  }
  close(other[0], 1);
  close(other[1], 1.1);
  close(noisy[0], 1.8);
  close(noisy[1], 1.6);
  close(Math.hypot(...withRecord.map((v, i) => v - other[i])), 1);
  for (const divided of [false, true]) {
    const s = replacement(divided);
    close(s.right - s.left, s.gap);
    close(s.gap, 2 * s.sd);
    const t = scaledTrace(divided);
    for (let i = 0; i < 2; i++) {
      close(t.other[i] + t.record[i], t.withRecord[i]);
      close(t.withRecord[i] + t.noise[i], t.noisy[i]);
    }
    close(t.distance, Math.hypot(...t.record));
    close(t.sd, divided ? 0.5 : 1.5);
  }
  assert.deepEqual(
    samples.map((m) => m.reduce((a, b) => a + b)),
    [2, 1],
  );
  const initial = utilityDiagnostics(0),
    later = utilityDiagnostics(0.5);
  close(initial.utility, 1);
  assert.ok(later.utility < initial.utility);
  close(
    later.signal.reduce((v, a, i) => v + a * (later.noisy[i] - a), 0),
    0,
  );
  assert.equal(later.clippedCount, 1);
  const raised = utilityDiagnostics(0, 2);
  for (const [run, expectedLength, expectedMean] of [
    [later, 1, [0.475, 0.575]],
    [raised, 2, [0.625, 0.775]],
  ]) {
    assert.equal(run.clippedCount, 1);
    close(Math.hypot(...run.clipped[2]), expectedLength);
    for (const i of [0, 1, 3]) assert.deepEqual(run.clipped[i], run.records[i]);
    run.signal.forEach((value, axis) => close(value, expectedMean[axis]));
  }
  assert.equal(utilityDiagnostics(0, 0.75).clippedCount, 2);
  assert.deepEqual(dimensions.map((d) => sumNoiseRms(d).toFixed(2)), ['2236.07', '83666.00']);
  assert.deepEqual(dimensions.map((d) => stepNoiseRms(d).toFixed(2)), ['0.17', '6.54']);
  close(sumNoiseRms(dimensions[1]) / sumNoiseRms(dimensions[0]), Math.sqrt(1400));
  close(stepNoiseRms(dimensions[1]) / stepNoiseRms(dimensions[0]), Math.sqrt(1400));
  for (const [sigma, bound] of [
    [undefined, '1.768'],
    [4, '2.268'],
    [8, '1.893'],
  ]) {
    const b = budget(sigma);
    assert.equal(b.ledger.best.alpha, 16);
    assert.deepEqual(b.row.charges.slice(0, 2), [0.5, 0.5]);
    close(b.row.conversion, Math.log(1e5) / 15);
    if (sigma) close(b.row.charges[2], sigma === 4 ? 0.5 : 0.125);
    assert.equal(b.fits, sigma !== 4);
    assert.equal(b.ledger.best.epsilon.toFixed(3), bound);
  }
  assert.equal(budget(4).row.charges[2] / budget(8).row.charges[2], 4);
  assert.equal(selected.checkpoint, 7);
  close(selected.value, Math.max(...scores.map((s) => s.value)));
  const prediction = planState({ beat: { beatIndex: 2 }, reveal: () => 0 });
  assert.ok(
    !prediction.charged4 &&
      !prediction.charged8 &&
      !prediction.convert8 &&
      !prediction.upperVerdict &&
      !prediction.lowerVerdict,
  );
}
export default { title: "Learning While Limiting One Example's Influence", draw, check };
