import { alignmentRelease } from './model.mjs';

export function drawReleaseRulers(
  ctx,
  api,
  { wins, growth, cohort, countVisible, intervalVisible, growthVisible, judged, prompt, note },
) {
  const { C } = api;
  const result = alignmentRelease(wins, 400, growth);
  const left = 540,
    right = 1720,
    threshold = (left + right) / 2;
  const winX = (v) => threshold + ((v - 0.5) / 0.15) * (right - threshold);
  const lengthX = (v) => threshold + ((v - 20) / 30) * (right - threshold);
  api.text(ctx, cohort, 130, 264, 37, C.ink);
  function ruler(y, ticks, position, format) {
    api.line(ctx, left, y, right, y, C.muted, 3);
    for (const tick of ticks) {
      const x = position(tick);
      api.line(ctx, x, y - 10, x, y + 12, C.muted, 2);
      api.text(ctx, format(tick), x, y + 54, 29, C.muted, 'center');
    }
    api.line(ctx, threshold, y - 31, threshold, y + 21, C.yellow, 5);
  }
  api.focus.target('win-rule', () => {
    api.text(ctx, 'Human wins', 130, 403, 42, C.ink);
    if (countVisible) api.text(ctx, wins + ' of 400', 130, 469, 35, C.blue);
    api.text(ctx, 'Lower end must clear 50%', 130, 538, 28, C.muted);
    const y = 460;
    ruler(y, [0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65], winX, (p) => Math.round(p * 100) + '%');
    if (intervalVisible) {
      const lo = winX(result.lower),
        hi = winX(result.upper);
      api.line(ctx, lo, y, hi, y, C.blue, 11);
      api.line(ctx, lo, y - 17, lo, y + 17, C.blue, 5);
      api.line(ctx, hi, y - 17, hi, y + 17, C.blue, 5);
      const pct = (p) => (p * 100).toFixed(1) + '%';
      api.text(ctx, pct(result.lower), lo, y - 48, 37, C.blue, 'center');
      api.text(ctx, pct(result.upper), hi, y - 48, 33, C.blue, 'center');
    }
    if (countVisible) api.circle(ctx, winX(result.rate), y, 11, C.ink, C.bg, 3);
    api.text(ctx, '95% Wilson interval', 1715, 583, 27, C.muted, 'right');
  });
  api.focus.target('length-rule', () => {
    api.text(ctx, 'Mean length growth', 130, 700, 39, C.ink);
    api.text(ctx, 'Must stay below +20', 130, 764, 29, C.muted);
    const y = 752;
    ruler(y, [0, 10, 20, 30, 40, 50], lengthX, (v) => (v > 0 ? '+' : '') + v);
    if (growthVisible) {
      const at = lengthX(growth);
      api.line(ctx, lengthX(0), y, at, y, C.cyan, 8);
      api.circle(ctx, at, y, 11, C.cyan, C.bg, 3);
      api.text(
        ctx,
        '+' + growth.toFixed(Number.isInteger(growth) ? 0 : 1) + ' tokens',
        at,
        y - 55,
        39,
        C.cyan,
        'center',
      );
    }
  });
  api.focus.target('gate-verdict', () => {
    let label = prompt;
    if (judged) {
      label = result.eligible
        ? 'Both rules pass'
        : result.winPass
          ? 'Hold  ·  length fails'
          : result.lengthPass
            ? 'Hold  ·  win evidence falls short'
            : 'Hold  ·  both rules fail';
    }
    api.text(ctx, label, 130, 935, 48, judged ? (result.eligible ? C.green : C.yellow) : C.ink);
    if (note) api.text(ctx, note, 132, 1003, 30, C.muted);
  });
}
