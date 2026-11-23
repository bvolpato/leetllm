import { after, initialScores, progress, scoreReport, signed, started } from '../decisions.mjs';
import { drawScoreboard } from '../scoreboard.mjs';
import { earnedTransferSnapshot } from '../model.mjs';

export function drawEarnedTransfer(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat >= 2) {
    const last = started(state, 'boundary-score'),
      retry = after(state, 'retry-score');
    const math = after(state, 'boundary-score') ? 87 : retry ? 86.4 : initialScores[1];
    const verdict = last ? after(state, 'pass-scores') : after(state, 'retry-hold');
    drawScoreboard(ctx, api, scoreReport(math), {
      showScores: true,
      absolute: true,
      relative: true,
      gap: verdict ? 'source' : null,
      verdict,
      previousMath: last ? 86.4 : initialScores[1],
      movingMath: last
        ? 86.4 + (87 - 86.4) * progress(state, 'boundary-score')
        : initialScores[1] + (86.4 - initialScores[1]) * progress(state, 'retry-score'),
    });
    if (started(state, 'next-tests')) {
      api.focus.target('next-check', () =>
        api.text(ctx, 'Next   →   Safety and serving tests', 155, 1020, 40, C.ink),
      );
    }
    return;
  }
  api.focus.target('transfer-ruler', () => {
    const {
      base,
      code,
      math,
      codeScale,
      mathScale,
      right,
      left,
      position,
      result,
      progress: p,
    } = earnedTransferSnapshot(state);
    const a = Math.min(1, 2 * p),
      b = Math.max(0, 2 * p - 1);
    const x = (v) => 265 + (v - 1.5) * 1370;
    const label = (v, x, y, size, col, align = 'left') => api.text(ctx, v, x, y, size, col, align);
    label(
      'Code    ' + codeScale + ' × (' + code + ' − ' + base.toFixed(1) + ')',
      230,
      335,
      45,
      C.blue,
    );
    label(
      'Math    ' + mathScale + ' × (' + math + ' − ' + base.toFixed(1) + ')',
      1010,
      335,
      45,
      C.pink,
    );
    api.line(ctx, x(1.5), 684, x(2.5), 684, C.muted, 3);
    for (const [i, name] of ['Math', 'Base', 'Code'].entries()) {
      const v = 1.5 + 0.5 * i;
      api.line(ctx, x(v), 662, x(v), 708, C.muted, 4);
      label(name + '   ' + v.toFixed(1), x(v), 783, 36, [C.pink, C.ink, C.blue][i], 'center');
    }
    if (a > 0) api.arrow(ctx, x(base), 597, x(base + right * a), 597, C.blue, 6);
    if (b > 0) api.arrow(ctx, x(base + right), 500, x(base + right + left * b), 500, C.pink, 6);
    api.circle(ctx, x(position), 684, 15, C.yellow);
    if (a === 1) label(signed(right), x(base + right / 2), 567, 37, C.blue, 'center');
    if (b === 1) label(signed(left), x(base + right + left / 2), 469, 37, C.pink, 'center');
    label(
      after(state, 'transfer-weight')
        ? 'Candidate weight   ' + result.toFixed(1)
        : 'Candidate weight   ?',
      960,
      938,
      49,
      C.yellow,
      'center',
    );
  });
}
export default {
  id: 'earned-transfer',
  draw: drawEarnedTransfer,
  cues: [
    'new-inputs',
    'earned-result',
    'transfer-weight',
    'retry-score',
    'retry-hold',
    'boundary-score',
    'pass-scores',
    'next-tests',
  ],
};
