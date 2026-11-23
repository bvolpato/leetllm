import assert from 'node:assert/strict';
import { toolsFor } from './art.mjs';
import {
  opening,
  principle,
  proof,
  supervised,
  ballots,
  shares,
  margin,
  drift,
  context,
  accessState,
  marginStep,
  study,
  target,
} from './training.mjs';
import {
  worksheet,
  lineage,
  permissions,
  counting,
  calibration,
  budget,
  batches,
  family,
  placement,
  probeCount,
  comparison,
} from './evaluation.mjs';
import {
  conversation,
  boundary,
  release,
  exchange,
  lastReplyVerdict,
  bufferState,
  delivered,
  replayTrace,
} from './release.mjs';
import {
  AUDIT_CASES,
  PROBES,
  JUDGE_CASES,
  GCG_CANDIDATES,
  orderAudit,
} from '../../../films/constitutional-ai/fixtures.mjs';
import { revisionDistribution } from '../../../films/constitutional-ai/construction.mjs';
import {
  auditCounts,
  budgetProbability,
  exactCandidate,
  judgeAudit,
  orderedVerdict,
  parseAttackBatch,
  policyObjective,
  releaseAudit,
} from '../../../films/constitutional-ai/arithmetic.mjs';

const scenes = [
  opening,
  principle,
  proof,
  supervised,
  ballots,
  shares,
  margin,
  drift,
  context,
  worksheet,
  lineage,
  permissions,
  counting,
  calibration,
  budget,
  conversation,
  boundary,
  release,
];
function draw(ctx, clock) {
  scenes[clock.beat.chapterIndex](toolsFor(ctx), clock);
}

function check() {
  assert.equal(accessState(false).fetched, false);
  assert.equal(accessState(true).fetched, true);
  assert.equal(accessState(true, false).fetched, false);
  const close = (a, b) => assert(Math.abs(a - b) < 1e-9);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const s = revisionDistribution(2, t);
    assert.deepEqual(s.prefix, ['Please', 'request']);
    assert.equal(s.words.join(' '), target);
    assert.equal(s.choices[0], 'access');
    close(
      s.probabilities.reduce((a, b) => a + b),
      1,
    );
    close(s.loss, -Math.log(s.probabilities[0]));
  }
  assert.equal(revisionDistribution(2, 0).probabilities[0].toFixed(3), '0.212');
  assert.equal(revisionDistribution(2, 1).loss.toFixed(3), '0.604');
  assert.deepEqual(
    [0, 1].map((i) => orderedVerdict(i).responseId),
    ['A', 'A'],
  );
  assert.deepEqual(
    [0, 1].map((i) => orderedVerdict(i, 'position').responseId),
    ['A', 'B'],
  );
  close(orderAudit.meanA, (orderAudit.forwardA + 1 - orderAudit.swappedB) / 2);
  close(marginStep.gradient, -0.3);
  close(marginStep.margin, 0.15);
  close(marginStep.probability, 1 / (1 + Math.exp(-0.15)));
  for (const weight of [0.2, 1]) {
    const p = policyObjective(weight);
    close(p.reward, 0.12);
    close(p.kl, 0.8 * Math.log(1.6) + 0.2 * Math.log(0.4));
    assert.equal(p.objective > p.referenceObjective, weight === 0.2);
  }
  assert.deepEqual(
    study.map(([, raw, adjusted]) => adjusted - raw),
    [-12, -12, -3],
  );
  assert.equal(GCG_CANDIDATES.reduce((a, b) => (a.gradient < b.gradient ? a : b)).id, 'B');
  assert.equal(exactCandidate().id, 'C');
  assert.deepEqual(
    batches.map((b) => parseAttackBatch(b).targetAttempts),
    [2, 0],
  );
  const sides = (root, t) =>
    new Set(family.filter((p) => p.root === root).map((p) => placement(p, t).side));
  assert.deepEqual([...sides('A', 0)], ['Train', 'Test']);
  assert.deepEqual([...sides('A', 1)], ['Train']);
  assert.deepEqual([...sides('B', 1)], ['Test']);
  assert.equal(placement(family[1], 0.5).side, null);
  assert.equal(new Set(family.map((r) => r.id)).size, 4);
  assert.deepEqual(probeCount(PROBES), { permitted: 3, denied: 2, refused: 2, leaked: 1 });
  for (const [mode, expected] of [
    ['Original', [2, 3, 1]],
    ['Stricter classifier', [1, 2, 2]],
    ['Better model', [1, 4, 0]],
  ]) {
    const n = auditCounts(comparison(mode));
    assert.deepEqual([n.violations, n.helpful, n.refusals], expected);
    assert.deepEqual([n.knownAttack, n.knownBenign], [6, 5]);
  }
  const n = auditCounts(AUDIT_CASES);
  assert.deepEqual(n.attackBounds, [2 / 7, 3 / 7]);
  assert.deepEqual(n.helpfulBounds, [3 / 6, 4 / 6]);
  assert.equal(auditCounts([AUDIT_CASES[11]]).asr, null);
  const j = judgeAudit(JUDGE_CASES);
  assert.deepEqual(
    j.decisions.map((v) => v.decision),
    ['flag', 'flag', 'flag', 'clear', 'clear', 'review'],
  );
  assert.deepEqual([j.tp, j.fp, j.fn, j.tn, j.review], [2, 1, 1, 1, 1]);
  close(j.brier, 0.3254166666666667);
  close(budgetProbability(2), 0.19);
  close(budgetProbability(10), 0.6513215599);
  close(budgetProbability(10, false), 0.1);
  assert.deepEqual(exchange(false).slice(0, 4), exchange(true).slice(0, 4));
  assert.equal(exchange(true).length, 6);
  assert.equal(lastReplyVerdict(exchange(false)), 'Disclosure');
  assert.equal(lastReplyVerdict(exchange(true)), 'Clear');
  assert.equal(lastReplyVerdict(exchange(false).slice(0, -1)), 'Awaiting reply');
  assert.equal(bufferState(1).held, false);
  assert.deepEqual(bufferState(2), { joined: 'CASE-17', held: true, bytesSent: 0 });
  const a = releaseAudit();
  assert.deepEqual([a.refusals, a.helpful, a.knownBenign], [2, 5, 8]);
  assert.deepEqual([a.violations, a.knownAttack, a.attack.length], [1, 5, 7]);
  assert.deepEqual(a.attackBounds, [1 / 7, 3 / 7]);
  const before = replayTrace(false),
    after = replayTrace(true);
  assert.equal(before.reply, delivered);
  assert.equal(after.reply, before.reply);
  assert.equal(after.destination, before.destination);
  assert.deepEqual(
    [before.reads, after.reads],
    [['Freeze runbook', 'INC-8821'], ['Freeze runbook']],
  );
  assert.deepEqual(
    [before.privateReads, before.verdict, after.privateReads, after.verdict],
    [1, 'Fail', 0, 'Pass'],
  );
  return true;
}
export default { title: 'Constitutional AI and Honest Red-Team Evaluation', draw, check };
