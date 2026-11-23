import { cases } from './fixtures.mjs';
import { safeAnswer, verifyClaim } from './arithmetic.mjs';

// The accepted payloads are independent of the candidate renderer.
const cleanText =
  'Service: embedding-api. Last event: database failover completed. Event time: May 26 at 08:14 UTC.';
const accepted = {
  clean_update: cleanText,
  invented_eta: cleanText + ' The admitted record provides no support for that recovery estimate.',
};
const withholding = new Set([
  'No verifiable claims were supplied.',
  'The draft conflicts with the incident record. Please review the latest runbook state.',
  'Incident details are unavailable right now.',
  'The cited version is not the admitted snapshot.',
  'The admitted record provides no support for that recovery estimate.',
  'Some requested details are not supported by the admitted record.',
  'Unable to provide a grounded update.',
]);

export function reviewSuite(router) {
  const rows = cases.map((test) => {
    const { answer, route } = router(test);
    const served = Boolean(answer) && !withholding.has(answer);
    return {
      id: test.id,
      route,
      served,
      unsafe: served && answer !== accepted[test.id],
      verdicts: test.claims.map((claim) => verifyClaim(claim).verdict),
    };
  });
  const served = rows.filter((row) => row.served).length;
  const unsafe = rows.filter((row) => row.unsafe).length;
  return { rows, served, unsafe, total: rows.length, unsafeRate: served ? unsafe / served : null };
}

export const shipDraft = (test) => ({
  route: 'serve',
  answer: test.claims.map((c) => c.text).join(' '),
});
export const baselineReview = reviewSuite(shipDraft);
export const candidateReview = reviewSuite((test) => safeAnswer(test.claims));
export const relabeledReview = reviewSuite((test) => ({ ...shipDraft(test), route: 'shorten' }));
export const silentReview = reviewSuite(() => ({
  route: 'abstain',
  answer: 'Unable to provide a grounded update.',
}));
