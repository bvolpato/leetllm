import { expectedPolicyAnswer, fixtureReport, releaseGate } from '../arithmetic.mjs';
import { drawGradeSheet, grades } from '../grade-sheet.mjs';
import { sceneCues } from '../picture.mjs';

export function drawEvaluation(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  const report = fixtureReport();
  const count =
    2 * Number(cue.after('grade-first-two')) +
    Number(cue.after('grade-action')) +
    Number(cue.after('grade-age')) +
    Number(cue.after('grade-policy'));
  api.focus.target('evaluation-mechanism', () => {
    if (cue.started('grade-detail') && !cue.started('grade-return')) {
      const row = grades[2];
      const claimed = cue.after('grade-action');
      const graded = cue.after('grade-record');
      const reference = expectedPolicyAnswer(row);
      api.text(ctx, row.age + '-day key', 145, 310, 65, C.ink);
      api.text(ctx, 'Marked stale   ·   30-day minimum', 640, 310, 39, C.muted);
      api.text(ctx, 'Assistant’s answer', 851, 466, 47, C.cyan, 'center');
      api.text(ctx, 'Policy and job record', 1470, 466, 47, C.cyan, 'center');
      api.line(ctx, 145, 498, 1775, 498, C.muted, 3);
      for (const [y, label, actual, expected] of [
        [597, 'Verdict', row.decision, reference.decision],
        [697, 'Policy', row.policy, reference.policy],
        [797, 'Job started?', row.action ? 'Yes' : 'No', reference.action ? 'Yes' : 'No'],
      ]) {
        api.text(ctx, label, 145, y, 42, C.muted);
        api.text(
          ctx,
          actual,
          851,
          y,
          52,
          claimed && actual !== expected ? C.pink : C.ink,
          'center',
        );
        api.text(ctx, expected, 1470, y, 52, C.ink, 'center');
      }
      if (graded)
        api.text(
          ctx,
          row.pass ? 'Pass' : 'Reject',
          960,
          953,
          56,
          row.pass ? C.green : C.pink,
          'center',
        );
      else if (state.beat === 1 && cue.started('grade-question'))
        api.text(ctx, 'Would you pass it?', 960, 953, 56, C.yellow, 'center');
      return;
    }
    api.text(
      ctx,
      'All five keys are stale   ·   P-7 v1   ·   Minimum 30 days   ·   No rotation ran',
      125,
      251,
      36,
      C.ink,
    );
    drawGradeSheet(ctx, api, { visible: count });
    if (cue.after('grade-total'))
      api.text(
        ctx,
        report.policyCasesPassed + ' / ' + report.policyCasesTotal + ' answers passed',
        125,
        946,
        48,
        C.ink,
      );
    if (cue.after('grade-block'))
      api.text(
        ctx,
        '1 false action claim   ·   p95 pending   ·   ' + releaseGate(report).verdict,
        1800,
        945,
        35,
        C.pink,
        'right',
      );
  });
}
export default {
  id: 'evaluation',
  draw: drawEvaluation,
  cues: [
    'grade-first-two',
    'grade-detail',
    'grade-question',
    'grade-action',
    'grade-record',
    'grade-return',
    'grade-age',
    'grade-policy',
    'grade-total',
    'grade-block',
  ],
};
