import { hash } from './arithmetic.mjs';
import { baseRow, candidates, cleanedRows, draftRows, provenance, rawText } from './fixtures.mjs';
import { sampleModel } from './construction.mjs';
import {
  auditRelease,
  binaryMeasures,
  cohenKappa,
  fleissFixture,
  hybridSelect,
  hybridSteps,
  judgePair,
  overlapFindings,
  preferenceFixture,
  redact,
  releaseSummaryGate,
  reviewJudgeOrder,
} from './model.mjs';
import assert from 'node:assert/strict';
export function validateModel() {
  assert(!redact(rawText).includes('alex@example.org'));
  assert.equal(judgePair(candidates.A, candidates.B), 'CHOOSE A');
  assert.equal(judgePair(candidates.C, candidates.D), 'BOTH BAD');
  assert.equal(
    judgePair(candidates.A, {
      ...candidates.A,
      id: 'E',
    }),
    'TIE',
  );
  assert.equal(
    judgePair(candidates.A, {
      ...candidates.B,
      evidence: false,
    }),
    'ADJUDICATE',
  );
  const stats = cohenKappa();
  assert.equal(stats.disagreements, 13);
  assert.equal(stats.total, 120);
  assert(Math.abs(stats.kappa - 0.834815756) < 1e-8);
  assert.equal(
    cohenKappa([
      [120, 0],
      [0, 0],
    ]).kappa,
    null,
  );
  assert.deepEqual(
    hybridSelect().map((item) => item.id),
    ['canary-1', 'handoff', 'injection', 'keyboard'],
  );
  assert.deepEqual(
    hybridSelect(4, 1).map((item) => item.id),
    ['canary-1', 'canary-2', 'canary-3', 'injection'],
  );
  for (const { selected, ranked, chosen } of hybridSteps()) {
    assert.equal(new Set(selected.map((item) => item.id)).size, selected.length);
    assert.equal(chosen.score, Math.max(...ranked.map((row) => row.score)));
  }
  const judge = reviewJudgeOrder();
  assert.equal(judge.agreement, 1);
  assert.equal(judge.flips.length, 2);
  assert(overlapFindings(draftRows).some((item) => item.includes('attack-014-copy: lineage')));
  assert.equal(cleanedRows.length, 2);
  assert.equal(overlapFindings(cleanedRows).length, 0);
  assert.equal(auditRelease(draftRows).open, false);
  assert.equal(auditRelease(cleanedRows, false).open, false);
  assert.equal(auditRelease(cleanedRows).open, true);
  assert.notEqual(hash(draftRows), hash(cleanedRows));
  assert.equal(auditRelease(cleanedRows, true, hash(draftRows)).open, false);
  assert.equal(
    auditRelease([
      {
        ...cleanedRows[0],
        provenance: {
          ...provenance,
          policy: 'wrong-version',
        },
      },
    ]).open,
    false,
  );
  assert.equal(
    auditRelease([
      {
        ...cleanedRows[0],
        chosenSafe: false,
      },
    ]).open,
    false,
  );
  assert.equal(
    auditRelease([
      {
        ...cleanedRows[0],
        choice: 'TIE',
      },
    ]).open,
    false,
  );
  assert.equal(
    auditRelease([
      {
        ...cleanedRows[0],
        text: rawText,
      },
    ]).open,
    false,
  );
  for (const id of [
    'redact-and-provenance',
    'write-rubric',
    'uncertainty-selection',
    'diversity-selection',
    'dataset-release',
    'evaluation-boundary',
    'reviewer-agreement',
  ])
    for (let beat = 0; beat < 2; beat++)
      assert.deepEqual(
        sampleModel(id, {
          beat,
          beatP: 1,
        }),
        sampleModel(id, {
          beat: beat + 1,
          beatP: 0,
        }),
      );
  for (const p of [0, 1e-9, 0.249999, 0.25, 0.599999, 0.6, 0.999999]) {
    const s = sampleModel('uncertainty-selection', {
      beat: 0,
      beatP: p,
    });
    assert.deepEqual(
      s.pool.map((item) => item.probability),
      [0.49, 0.53, 0.7, 0.97],
    );
    assert(s.queue.every((item) => item.uncertainty >= 0.94));
  }
  assert.equal(
    sampleModel('redact-and-provenance', {
      beat: 0,
      beatP: 0.449999,
    }).redacted,
    false,
  );
  assert.equal(
    sampleModel('redact-and-provenance', {
      beat: 0,
      beatP: 0.45,
    }).redacted,
    true,
  );
  assert.deepEqual(
    sampleModel('write-rubric', {
      beat: 2,
      beatP: 0,
    }).pair.map((item) => item.id),
    ['C', 'D'],
  );
  for (const [beat, before, at, expected] of [
    [0, 0.149999, 0.15, 1],
    [1, 0.099999, 0.1, 2],
    [1, 0.399999, 0.4, 3],
    [1, 0.699999, 0.7, 4],
  ]) {
    assert.equal(
      sampleModel('diversity-selection', {
        beat,
        beatP: before,
      }).count,
      expected - 1,
    );
    assert.equal(
      sampleModel('diversity-selection', {
        beat,
        beatP: at,
      }).selected.length,
      expected,
    );
  }
  assert(
    overlapFindings([baseRow('renamed', ' SKIP approval   AND Deploy. ')]).some((item) =>
      item.endsWith(': content'),
    ),
  );
  assert.equal(
    sampleModel('dataset-release', {
      beat: 2,
      beatP: 0.094999,
    }).rows.length,
    4,
  );
  assert.equal(
    sampleModel('dataset-release', {
      beat: 2,
      beatP: 0.095,
    }).rows.length,
    2,
  );
  assert.equal(
    sampleModel('dataset-release', {
      beat: 2,
      beatP: 0.549999,
    }).open,
    false,
  );
  assert.equal(
    sampleModel('dataset-release', {
      beat: 2,
      beatP: 0.55,
    }).open,
    true,
  );
  const preference = preferenceFixture();
  assert(Math.abs(preference.loss - 0.4054651081081644) < 1e-12);
  assert(Math.abs(fleissFixture().kappa - 23 / 47) < 1e-12);
  assert.equal(binaryMeasures(0.5).entropy, 1);
  const valid = {
    redaction: true,
    completed: true,
    findings: [],
    kappa: 0.835,
    threshold: 0.65,
    unsafe: 0,
    unresolved: 0,
  };
  assert(releaseSummaryGate(valid));
  for (const kappa of [true, NaN, Infinity, undefined])
    assert.equal(
      releaseSummaryGate({
        ...valid,
        kappa,
      }),
      false,
    );
  assert.equal(
    releaseSummaryGate({
      ...valid,
      unresolved: false,
    }),
    false,
  );
  return true;
}
