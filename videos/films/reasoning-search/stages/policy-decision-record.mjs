import { reasoningRecordScore } from '../arithmetic.mjs';
import { cueAt } from '../cue-clock.mjs';
import { cleanRelease, releaseSheet } from '../release-sheet.mjs';

const mistaken = {
  checks: { ...cleanRelease, security_scan_clear: false },
  final_action: 'merge_release',
};
const repaired = { checks: cleanRelease, final_action: 'merge_release' };
const short = { checks: { tests_passed: true }, final_action: 'manual_review' };

export function drawPolicyDecisionRecord(ctx, scene, state, api) {
  if (state.t < 0.35) ctx.globalAlpha = 1;
  api.focus.target('policy-decision-record-mechanism', () => {
    const { C } = api;
    const partial = cueAt(state, 'record-partial', 2, 0, 0.08).done;
    const corrected = cueAt(state, 'record-flip', 1, 0.7, 0.82).done;
    const record = partial ? short : corrected ? repaired : mistaken;
    const located = cueAt(state, 'record-locate', 1, 0, 0.08).done;
    releaseSheet(ctx, api, {
      facts: cleanRelease,
      record,
      scanMarked: located && !partial,
      comparison: true,
      arrival: api.phase((state.t ?? 0) + 0.25, 0, 1.45),
    });
    const score = reasoningRecordScore(record, cleanRelease);
    const graded =
      (located && !partial) || cueAt(state, 'record-grade-partial', 2, 0.27, 0.46).done;
    if (graded) {
      const result = [
        [290, 'Fields supplied', Math.round(score.coverage * 3) + ' / 3', score.coverage === 1],
        [920, 'Check values', score.valuesMatch ? 'Match' : 'Mismatch', score.valuesMatch],
        [1480, 'Action', score.actionMatches ? 'Match' : 'Mismatch', score.actionMatches],
      ];
      for (const [x, name, value, ok] of result) {
        api.text(ctx, name, x, 899, 30, C.muted, 'center');
        api.text(ctx, value, x, 964, 48, ok ? C.green : C.pink, 'center');
      }
    } else if (!partial) {
      api.text(ctx, 'Which check did the model copy wrong?', 960, 945, 51, C.yellow, 'center');
    }
  });
}
export default {
  id: 'policy-decision-record',
  draw: drawPolicyDecisionRecord,
  cues: [
    'record-compare',
    'record-locate',
    'record-flip',
    'record-matches',
    'record-partial',
    'record-grade-partial',
  ],
};
