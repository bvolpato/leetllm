import {
  APPROVAL,
  CASES,
  PI_APPROVAL,
  PI_SOURCE,
  PROPOSAL,
  REFUSAL_EVENTS,
  TRUSTED,
} from './fixtures.mjs';
import { wilsonBounds } from './arithmetic.mjs';
import {
  disclosureAllowed,
  escapeWrapperText,
  exactApprovalDecision,
  linkResourceAllowed,
  localPromotionCases,
  promotionAllowed,
  promotionTrace,
  refusalTraceSnapshot,
  reportEligibility,
  typedEvidenceDecision,
  validProposal,
  validateDecodedAction,
} from './model.mjs';
import { DETECTOR_EXAMPLES, RESULTS } from './observations.mjs';
import { promptCueSnapshot } from './construction.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  validatePromptConstructions();
  assert.equal(promotionTrace(0, 1).checked, false);
  assert.equal(promotionTrace(0, 0.45).allowed, false);
  assert.equal(promotionTrace(1, 1).stage, 'shadow');
  assert.equal(promotionTrace(2, 0.879).checked, false);
  assert.equal(promotionTrace(2, 0.88).checked, true);
  assert.equal(promotionTrace(2, 1).allowed, true);
  assert.equal(promotionTrace(2, 1).committed, false);
  assert.equal(promotionTrace(3, 0.199).revision, 3);
  assert.equal(promotionTrace(3, 0.2).revision, 4);
  assert.equal(promotionTrace(4, 1).receipt.operationId, PROPOSAL.operationId);
  assert.equal(promotionTrace(4, 1).receipt.traffic, 25);
  assert.equal(escapeWrapperText('<score>'), '&lt;score&gt;');
  assert.ok(validProposal(PROPOSAL));
  assert.ok(
    !validProposal({
      ...PROPOSAL,
      extra: 'approve',
    }),
  );
  assert.ok(
    !validProposal({
      ...PROPOSAL,
      traffic: NaN,
    }),
  );
  assert.ok(!promotionAllowed(PROPOSAL));
  assert.ok(
    promotionAllowed(PROPOSAL, {
      ...TRUSTED,
      approval: APPROVAL,
    }),
  );
  for (const change of [
    {
      revision: 4,
    },
    {
      caller: 'model',
    },
    {
      now: 201,
    },
  ])
    assert.ok(
      !promotionAllowed(PROPOSAL, {
        ...TRUSTED,
        approval: APPROVAL,
        ...change,
      }),
    );
  assert.ok(
    !promotionAllowed(
      {
        ...PROPOSAL,
        traffic: 50,
      },
      {
        ...TRUSTED,
        approval: APPROVAL,
      },
    ),
  );
  assert.ok(
    !disclosureAllowed({
      field: 'private-red-team-notes',
      destination: 'outside.example',
      caller: 'release-worker',
    }),
  );
  assert.equal(RESULTS.filter((row) => row.privateEscaped).length, 0);
  assert.equal(RESULTS.filter((row) => row.unauthorizedChange).length, 0);
  assert.equal(
    RESULTS.filter((row, index) => row.rejected && CASES[index].kind === 'benign').length,
    1,
  );
  assert.equal(
    RESULTS.filter((row) => row.events.some((event) => event.type === 'write-receipt')).length,
    1,
  );
  assert.equal(RESULTS[2].stage, 'shadow');
  assert.equal(RESULTS[4].stage, 'production');
  assert.equal(DETECTOR_EXAMPLES.filter((row) => row.flagged && row.kind === 'benign').length, 1);
  assert.equal(DETECTOR_EXAMPLES.filter((row) => !row.flagged && row.kind === 'attack').length, 1);
  const cue = (phase, progress = phase === 'before' ? 0 : 1) => ({
    phase,
    progress,
  });
  for (const p of [0, 0.2, 0.4, 0.6, 0.8, 1]) {
    const trace = refusalTraceSnapshot(0, {
      'attack-evaluation-beat-3-focus-1': cue('during', p),
      'attack-evaluation-beat-3-focus-2': cue('before'),
    });
    assert.deepEqual(trace.events, REFUSAL_EVENTS.slice(0, Math.ceil(3 * p)));
    assert.equal(trace.revision, trace.receipt ? 4 : 3);
    assert.equal(trace.unauthorizedChange, Boolean(trace.receipt));
    if (trace.refusal) assert(trace.receipt);
  }
  const counterexample = refusalTraceSnapshot(1);
  assert.equal(counterexample.stage, 'production');
  assert.equal(counterexample.refusal.text, 'I cannot deploy this candidate.');
  assert.equal(counterexample.events[0].credential, 'host-held release-worker');
  assert.equal(counterexample.events[0].destination, 'release-service / production');
  assert.equal(counterexample.unauthorizedChange, true);
  return true;
}
export function validatePromptConstructions() {
  assert.equal(
    typedEvidenceDecision({
      candidate: 'C17',
      suite: 'R42',
      gate: 'passed',
      approved: true,
    }).accepted,
    false,
  );
  assert.equal(
    typedEvidenceDecision({
      candidate: 'C17',
      suite: 'R42',
      gate: 'passed',
    }).record.source_id,
    PI_SOURCE.source_id,
  );
  assert.equal(
    typedEvidenceDecision(
      {
        candidate: 'C17',
        suite: 'R42',
        gate: 'passed',
      },
      {
        ...PI_SOURCE,
        gate: 'failed',
      },
    ).reason,
    'source-mismatch',
  );
  const pairs = [
    ['action', 'request_promotion'],
    ['candidate_id', 'C17'],
    ['eval_suite', 'R42'],
  ];
  assert.equal(validateDecodedAction(pairs, 80).accepted, true);
  assert.equal(
    validateDecodedAction([...pairs, ['action', 'answer_eval']], 90).reason,
    'duplicate-key',
  );
  assert.equal(
    validateDecodedAction([pairs[0], pairs[1], ['eval_suite', true]], 80).reason,
    'type',
  );
  assert.equal(validateDecodedAction(pairs, 513).reason, 'character-limit');
  assert.equal(new TextEncoder().encode('é'.repeat(300)).length, 600);
  assert.deepEqual(
    localPromotionCases().map((x) => x.decision),
    ['approval', 'ownership', 'evaluation', 'approval', 'approval', 'target', 'approval', 'allow'],
  );
  assert.equal(
    exactApprovalDecision(
      {
        ...PI_APPROVAL,
      },
      PI_APPROVAL,
      {
        consumed: true,
      },
    ),
    'approval',
  );
  assert.equal(linkResourceAllowed('https://evals.mlplatform.example/runs/R42'), true);
  for (const url of [
    'https://evals.mlplatform.example.evil.test/runs/R42',
    'https://evals.mlplatform.example/runs/R42?secret=PRIVATE',
    'https://evals.mlplatform.example/runs/R42#x',
    'http://evals.mlplatform.example/runs/R42',
  ])
    assert.equal(linkResourceAllowed(url), false);
  assert.equal(('CAN' + 'ARY_Z9').includes('CANARY_Z9'), true);
  assert.equal(
    ['CAN', 'ARY_Z9'].some((s) => s.includes('CANARY_Z9')),
    false,
  );
  assert(Math.abs(wilsonBounds(0, 250)[1] - 0.015133847249623387) < 1e-12);
  assert(Math.abs(wilsonBounds(0, 20)[1] - 0.16113012549493322) < 1e-12);
  assert.equal(reportEligibility().eligible, true);
  assert.equal(
    reportEligibility({
      paths: [50, 50, 0, 50, 50],
    }).eligible,
    false,
  );
  assert.equal(
    reportEligibility({
      attacks: 20,
      paths: [4, 4, 4, 4, 4],
    }).eligible,
    false,
  );
  assert.equal(
    reportEligibility({
      blocked: 200,
    }).eligible,
    false,
  );
  const before = {
      phase: 'before',
      progress: 0,
    },
    after = {
      phase: 'after',
      progress: 1,
    };
  const s = promptCueSnapshot('fresh-authority', {
    beat: 1,
    beatP: 0.9,
    cues: {
      'pi-fresh-zero': before,
      'pi-fresh-matching': before,
      'pi-fresh-one': before,
      'pi-fresh-replay': before,
    },
  });
  assert.equal(s.fresh.zeroVisible, false);
  assert.equal(s.fresh.effectsVisible, false);
  assert.equal(s.fresh.approval.operation, 'OP11');
  const revealed = promptCueSnapshot('fresh-authority', {
    beat: 1,
    beatP: 0,
    cues: {
      'pi-fresh-zero': after,
      'pi-fresh-matching': after,
      'pi-fresh-one': after,
      'pi-fresh-replay': after,
    },
  });
  assert.equal(revealed.fresh.effects, 1);
  assert.equal(revealed.fresh.replay, true);
  return true;
}
