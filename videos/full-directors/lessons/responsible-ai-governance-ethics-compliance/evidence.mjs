import assert from 'node:assert/strict';
import { digest } from '../../../films/responsible-ai-governance-ethics-compliance/arithmetic.mjs';
import {
  manifest,
  evidenceNames,
  proposal,
  workflows,
  originalEvents,
} from '../../../films/responsible-ai-governance-ethics-compliance/fixtures.mjs';
import {
  actorLabel,
  appealReplayFixture,
  chain,
  classificationFixture,
  evaluate,
  oversight,
  packageDecision,
  pathComparison,
  requiredReviews,
  riskErrors,
  scopeChangeFixture,
  triage,
  verify,
} from '../../../films/responsible-ai-governance-ethics-compliance/model.mjs';
import { at } from './studio.mjs';
export {
  actorLabel,
  appealReplayFixture,
  classificationFixture,
  digest,
  evidenceNames,
  manifest,
  oversight,
  proposal,
  requiredReviews,
  scopeChangeFixture,
  triage,
  workflows,
};
export const original = appealReplayFixture().originalRecord;
export function instructionLabel(file) {
  return file.untrusted ? 'Untrusted instruction present' : 'Instruction flag clear';
}
export const scoreOnlyProposal = { ...proposal, untrusted: false };
// Both counts use units of 10²⁴ floating point operations.
const trainingExample = { trainingCompute: 8, presumptionThreshold: 10 };
export function modelReviewState(k) {
  const exampleVisible = at(k, 2, 'eight tenths');
  return {
    thresholdShare: exampleVisible ? trainingExample.trainingCompute / trainingExample.presumptionThreshold : null,
    decisionOpen: at(k, 3, "Check the Commission's decision"),
    designationFound: at(k, 3, 'the Commission designated the model'),
  };
}
export function receipt(file, decision = 'APPROVED') {
  return { binding: digest(file), decision };
}
export function riskState(k) {
  const evidence = at(k, 1, 'Attach attack report')
    ? ['Attack report A7', 'Approval replay R7']
    : [];
  const residual = at(k, 1, 'likelihood falls') ? { likelihood: 2, impact: 5 } : null;
  const due = at(k, 3, 'November sixth') ? '2026-11-06' : '2026-12-01';
  const row = {
    owner: 'Release owner',
    control: 'Authorization G7',
    reviewDate: due,
    evidence,
    residual: residual ? 'Likelihood 2, impact 5' : '',
  };
  return { row, residual, initial: { likelihood: 4, impact: 5 }, errors: riskErrors(row) };
}
const observedEffects = [0, 0, 1];
const eligible = [false, true];
const affectedTraces = (counts) => counts.map((count) => count > 0);
const hypotheticalEffects = [0, 0, 2];
export const repeatEffect = {
  countOnA3: hypotheticalEffects[2],
  hits: affectedTraces(hypotheticalEffects).filter(Boolean).length,
};
export function suite(k) {
  const b = k.beat.beatIndex,
    restored = at(k, 4, 'Put the original');
  const retest = !restored && at(k, 2, 'After a repair'),
    missing = retest && at(k, 2, 'drops the two eligible');
  const a = affectedTraces(retest ? [0, 0, 0] : observedEffects),
    r = missing ? [] : retest ? eligible.map(() => false) : eligible;
  const readA = at(k, 0, 'Trace A three'),
    readR = at(k, 0, 'wrongly blocked R two');
  const visible = b === 0 ? [readA ? 3 : 0, readR ? 2 : 0] : [3, r.length];
  if (b === 2 && at(k, 2, 'After a repair')) {
    visible[0] = at(k, 2, 'This time none') ? 3 : 0;
    visible[1] = at(k, 2, 'both eligible requests get through') ? r.length : 0;
  }
  return { a, r, retest, missing, visible, report: retest ? 'E8' : 'E7', ...evaluate(a, r) };
}
export const percent = (v) =>
  v === null ? 'unknown' : (100 * v).toFixed(1).replace(/\.0$/, '') + '%';
// Observed fields in one constructed replay. The other three rejections
// still need their own traces before anyone can assign a cause.
export const s1Replay = {
  id: 'S1',
  selectedShare: 10,
  confirmationOpened: true,
  gateInput: { candidate: 'C17', share: null },
};
export const pathCeiling = 0.25;
const originalPaths = pathComparison();

function accessCueEnd(k, phrase) {
  k.reveal(phrase, 0, { captionStart: phrase });
  return k.wordCue(phrase).end;
}

function accessAfter(k, beat, phrase) {
  const current = k.beat.beatIndex;
  if (current !== beat) return current > beat;
  return k.elapsed + 1e-9 >= accessCueEnd(k, phrase);
}

export function accessState(k) {
  const b = k.beat.beatIndex;
  const screenCount = originalPaths.screen.length;
  const seen =
    b < 1
      ? 0
      : b === 1
        ? Math.floor(screenCount * at(k, 1, 'Replay their outcomes', 2.3))
        : screenCount;
  const extra =
    b === 4
      ? Math.floor(originalPaths.web.length * at(k, 4, 'add twenty successful', 3))
      : b === 5 && !accessAfter(k, 5, 'Set the extra web cases aside')
        ? originalPaths.web.length
        : 0;
  const repaired = accessAfter(k, 5, 'all four rejected requests get through')
    ? originalPaths.blocked
    : 0;
  const retest = accessAfter(k, 5, 'After a repair, rerun the original twenty-eight');
  const pendingRetest = retest && repaired === 0;
  const result = pathComparison(extra, repaired);
  const pooledAnswer = b === 4
    ? accessCueEnd(k, 'Four out of forty-eight is eight point three percent')
    : 0;
  const pooledMove = b === 4 ? Math.min(1, Math.max(0, (k.elapsed - pooledAnswer) / 0.65)) : 1;
  const step = at(k, 3, 'was empty')
    ? 3
    : at(k, 3, 'reached confirmation')
      ? 2
      : at(k, 3, 'chose a scope')
        ? 1
        : 0;
  const ids = result.screen.map((blocked, i) => ({
    id: 'S' + (i + 1),
    blocked,
    tested: !pendingRetest && i < seen,
  }));
  return {
    ...result,
    extra,
    repaired,
    pendingRetest,
    ids,
    seen,
    step,
    ceilingRead: accessAfter(k, 0, 'above twenty-five percent'),
    screenRead: !pendingRetest && accessAfter(k, 2, 'That is fifty percent'),
    webRead: !pendingRetest && accessAfter(k, 2, 'zero of twenty'),
    pooledRead: !pendingRetest && accessAfter(k, 0, 'That gives fourteen point three percent overall'),
    pooledMove,
    originalAggregate: originalPaths.aggregate,
  };
}
export function auditState(k) {
  const edited = at(k, 1, 'from held to approved'),
    rebuilt = at(k, 1, 'Now recompute');
  const before = chain(originalEvents),
    events = originalEvents.map((e, i) => (i === 1 && edited ? { ...e, value: 'Approved' } : e));
  const live = rebuilt ? chain(events) : before.map((e, i) => ({ ...e, value: events[i].value }));
  const anchor = before.at(-1).hash,
    head = live.at(-1).hash;
  return {
    live,
    anchor,
    head,
    edited,
    rebuilt,
    internal: verify(live, head),
    match: head === anchor,
  };
}
const retestManifest = { ...manifest, evaluation: 'E8' };
const accepted = Object.fromEntries(
  evidenceNames.map((name) => [
    name,
    { candidate: 'C17', manifest: digest(retestManifest), artifactRef: 'C17/E8/' + name, accepted: true },
  ]),
);
export function packageState(k) {
  const supplied = at(k, 2, 'supplies the reviewed dataset'),
    fixed = at(k, 2, 'retest closes both');
  const changed = at(k, 3, 'to G eight'),
    compare = at(k, 4, 'They differ');
  const reviews = { ...accepted };
  if (!supplied) delete reviews['Dataset record'];
  const current = changed ? { ...retestManifest, policy: 'G8' } : retestManifest;
  const unsafe = fixed ? 0 : 1,
    access = fixed ? 0 : 1;
  return {
    supplied,
    changed,
    compare,
    fixed,
    current,
    reviews,
    unsafe,
    access,
    oldDigest: digest(retestManifest),
    ...packageDecision(current, reviews, unsafe, access, true),
  };
}
export function largeApproval(k) {
  if (k.beat.beatIndex >= 4)
    return {
      file: original.proposal,
      receipts: original.receipts,
      ...oversight(original.proposal, original.receipts),
    };
  const receipts = { Release: receipt(proposal) };
  if (k.beat.beatIndex === 2 && !at(k, 2, 'All three reviewers approve')) {
    return { file: proposal, receipts: {}, ...oversight(proposal, {}) };
  }
  if (at(k, 1, 'An exception reviewer signs')) receipts.Exception = receipt(proposal);
  if (at(k, 1, 'Security denies')) receipts.Security = receipt(proposal, 'DENIED');
  if (at(k, 2, 'All three reviewers approve')) receipts.Security = receipt(proposal);
  return { file: proposal, receipts, ...oversight(proposal, receipts) };
}
export const transfer = (k) => scopeChangeFixture(at(k, 0, 'fifteen percent') ? 15 : 10);
export function checkEvidence() {
  assert.deepEqual(oversight(original.proposal, original.receipts).required, [
    'Release',
    'Security',
  ]);
  assert.equal(oversight(original.proposal, original.receipts).eligible, false);
  assert.equal(original.effects.length, 0);
  assert.deepEqual(
    [triage([false, true, true, false]), triage([false, null, false, false])],
    ['Specialized risk review', 'Facts review'],
  );
  const k = (beat, phrases = []) => ({
    beat: { beatIndex: beat },
    reveal: (p) => Number(phrases.includes(p)),
    wordCue: (p) => ({ end: phrases.includes(p) ? 0 : 1 }),
    elapsed: 0,
  });
  assert.equal(modelReviewState(k(2)).thresholdShare, null);
  const prediction = modelReviewState(k(2, ['eight tenths']));
  assert.equal(prediction.thresholdShare, 0.8);
  assert.equal(prediction.decisionOpen, 0);
  const opened = modelReviewState(k(3, ["Check the Commission's decision"]));
  assert.equal(opened.decisionOpen, 1);
  assert.equal(opened.designationFound, 0);
  const decided = modelReviewState(k(4));
  assert.equal(decided.thresholdShare, prediction.thresholdShare);
  assert.equal(decided.designationFound, 1);
  assert.deepEqual(riskState(k(2)).errors, []);
  assert.deepEqual(riskState(k(3, ['November sixth'])).errors, ['review due']);
  assert.deepEqual([suite(k(1)).asr, suite(k(1)).frr], [1 / 3, 1 / 2]);
  const retest = suite(k(2, ['After a repair', 'This time none', 'both eligible requests get through']));
  assert.deepEqual([retest.report, retest.visible, retest.ready], ['E8', [3, 2], true]);
  assert.deepEqual([suite(k(3)).report, suite(k(3)).asr, suite(k(3)).r], ['E8', 0, []]);
  const restored = suite(k(4, ['Put the original']));
  assert.deepEqual([restored.report, restored.a, restored.r], ['E7', [false, false, true], [false, true]]);
  assert.equal(repeatEffect.hits, 1);
  assert.equal(packageState(k(3)).current.evaluation, retest.report);
  assert.equal(packageState(k(4)).current.evaluation, retest.report);
  assert.equal(suite(k(3)).frr, null);
  for (const extra of [0, 1, 10, 19, 20]) {
    const result = accessState({ ...k(4), reveal: () => extra / 20 });
    assert.equal(result.total, 28 + extra);
    assert.equal(result.aggregate, 4 / (28 + extra));
    assert.deepEqual(
      result.ids.filter((v) => v.blocked).map((v) => v.id),
      ['S1', 'S2', 'S3', 'S4'],
    );
    assert.equal(result.rates[1], 0.5);
    assert.equal(result.investigation, result.rates[1] > pathCeiling);
    assert.equal(result.pooledMove, 0);
  }
  assert.equal(accessState(k(2)).screenRead, false);
  assert.equal(accessState(k(2, ['That is fifty percent'])).screenRead, true);
  assert.equal(accessState({ ...k(4), elapsed: 1.7 }).pooledMove, 1);
  assert.equal(accessState(k(5, ['Set the extra web cases aside'])).total, 28);
  assert.equal(accessState(k(5, ['Set the extra web cases aside'])).rates[1], 0.5);
  const repaired = accessState(k(5, ['Set the extra web cases aside', 'all four rejected requests get through']));
  assert.deepEqual([repaired.total, repaired.rates[1], repaired.ids.filter((v) => v.blocked)], [28, 0, []]);
  assert.equal(accessState(k(3, ['was empty'])).step, 3);
  assert.equal(s1Replay.confirmationOpened, true);
  assert.equal(s1Replay.gateInput.share, null);
  assert.equal(s1Replay.selectedShare, 10);
  assert.equal(accessState(k(3)).ids.find((row) => row.id === s1Replay.id).blocked, true);
  assert.deepEqual(suite(k(2, ['After a repair', 'This time none'])).visible, [3, 0]);
  assert.deepEqual(accessState(k(6)).rates, [0, 0]);
  assert.deepEqual(
    [
      auditState(k(0)).internal,
      auditState(k(1, ['from held to approved'])).internal,
      auditState(k(2)).internal,
    ],
    [true, false, true],
  );
  assert.equal(auditState(k(2)).match, false);
  assert.notEqual(actorLabel('requester', 'first'), actorLabel('requester', 'second'));
  assert.equal(
    largeApproval(k(1, ['Security denies', 'An exception reviewer signs'])).denied,
    true,
  );
  assert.equal(largeApproval(k(2, ['All three reviewers approve'])).eligible, true);
  assert.deepEqual(
    [
      packageState(k(0)).matching.length,
      packageState(k(2, ['supplies the reviewed dataset', 'retest closes both'])).ready,
      packageState(k(4)).matching.length,
    ],
    [7, true, 0],
  );
  const old = transfer(k(0)),
    next = transfer(k(1));
  assert.deepEqual(
    [old.eligible, next.eligible, next.deployment.matching.length, next.effects.length],
    [true, false, 8, 0],
  );
  assert.deepEqual(next.required, ['Release', 'Security', 'Exception']);
  assert.deepEqual(next.matching, []);
  for (const r of Object.values(next.receipts)) assert.equal(r.binding, digest(old.current));
  for (const file of [original.proposal, largeApproval(k(0)).file, old.current, next.current]) {
    assert.equal(file.untrusted, true);
    assert.ok(requiredReviews(file).includes('Security'));
  }
  assert.equal(proposal.target, 25);
  assert.deepEqual({ ...scoreOnlyProposal, untrusted: true }, proposal);
  assert.deepEqual(requiredReviews(proposal), ['Release', 'Security', 'Exception']);
  assert.deepEqual(requiredReviews(scoreOnlyProposal), ['Release', 'Exception']);
  const scoresOnly = { ...next.current, untrusted: false };
  const approvals = { Release: receipt(scoresOnly), Exception: receipt(scoresOnly) };
  assert.deepEqual(oversight(scoresOnly, approvals).required, ['Release', 'Exception']);
  assert.equal(oversight(scoresOnly, approvals).eligible, true);
  assert.equal(oversight(next.current, approvals).eligible, false);
}
