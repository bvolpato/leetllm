import { spokenProgress, spokenResult } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { POLICY_CASES, POLICY_STUDENT, POLICY_TEACHER } from '../fixtures.mjs';
import { drawPolicyPredictions } from '../policy-predictions.mjs';

export function drawIntro(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const matched = spokenResult(state, api, 'intro-match', 2, 0.12);
  const open = spokenProgress(state, api, 'intro-rule', 2, 0.32, 0.54);
  const verdict = spokenResult(state, api, 'intro-verdict', 2, 0.74);
  const dock = api.clamp(state.t / 1.6);

  ctx.save();
  if (state.t < 0.35) ctx.globalAlpha = 1;
  drawPolicyPredictions(ctx, api, 116 * (1 - dock) ** 2);
  if (beat >= 1) {
    api.focus.target('score-change', () => {
      const difference = POLICY_STUDENT[0] - POLICY_TEACHER[0];
      const label = matched
        ? 'Student − teacher     ' +
          POLICY_STUDENT[0].toFixed(2) +
          ' − ' +
          POLICY_TEACHER[0].toFixed(2) +
          ' = ' +
          difference
        : 'Score for “7 days”     Raise, lower, or leave it alone?';
      text(ctx, api, label, 960, 835, 43, C.yellow, 'center');
    });
  }
  if (beat >= 2) {
    api.focus.target('policy-rule', () => {
      text(ctx, api, 'Policy for this key', 360, 966, 43, C.muted);
      if (open > 0) api.line(ctx, 844, 987, 844 + 658 * open, 987, C.muted, 3);
      if (verdict) text(ctx, api, POLICY_CASES[1].rule, 850, 964, 54, C.pink);
    });
  }
  ctx.restore();
}

export default {
  id: 'intro',
  draw: drawIntro,
  cues: ['intro-teacher', 'intro-student', 'intro-match', 'intro-rule', 'intro-verdict'],
};
