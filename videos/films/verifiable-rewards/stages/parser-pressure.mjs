import { capacityScore, openingFields } from '../capacity.mjs';
import { drawSubmissions, spokenProgress } from '../drawing.mjs';

export function drawParserPressure(ctx, scene, state, api) {
  const { C } = api;
  const p = spokenProgress(api, state);
  const read = p('replay-first', 0);
  const weak = p('replay-weak', 0, 0.65, 0.85);
  const scan = p('replay-scan', 1, 0.37, 0.64);
  const count = p('replay-count', 1, 0.65, 0.76);
  const strict = p('replay-strict', 2, 0.07, 0.2);
  const y = 470;
  api.text(ctx, 'Reference   14 × 12 = 168', 170, 275, 40, C.cyan);
  drawSubmissions(ctx, api, { y, showRows: true, showSecond: true, readFirst: read, scan });
  const showStrict = state.beat >= 1;
  api.text(ctx, 'First box', 1430, 365, 32, C.muted, 'center');
  if (showStrict) api.text(ctx, 'Single box', 1680, 365, 32, C.muted, 'center');
  for (let i = 0; i < 2; i++) {
    const row = y + 145 * i,
      response = openingFields[i].join(' then ');
    api.focus.target('weak-scores', () =>
      api.text(
        ctx,
        weak > 0 ? String(capacityScore(response, 168, false)) : '?',
        1430,
        row,
        50,
        weak > 0 ? C.green : C.ink,
        'center',
      ),
    );
    if (showStrict) {
      const score = capacityScore(response, 168, true);
      api.focus.target('strict-scores', () =>
        api.text(
          ctx,
          strict > 0 ? String(score) : '?',
          1680,
          row,
          50,
          strict > 0 ? (score ? C.green : C.pink) : C.ink,
          'center',
        ),
      );
    }
  }
  if (showStrict)
    api.focus.target('field-counts', () => {
      api.text(
        ctx,
        count > 0
          ? 'A has 1 marker     B has 2 markers'
          : 'Count every box marker in the submission',
        170,
        805,
        40,
        C.yellow,
      );
    });
  if (strict >= 1)
    api.text(
      ctx,
      'Rescore the stored submissions before the next policy update.',
      170,
      930,
      36,
      C.ink,
    );
}

export default {
  id: 'parser-pressure',
  draw: drawParserPressure,
  cues: ['replay-first', 'replay-weak', 'replay-scan', 'replay-count', 'replay-strict'],
};
