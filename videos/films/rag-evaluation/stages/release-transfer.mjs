import { completed, spoken } from '../construction.mjs';
import { policyFixture, policyTransferSnapshot, sliceGate } from '../model.mjs';
import { drawPolicyChapterCard, wrapLabel } from '../defaults.mjs';

export function drawReleaseTransfer(ctx, scene, state, api) {
  const { C, text } = api;
  const beat = state.beat ?? 0;
  const turn = spoken(state, 'new-edition', 0);
  const july = turn > 0 || beat > 0;
  const snap = policyTransferSnapshot(state);
  const fixture = july ? snap.fixture : policyFixture();
  const required = fixture.required;
  const answer = july ? snap.answer : fixture.complete;
  const pointNames = [
    'Freeze scope',
    'Commander approval',
    'Linked rollback plan',
    'Maintenance-window ID',
  ];
  const edition = fixture.trace.selectedVersions[0].split('/')[1];
  const suiteVisible = spoken(state, 'suite-question', 2) > 0;
  const suiteResult = completed(state, 'suite-decision', 3);
  const openFailures = completed(state, 'suite-cases', 3);
  const report = sliceGate();
  const pending = snap.repaired && !snap.passed;
  if (suiteVisible) {
    text(ctx, 'DEPLOY-17   /   ' + edition, 145, 280, 36, C.cyan);
    text(ctx, 'Maya’s trace passes. All four requirements are covered.', 145, 362, 44, C.ink);
    api.focus.target('decision', () => {
      text(ctx, 'Workflow', 145, 492, 30, C.muted);
      text(ctx, 'Correct release decision?', 605, 492, 30, C.muted);
      text(ctx, 'Required in each workflow: 95%', 1240, 492, 30, C.muted);
      report.slices.forEach((slice, i) => {
        const y = 576 + i * 99;
        text(ctx, slice.name, 145, y, 43, C.ink);
        slice.cases.forEach((entry, j) => {
          const color = openFailures && !entry.correct ? C.pink : C.ink;
          text(ctx, entry.id + (entry.correct ? '  yes' : '  no'), 605 + j * 245, y, 39, color);
        });
        text(ctx, slice.k + ' / ' + slice.n, 1240, y, 43, C.ink);
        if (openFailures)
          text(
            ctx,
            slice.pass ? 'Pass' : 'Investigate',
            1445,
            y,
            36,
            slice.pass ? C.green : C.pink,
          );
      });
      const failed = report.slices.flatMap((slice) =>
        slice.cases.filter((c) => !c.correct).map((c) => c.id),
      );
      const prompt = openFailures
        ? 'Hold the release. Open cases ' + failed.join(' and ') + '.'
        : suiteResult
          ? 'Hold the release.'
          : 'Can this build ship? Which cases would you open?';
      text(ctx, prompt, 145, 946, 47, suiteResult ? C.yellow : C.ink);
      if (completed(state, 'inspect-failures', 3))
        text(ctx, 'Find the first failed check in each trace.', 145, 1010, 36, C.ink);
    });
    return;
  }

  api.focus.target('edition', () => {
    text(ctx, 'DEPLOY-17   /   ' + edition, 145, 280, 36, C.cyan);
    text(ctx, 'What the policy requires', 145, 354, 33, C.muted);
  });
  text(ctx, 'Maya’s answer', 924, 280, 44, C.ink);
  text(ctx, 'Each line cites this copy of DEPLOY-17.', 924, 354, 30, C.muted);

  required.forEach((point, i) => {
    const y = 394 + i * 103;
    api.focus.target('requirements', () => {
      // The July amendment extends the old form, leaving the three earlier rows in place.
      const inset = i === 3 && beat === 0 ? 55 * (1 - turn) : 0;
      drawPolicyChapterCard(
        ctx,
        api,
        pointNames[i],
        145 + inset,
        y,
        620,
        i === 3 ? C.yellow : C.cyan,
        78,
        33,
      );
    });
    const emitted = answer.find((claim) => claim.id === point);
    api.focus.target('answer-lines', () => {
      if (emitted) {
        const lines = wrapLabel(ctx, emitted.text, 835, 34).label.split('\n');
        lines.forEach((line, j) => text(ctx, line, 924, y + 31 + 39 * j, 34, C.ink));
      } else {
        text(
          ctx,
          snap.completeness ? 'No claim about the window ID.' : 'End of answer',
          924,
          y + 50,
          34,
          C.muted,
        );
      }
    });
  });

  api.focus.target('answer-scores', () => {
    const n = answer.length;
    const { result } = snap;
    const scores = [
      ['Faithful', snap.revealed, Math.round(result.faithfulness * n), n],
      ['Cited', snap.citations, Math.round(result.citationSupport * n), n],
      ['Complete', snap.completeness, result.points.length, required.length],
    ];
    scores.forEach(([name, revealed, numerator, denominator], i) => {
      text(
        ctx,
        name + ' ' + (revealed && !pending ? numerator + '/' + denominator : '?'),
        145 + 550 * i,
        882,
        40,
        C.ink,
      );
    });
  });
  api.focus.target('decision', () => {
    const line = pending
      ? 'Added claim and citation retained · recomputed verdict pending'
      : snap.passed
        ? 'This trace passes all answer checks.'
        : snap.completeness
          ? 'First failure: ' + snap.result.firstFailure
          : july
            ? 'Which answer check stops this July replay?'
            : 'The June rule and the answer agree.';
    text(ctx, line, 145, 981, 36, snap.completeness ? C.yellow : C.ink);
  });
}

export default {
  id: 'release-transfer',
  draw: drawReleaseTransfer,
  cues: [
    'new-edition',
    'revision-question',
    'release-answer',
    'rageval-fresh-citations',
    'rageval-fresh-completeness',
    'release-repair',
    'rageval-fresh-pass',
    'suite-question',
    'suite-decision',
    'suite-cases',
    'inspect-failures',
  ],
};
