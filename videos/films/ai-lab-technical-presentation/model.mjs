import { incidentsPerMillion, pairedEvidence, serviceGate } from './arithmetic.mjs';
export function syntheticPairs() {
  const pairs = [
    ...Array.from(
      {
        length: 140,
      },
      () => [true, true],
    ),
    ...Array.from(
      {
        length: 8,
      },
      () => [true, false],
    ),
    ...Array.from(
      {
        length: 22,
      },
      () => [false, true],
    ),
    ...Array.from(
      {
        length: 30,
      },
      () => [false, false],
    ),
  ];
  const baseline = Object.fromEntries(
    pairs.map(([oldHit], index) => [`query-${String(index + 1).padStart(3, '0')}`, oldHit]),
  );
  const candidate = Object.fromEntries(
    pairs.map(([, newHit], index) => [`query-${String(index + 1).padStart(3, '0')}`, newHit]),
  );
  return pairedEvidence(baseline, candidate);
}
export const PAIRED = syntheticPairs();
export const INCIDENT_RATES = Object.freeze({
  prior: incidentsPerMillion(5, 5_000_000),
  candidate: incidentsPerMillion(1, 500_000),
});
export const SERVICE_CHECK = serviceGate({
  successfulP95Ms: 680,
  attempts: 200,
  timeouts: 20,
});
export function inspectPageTrace(pages) {
  const seen = new Set();
  let expectedCursor = null,
    duplicate = false,
    complete = false;
  for (const [index, page] of pages.entries()) {
    if (duplicate || complete)
      throw new RangeError('paging must stop after a repeated cursor or terminal page');
    if (page.page !== index + 1 || page.requestedCursor !== expectedCursor)
      throw new RangeError('page request must use the previous response cursor');
    if (
      page.nextCursor !== null &&
      (typeof page.nextCursor !== 'string' || !page.nextCursor.length)
    )
      throw new TypeError('next cursor must be a nonempty string or null');
    complete = page.nextCursor === null;
    duplicate = !complete && seen.has(page.nextCursor);
    if (!complete) seen.add(page.nextCursor);
    expectedCursor = page.nextCursor;
  }
  return {
    records: pages,
    pages: pages.length,
    cursors: [...seen],
    duplicate,
    complete,
    canRequest: !duplicate && !complete,
    nextCursor: expectedCursor,
  };
}
export function freshEvidence(repaired) {
  const tuples = [
    ...Array.from(
      {
        length: 18,
      },
      () => [true, true],
    ),
    ...Array.from(
      {
        length: 3,
      },
      () => [true, false],
    ),
    ...Array.from(
      {
        length: 6,
      },
      () => [false, true],
    ),
    ...Array.from(
      {
        length: 13,
      },
      () => [false, false],
    ),
  ];
  const rows = tuples.map(([baseline, candidate], i) => ({
    id: `new-${i}`,
    baseline,
    candidate: repaired && [18, 19].includes(i) ? true : candidate,
  }));
  return {
    ...pairedEvidence(
      Object.fromEntries(rows.map((r) => [r.id, r.baseline])),
      Object.fromEntries(rows.map((r) => [r.id, r.candidate])),
    ),
    rows,
    service: serviceGate({
      successfulP95Ms: 780,
      attempts: 40,
      timeouts: 1,
    }),
  };
}
