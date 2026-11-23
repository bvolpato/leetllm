import test from 'node:test';
import assert from 'node:assert/strict';
import { createCanvas } from '@napi-rs/canvas';
import { registerLessonFonts } from '../lib/fonts.mjs';
import * as m from '../animations/rag-evaluation.mjs';

const cue = (p) => ({ phase: p === 0 ? 'before' : p === 1 ? 'after' : 'during', progress: p });
const near = (a, b) => assert(Math.abs(a - b) < 1e-12, `${a} != ${b}`);

test('the replay gate binds full trusted records and all stage receipts', () => {
  const f = m.policyFixture();
  assert(m.admissiblePolicy(f.trace, f));
  for (const mutation of [
    (f) => {
      f.records[m.POLICY_ID].text = 'Different policy under the same version';
    },
    (f) => {
      f.records[m.POLICY_ID].parent = 'Different parent';
    },
    (f) => {
      f.records[m.POLICY_ID].permitted = false;
    },
    (f) => {
      f.records[m.POLICY_ID].current = false;
    },
    (f) => {
      f.trace.candidates.push(m.POLICY_ID);
    },
    (f) => {
      f.trace.reranked.pop();
    },
    (f) => {
      f.trace.selectedVersions[0] = 'Different revision';
    },
    (f) => {
      delete f.trace.versions.fusion;
    },
    (f) => {
      f.trace.question = 'Another question';
    },
  ]) {
    const changed = m.policyFixture();
    mutation(changed);
    assert.equal(m.admissiblePolicy(changed.trace, changed), false);
  }
});

test('a supplied claim ID cannot grant support or create a missing required point', () => {
  const f = m.policyFixture();
  for (const text of [
    'Approval from the incident commander is mandatory.',
    'Incident commander approval is not required.',
  ]) {
    const result = m.policyEvaluation(
      f.trace,
      [{ id: 'approval', text, citation: m.POLICY_ID }],
      f,
    );
    assert.equal(result.firstFailure, 'claim review');
    assert.equal(result.faithfulness, null);
    assert.equal(result.completeness, null);
  }
  const duplicated = [...f.complete.slice(0, 2), { ...f.complete[1], id: 'rollback-plan' }],
    result = m.policyEvaluation(f.trace, duplicated, f);
  assert.equal(result.faithfulness, 1);
  near(result.completeness, 2 / 3);
  assert.deepEqual(result.points, ['freeze-scope', 'approval']);
});

test('the seven controlled mutations fail at distinct observed boundaries', () => {
  assert.deepEqual(
    m.policyVariants().map((v) => v.result.firstFailure),
    [
      'pass',
      'answer faithfulness',
      'citation support',
      'claim presence',
      'context selection',
      'answer completeness',
      'candidate retrieval',
    ],
  );
  const f = m.policyFixture(),
    wrong = f.complete.map((v) => ({ ...v, citation: 'payment-service-rollback-runbook' })),
    result = m.policyEvaluation(f.trace, wrong, f);
  assert.equal(result.faithfulness, 1);
  assert.equal(result.citationCoverage, 1);
  assert.equal(result.citationSupport, 0);
  assert.equal(result.stages.at(-1).status, 'unscored');
});

test('bounded abstention retains corpus, selected-evidence and task outcomes separately', () => {
  assert.deepEqual(m.abstentionOutcome(true, true, 'complete-supported'), {
    safe: true,
    evidencePath: true,
    taskSuccess: true,
  });
  assert.deepEqual(m.abstentionOutcome(false, false, 'bounded-abstention'), {
    safe: true,
    evidencePath: true,
    taskSuccess: true,
  });
  assert.deepEqual(m.abstentionOutcome(true, false, 'bounded-abstention'), {
    safe: true,
    evidencePath: false,
    taskSuccess: false,
  });
  assert.deepEqual(m.abstentionOutcome(true, true, 'bounded-abstention'), {
    safe: true,
    evidencePath: true,
    taskSuccess: false,
  });
  assert.equal(m.abstentionOutcome(false, false, 'unsupported').safe, false);
  assert.throws(() => m.abstentionOutcome(false, true, 'complete-supported'));
});

test('the slice gate refuses absent workflows and preserves the exact 95% count boundary', () => {
  assert.deepEqual(
    m.sliceGate().slices.map((v) => [v.k, v.n, v.pass]),
    [
      [1, 2, false],
      [2, 2, true],
      [0, 1, false],
    ],
  );
  const rows = Array.from({ length: 100 }, (_, i) => ({
    id: 'F' + i,
    slice: 'freeze',
    correct: i < 95,
  }));
  rows.push(
    { id: 'H', slice: 'hotfix', correct: true },
    { id: 'M', slice: 'migration', correct: true },
  );
  assert(m.sliceGate(rows).pass);
  rows[94].correct = false;
  assert.equal(m.sliceGate(rows).pass, false);
  assert.equal(m.sliceGate(rows.filter((v) => v.slice !== 'migration')).pass, false);
});

test('persistent rank cards travel around each other without merging identities', () => {
  for (const [kind, width, height] of [
    ['vertical', 490, 95],
    ['horizontal', 470, 110],
  ])
    for (let step = 0; step <= 100; step++) {
      const positions = m.reorderPositions(step / 100, kind);
      assert.equal(positions.length, 3);
      for (let a = 0; a < 3; a++)
        for (let b = a + 1; b < 3; b++)
          assert(
            !(
              Math.abs(positions[a].x - positions[b].x) < width &&
              Math.abs(positions[a].y - positions[b].y) < height
            ),
            `${kind} overlap at ${step}%`,
          );
    }
  m.reorderPositions(1).forEach((v, i) => {
    near(v.x, 710);
    near(v.y, [570, 710, 430][i]);
  });
});

test('the changed policy result and its repair wait for their separate spoken cues', () => {
  const before = m.policyTransferSnapshot({
    beat: 1,
    cues: { 'release-answer': cue(0), 'release-repair': cue(0) },
  });
  assert.equal(before.revealed, false);
  assert.equal(before.answer.length, 3);
  near(before.result.completeness, 0.75);
  const revealed = m.policyTransferSnapshot({
    beat: 1,
    cues: { 'release-answer': cue(1), 'release-repair': cue(0) },
  });
  assert.equal(revealed.revealed, true);
  assert.equal(revealed.result.firstFailure, 'answer completeness');
  const repaired = m.policyTransferSnapshot({
    beat: 1,
    cues: { 'release-answer': cue(1), 'release-repair': cue(1) },
  });
  assert.equal(repaired.answer.length, 4);
  assert.equal(repaired.result.release, true);
  registerLessonFonts();
  const ctx = createCanvas(1920, 1080).getContext('2d'),
    paint = (progress) => {
      const values = [],
        api = {
          C: {
            ink: '#fff',
            muted: '#999',
            blue: '#79aaff',
            green: '#8cdeb5',
            yellow: '#f4d477',
            pink: '#ef9ac8',
            cyan: '#63deec',
            panel: '#111',
          },
          phase: (p) => p,
          text: (_ctx, text) => values.push(String(text)),
          math: (_ctx, text) => values.push(String(text)),
          components: {
            card: (opts) => {
              values.push(opts.label);
              return opts;
            },
          },
          focus: { target: (_id, fn) => fn() },
        };
      m.draw(
        ctx,
        { id: 'release-transfer' },
        {
          beat: 1,
          cues: {
            'release-answer': cue(progress),
            'rageval-fresh-citations': cue(progress),
            'rageval-fresh-completeness': cue(progress),
            'release-repair': cue(0),
            'rageval-fresh-pass': cue(0),
          },
        },
        api,
      );
      return values;
    };
  assert(
    !paint(0).some(
      (v) =>
        v.includes('Complete 3/4') ||
        v.includes('First failure:') ||
        v.includes('absent from answer'),
    ),
  );
  assert(paint(1).some((v) => v.includes('Complete 3/4')));
});
