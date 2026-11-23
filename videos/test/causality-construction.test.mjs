import test from 'node:test';
import assert from 'node:assert/strict';
import {
  causalTicketLedger,
  standardizedFixture,
  effectAtMix,
  responseTypePairing,
  weightedTicketFixture,
  instrumentFixture,
  monotoneCompliance,
  policyValueFixture,
  clickExposureFixture,
  replayReplacementFixture,
  freshAuditFixture,
  junctionPathOpen,
} from '../animations/causality.mjs';
const near = (a, b) => assert(Math.abs(a - b) < 1e-10, `${a} versus ${b}`);

test('the same 200 ticket identities reproduce both raw and target-standardized rates', () => {
  const rows = causalTicketLedger();
  assert.equal(rows.length, 200);
  assert.equal(new Set(rows.map((t) => t.id)).size, 200);
  near(rows.filter((t) => t.arm === 'assistant' && t.resolved).length / 100, 0.54);
  near(rows.filter((t) => t.arm === 'control' && t.resolved).length / 100, 0.76);
  const f = standardizedFixture();
  near(f.assistant, 0.78);
  near(f.control, 0.68);
  near(f.difference, 0.1);
  near(standardizedFixture(8).difference, 0.03);
  assert.deepEqual(causalTicketLedger(), rows);
});
test('all four conditional binomial contributions form the uncertainty interval', () => {
  const f = standardizedFixture();
  near(f.variance, 0.00769111111111111);
  near(f.se, 0.08769898010302692);
  near(f.interval[0], -0.07189000100193274);
  near(f.interval[1], 0.2718900010019327);
  assert.equal(f.varianceParts.length, 4);
  assert(f.varianceParts.every((v) => v > 0));
});
test('heterogeneous effects change with population and treated composition', () => {
  near(effectAtMix(0.5), 0.1);
  near(effectAtMix(0.1), 0.148);
  near(effectAtMix(0.7), 0.076);
  near(effectAtMix(0.2, [0.1, 0.1]), 0.1);
});
test('every possible binary response pairing preserves both outcome margins', () => {
  for (let h = 0; h <= 22; h++) {
    const f = responseTypePairing(h);
    assert.equal(f.total, 100);
    assert.equal(f.assistantSuccess, 78);
    assert.equal(f.controlSuccess, 68);
    assert(Object.values(f.counts).every((v) => v >= 0));
  }
  assert.deepEqual(responseTypePairing(22).counts, {
    always: 46,
    helped: 32,
    harmed: 22,
    never: 0,
  });
  assert.throws(() => responseTypePairing(23));
});
test('inverse weighting changes mass without inventing new tickets', () => {
  const arms = weightedTicketFixture();
  for (const a of arms) {
    assert.equal(a.observed, 100);
    near(a.mass, 200);
    near(a.ess, 36);
    a.groups.forEach((g) => near(g.mass, 100));
  }
  near(arms[0].successMass, 140);
  near(arms[1].successMass, 120);
  near(arms[0].rate, 0.7);
  near(arms[1].rate, 0.6);
});
test('constant stabilization preserves each normalized rate and ESS', () => {
  const original = weightedTicketFixture(),
    scaled = weightedTicketFixture({ stabilize: 0.5 });
  for (let i = 0; i < 2; i++) {
    near(scaled[i].mass, 100);
    near(scaled[i].rate, original[i].rate);
    near(scaled[i].ess, original[i].ess);
    assert.deepEqual(
      scaled[i].tickets.map((t) => t.id),
      original[i].tickets.map((t) => t.id),
    );
  }
});
test('the declared raw cap changes the effective comparison while lowering concentration', () => {
  const arms = weightedTicketFixture({ clip: 5 });
  near(arms[0].mass, 150);
  near(arms[1].mass, 150);
  near(arms[0].rate, 19 / 30);
  near(arms[1].rate, 2 / 3);
  near(arms[0].rate - arms[1].rate, -1 / 30);
  near(arms[0].ess, 810 / 13);
  assert.equal(arms[0].groups[1].weight, 1 / 0.9);
});
test('a fixed exclusion violation is amplified by a weaker first stage', () => {
  near(instrumentFixture().ratio, 0.1);
  near(instrumentFixture(0.4, 0.01).ratio, 0.125);
  near(instrumentFixture(0.04, 0.01).ratio, 0.35);
  near(instrumentFixture(0.04, 0.01).bypassBias, 0.25);
  assert.throws(() => instrumentFixture(0));
});
test('monotone response types reproduce both instrument-group uptake margins', () => {
  for (const [p0, p1] of [
    [0.3, 0.7],
    [0.2, 0.6],
    [0, 1],
    [0.4, 0.4],
  ]) {
    const f = monotoneCompliance(p0, p1);
    near(f.always, p0);
    near(f.always + f.compliers, p1);
    near(f.always + f.compliers + f.never, 1);
    assert.equal(f.defiers, 0);
    assert(Object.values(f).every((v) => v >= 0));
  }
  assert.throws(() => monotoneCompliance(0.7, 0.3));
});
test('DR recomputes the actual per-row correction under each nuisance change', () => {
  const matched = policyValueFixture(),
    wrong = policyValueFixture({ estimatedPropensity: 0.4 }),
    restored = policyValueFixture({ rewardShift: 0, estimatedPropensity: 0.4 });
  near(matched.baseline, 0.75);
  near(matched.correction, -0.05);
  near(matched.dr, 0.7);
  near(wrong.correction, -0.0625);
  near(wrong.dr, 0.6875);
  near(restored.dr, 0.7);
  near(matched.ips, 0.7);
  matched.groupCorrections.forEach((v) => near(v, -5));
  assert.deepEqual(
    wrong.rows.map((t) => t.id),
    matched.rows.map((t) => t.id),
  );
});
test('examination weighting recovers relevance only under the supplied exposure model', () => {
  const f = clickExposureFixture();
  near(f.click, 0.12);
  near(f.corrected, 0.6);
  near(clickExposureFixture(0.4).corrected, 0.3);
  assert.throws(() => clickExposureFixture(0));
});
test('return-value replacement has to recompute downstream state for its stated estimand', () => {
  assert.equal(replayReplacementFixture().success, false);
  const r = replayReplacementFixture(4);
  assert.equal(r.doubled, 8);
  assert.equal(r.success, true);
  assert.equal(replayReplacementFixture(4, { freezeDownstream: true }).success, false);
});
test('reversing the audit rule excludes successes without turning them into failures', () => {
  const original = freshAuditFixture(0),
    final = freshAuditFixture(1);
  near(original.difference, 0);
  near(final.arms[0].rate, 0);
  near(final.arms[1].rate, 0.4);
  near(final.difference, -0.4);
  assert.deepEqual(
    final.arms.map((a) => a.count),
    [12, 20],
  );
  for (const p of [0.1, 0.25, 0.5, 0.75, 1]) {
    const f = freshAuditFixture(p);
    assert.deepEqual(
      f.arms.map((a) => a.full),
      original.arms.map((a) => a.full),
    );
    assert(
      f.arms[0].selected.every((t) =>
        original.arms[0].full.some((o) => o.id === t.id && o.resolved === t.resolved),
      ),
    );
  }
});
test('conditioning blocks chain/fork junctions and opens the collider junction', () => {
  for (const kind of ['chain', 'fork']) {
    assert.equal(junctionPathOpen(kind), true);
    assert.equal(junctionPathOpen(kind, true), false);
  }
  assert.equal(junctionPathOpen('collider'), false);
  assert.equal(junctionPathOpen('collider', true), true);
});
