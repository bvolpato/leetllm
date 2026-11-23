import {
  incidentsPerMillion,
  interruptedBudget,
  pairedEvidence,
  serviceGate,
  sourceWaitBudget,
} from './arithmetic.mjs';
import {
  PAGINATION_BEAT_SECONDS,
  REPEATED_CURSOR_PAGES,
  SCENES,
  TALK_BUDGET,
} from './fixtures.mjs';
import { paginationSnapshot, pairedPlayback, sampleModel } from './construction.mjs';
import { PAIRED, SERVICE_CHECK, freshEvidence, inspectPageTrace } from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert.equal(interruptedBudget().remaining, 6);
  assert.equal(interruptedBudget().oldContinuation, 7);
  assert.equal(interruptedBudget().newContinuation, 6);
  assert.deepEqual(sourceWaitBudget(), {
    wait: 1000,
    other: 200,
    hop: 20,
    before: 1200,
    after: 1220,
  });
  assert.deepEqual(freshEvidence(false).counts, {
    both: 18,
    baselineOnly: 3,
    candidateOnly: 6,
    neither: 13,
  });
  assert.deepEqual(freshEvidence(true).counts, {
    both: 20,
    baselineOnly: 1,
    candidateOnly: 6,
    neither: 13,
  });
  assert.equal(freshEvidence(true).candidateHits, 26);
  assert.equal(freshEvidence(true).baselineHits, 21);
  assert.equal(freshEvidence(true).percentagePointChange, 12.5);
  assert.equal(freshEvidence(true).service.passes, false);
  assert.equal(paginationSnapshot(1, 2.399 / PAGINATION_BEAT_SECONDS).pages, 0);
  assert.equal(paginationSnapshot(1, 2.401 / PAGINATION_BEAT_SECONDS).pages, 1);
  assert.equal(paginationSnapshot(1, 5.099 / PAGINATION_BEAT_SECONDS).duplicate, false);
  for (const elapsed of [5.101, 5.275, 5.7875, 6.7875, 7.7875, 20.6]) {
    const current = paginationSnapshot(1, elapsed / PAGINATION_BEAT_SECONDS);
    assert.equal(current.pages, 2);
    assert.equal(current.duplicate, true);
    assert.equal(current.complete, false);
    assert.equal(current.canRequest, false);
    assert.deepEqual(current.cursors, ['C-17']);
  }
  const distinct = inspectPageTrace([
    REPEATED_CURSOR_PAGES[0],
    {
      page: 2,
      requestedCursor: 'C-17',
      nextCursor: 'C-18',
    },
  ]);
  assert.equal(distinct.duplicate, false);
  assert.equal(distinct.complete, false);
  assert.equal(distinct.canRequest, true);
  const terminal = inspectPageTrace([
    REPEATED_CURSOR_PAGES[0],
    {
      page: 2,
      requestedCursor: 'C-17',
      nextCursor: null,
    },
  ]);
  assert.equal(terminal.complete, true);
  assert.equal(terminal.canRequest, false);
  assert.throws(
    () =>
      inspectPageTrace([
        {
          page: 1,
          requestedCursor: 'unrequested',
          nextCursor: 'C-17',
        },
      ]),
    /previous response cursor/,
  );
  assert.throws(
    () =>
      inspectPageTrace([
        {
          page: 1,
          requestedCursor: null,
        },
      ]),
    /nonempty string or null/,
  );
  assert.throws(
    () =>
      inspectPageTrace([
        ...REPEATED_CURSOR_PAGES,
        {
          page: 3,
          requestedCursor: 'C-17',
          nextCursor: 'C-18',
        },
      ]),
    /must stop/,
  );
  assert.throws(
    () =>
      inspectPageTrace([
        {
          page: 1,
          requestedCursor: null,
          nextCursor: null,
        },
        {
          page: 2,
          requestedCursor: null,
          nextCursor: 'C-18',
        },
      ]),
    /must stop/,
  );
  assert.equal(PAIRED.n, 200);
  assert.deepEqual(PAIRED.counts, {
    both: 140,
    baselineOnly: 8,
    candidateOnly: 22,
    neither: 30,
  });
  assert.equal(PAIRED.baselineHits, 148);
  assert.equal(PAIRED.candidateHits, 162);
  assert.equal(PAIRED.baselineRate, 0.74);
  assert.equal(PAIRED.candidateRate, 0.81);
  assert.equal(PAIRED.percentagePointChange, 7);
  assert.equal(PAIRED.counts.candidateOnly - PAIRED.counts.baselineOnly, 14);
  assert.deepEqual(pairedPlayback(1, 0).counts, PAIRED.counts);
  for (let i = 0; i <= 100; i++) {
    const x = pairedPlayback(0, i / 100);
    assert.equal(
      Object.values(x.counts).reduce((a, b) => a + b, 0),
      x.n,
    );
    assert.equal(x.baselineHits, x.counts.both + x.counts.baselineOnly);
  }
  assert.equal(
    pairedEvidence(
      {
        q: false,
      },
      {
        q: false,
      },
    ).percentagePointChange,
    0,
  );
  assert.equal(
    pairedEvidence(
      {
        q: true,
      },
      {
        q: false,
      },
    ).percentagePointChange,
    -100,
  );
  assert.throws(() => pairedEvidence({}, {}), /same nonempty query IDs/);
  assert.throws(
    () =>
      pairedEvidence(
        {
          a: true,
        },
        {
          b: true,
        },
      ),
    /same nonempty query IDs/,
  );
  assert.throws(
    () =>
      pairedEvidence(
        {
          a: 1,
        },
        {
          a: true,
        },
      ),
    /booleans/,
  );
  assert.equal(incidentsPerMillion(5, 5_000_000), 1);
  assert.equal(incidentsPerMillion(1, 500_000), 2);
  assert.throws(() => incidentsPerMillion(1, true), /positive integer/);
  assert.throws(() => incidentsPerMillion(-1, 20), /nonnegative integer/);
  assert.equal(SERVICE_CHECK.successFraction, 0.9);
  assert.equal(SERVICE_CHECK.latencyPasses, true);
  assert.equal(SERVICE_CHECK.successPasses, false);
  assert.equal(SERVICE_CHECK.passes, false);
  assert.equal(
    serviceGate({
      successfulP95Ms: 799.999,
      attempts: 100,
      timeouts: 0,
    }).passes,
    true,
  );
  assert.equal(
    serviceGate({
      successfulP95Ms: 800,
      attempts: 100,
      timeouts: 0,
    }).passes,
    false,
  );
  assert.equal(
    serviceGate({
      successfulP95Ms: 680,
      attempts: 200,
      timeouts: 2,
    }).passes,
    true,
  );
  assert.equal(
    serviceGate({
      successfulP95Ms: 680,
      attempts: 200,
      timeouts: 3,
    }).passes,
    false,
  );
  assert.throws(
    () =>
      serviceGate({
        successfulP95Ms: 680,
        attempts: 0,
        timeouts: 0,
      }),
    /whole requests/,
  );
  assert.throws(
    () =>
      serviceGate({
        successfulP95Ms: 680,
        attempts: 200,
        timeouts: 201,
      }),
    /whole requests/,
  );
  assert.equal(
    TALK_BUDGET.reduce((sum, part) => sum + part.value, 0),
    15,
  );
  assert.equal(TALK_BUDGET.length, 6);
  for (const scene of SCENES)
    for (const beat of [0, 1])
      for (const beatP of [0, 0.15, 0.5, 0.85, 1]) {
        const sample = sampleModel(scene, {
          beat,
          beatP,
        });
        assert.equal(sample.step, beatP === 1 && beat === 0 ? 1 : beat);
        assert(sample.q >= 0 && sample.q <= 1);
        assert.equal(sample.talkMinutes, 15);
        assert.equal(
          sample.paired.counts.both +
            sample.paired.counts.baselineOnly +
            sample.paired.counts.candidateOnly +
            sample.paired.counts.neither,
          200,
        );
        if (scene === 'path') assert(sample.routeProgress >= 0 && sample.routeProgress <= 1);
        if (scene === 'next-experiment')
          assert.equal(sample.ablation.result, 'pending measurement');
      }
  return true;
}
