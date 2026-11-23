import { policyDiagnosis, policyShift } from '../arithmetic.mjs';
import { policyRuler, requestHeader, sceneCues, verdict } from '../picture.mjs';

export function drawDiagnose(ctx, scene, state, api) {
  const cue = sceneCues(scene, state);
  const { C } = api;
  const old = policyDiagnosis(0),
    fixed = policyDiagnosis(2);
  const original = policyShift(1);
  const move = cue.progress('diag-install');
  const cutoff = old.checker.threshold + move * (fixed.checker.threshold - old.checker.threshold);
  api.focus.target('diagnose-mechanism', () => {
    requestHeader(ctx, api, { id: 'K10234', stale: original.facts.stale, model: 'v4' });
    if (state.beat < 2) {
      const lanes = [{ label: 'Policy v2  ·  60 d', start: old.source.threshold, color: C.yellow }];
      if (cue.started('diag-context'))
        lanes.push({
          label: 'Passage v2  ·  60 d',
          start: old.retrieved.threshold,
          color: C.yellow,
        });
      if (cue.started('diag-check'))
        lanes.push({
          label:
            move === 0
              ? 'Checker C1  ·  30 d'
              : move === 1
                ? 'Checker C2  ·  60 d'
                : 'Installing C2',
          start: cutoff,
          color: C.blue,
        });
      policyRuler(ctx, api, original.facts.ageDays, lanes);
      if (cue.started('diag-predict') && state.beat === 0)
        api.text(ctx, 'Which part would you change first?', 960, 904, 46, C.yellow, 'center');
      if (cue.after('diag-replay'))
        api.text(
          ctx,
          'Replayed reply   ·   ' + verdict(original.facts.ageDays >= fixed.checker.threshold),
          960,
          904,
          49,
          C.ink,
          'center',
        );
    } else {
      api.text(
        ctx,
        'Checker C2 accepts stale keys at or above 60 days',
        960,
        370,
        41,
        C.ink,
        'center',
      );
      const x = (age) => 330 + (age - 57) * 240;
      const y = 600;
      api.line(ctx, x(57), y, x(62), y, C.muted, 4);
      api.line(ctx, x(60), y, x(62), y, C.yellow, 13);
      for (let age = 57; age <= 62; age++) {
        api.line(ctx, x(age), y - 10, x(age), y + 12, C.ink, 2);
        api.text(ctx, String(age), x(age), y + 64, 34, C.ink, 'center');
      }
      api.text(ctx, 'Key age in days', 960, 754, 30, C.muted, 'center');
      for (const [i, row] of fixed.boundary.entries()) {
        const shown = cue.after(i ? 'diag-equal' : 'diag-below');
        api.circle(ctx, x(row.age), y, 14, C.cyan, C.bg, 2);
        api.text(
          ctx,
          shown ? verdict(row.decision === 'eligible') : '?',
          x(row.age),
          y - 62,
          38,
          shown ? C.cyan : C.muted,
          'center',
        );
      }
      if (cue.after('diag-equal'))
        api.text(ctx, '60 ≥ 60   ·   Equality qualifies', 960, 919, 46, C.yellow, 'center');
    }
  });
}
export default {
  id: 'diagnose',
  draw: drawDiagnose,
  cues: [
    'diag-context',
    'diag-check',
    'diag-predict',
    'diag-install',
    'diag-replay',
    'diag-below',
    'diag-equal',
  ],
};
