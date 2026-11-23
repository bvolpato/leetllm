import { HEAD_SCORES, HEAD_CUT } from '../fixtures.mjs';
import { keepAbove } from '../arithmetic.mjs';
import { beatCue } from '../model.mjs';

export function drawSignedGates(ctx, scene, state, api) {
  const { C } = api;
  const turn = beatCue(state, 0, 'lp-negative', 0.13, 0.41);
  // The two observations have equal magnitudes. Move only the signed marker between them.
  const after = HEAD_SCORES.map((v, i) => (i === 0 ? -v : v));
  const signedShown = HEAD_SCORES.map((v, i) => api.lerp(v, after[i], turn));
  const result = beatCue(state, 1, 'lp-reverse', 0.7, 0.9);
  for (const [magnitude, cue, target, offset] of [
    [false, 'lp-signed-select', 'lp-signed', 0],
    [true, 'lp-absolute-select', 'lp-absolute', 890],
  ]) {
    const x = (v) => 250 + offset + (magnitude ? v * 580 : (v + 1) * 290);
    const selected = keepAbove(magnitude ? after.map(Math.abs) : after, HEAD_CUT);
    const show = beatCue(state, 1, cue, magnitude ? 0.42 : 0.04, magnitude ? 0.61 : 0.27);
    api.focus.target(target, () => {
      api.text(
        ctx,
        magnitude ? 'Gate magnitude' : 'Signed gate',
        550 + offset,
        274,
        44,
        C.ink,
        'center',
      );
      for (const v of magnitude ? [0, 0.5, 1] : [-1, 0, 1]) {
        api.text(ctx, String(v).replace('-', '−'), x(v), 329, 28, C.muted, 'center');
      }
      HEAD_SCORES.forEach((score, i) => {
        const y = 419 + 98 * i,
          val = magnitude ? Math.abs(score) : signedShown[i];
        const color = show === 1 && !selected.kept.includes(i) ? C.pink : i === 0 ? C.cyan : C.blue;
        api.text(ctx, 'H' + (i + 1), 135 + offset, y + 12, 33, C.ink);
        api.line(ctx, x(magnitude ? 0 : -1), y, x(1), y, C.muted, 1);
        for (const tick of magnitude ? [0, 0.5, 1] : [-1, 0, 1])
          api.line(ctx, x(tick), y - 5, x(tick), y + 7, C.muted, 2);
        if (show > 0)
          api.line(
            ctx,
            x(selected.threshold),
            y - 14 * show,
            x(selected.threshold),
            y + 14 * show,
            C.yellow,
            4,
          );
        api.circle(ctx, x(val), y, 12, color);
        if (i !== 0 || magnitude || turn === 0 || turn === 1)
          api.text(ctx, val.toFixed(2).replace('-', '−'), x(val), y - 23, 28, color, 'center');
      });
      const lost = after.findIndex((_, i) => !selected.kept.includes(i)) + 1;
      const legend =
        show === 1
          ? 'Cutoff ' + Number(selected.threshold.toFixed(4)) + '   ·   H' + lost + ' leaves'
          : '25% cut   ·   which head leaves?';
      api.text(ctx, legend, 550 + offset, 848, 36, show === 1 ? C.yellow : C.muted, 'center');
    });
  }
  api.focus.target('lp-reverse', () => {
    api.text(
      ctx,
      result > 0
        ? 'Head output 2 × gate (−0.91) = ' + (2 * after[0]).toFixed(2).replace('-', '−')
        : 'Compare the same four gates under both rules.',
      960,
      989,
      37,
      C.ink,
      'center',
    );
  });
}
export default {
  id: 'signed-gates',
  draw: drawSignedGates,
  cues: ['lp-negative', 'lp-signed-select', 'lp-absolute-select', 'lp-reverse'],
};
