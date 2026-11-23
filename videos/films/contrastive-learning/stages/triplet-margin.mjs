import { formatValue } from '../arithmetic.mjs';
import { drawLine, drawNote, drawText } from '../defaults.mjs';
export function drawTripletMargin(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-triplet-margin-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('triplet-margin-mechanism', () => {
    const changed = currentBeat > 0 || B('active'),
      dp = changed ? 0.5 : 0.2,
      dn = changed ? 0.3 : 0.5,
      active = changed ? resultComplete('active') || currentBeat > 0 : resultComplete('zero'),
      x = 400,
      w = 1150;
    drawText(
      ctx,
      api,
      'Same anchor · distance is smaller-is-better',
      960,
      290,
      35,
      themeColors.yellow,
    );
    drawLine(ctx, api, x, 500, x + w, 500, themeColors.muted, 4);
    api.circle(ctx, x, 500, 12, themeColors.yellow);
    [
      [dp, 'positive', themeColors.green, 410],
      [dn, 'negative', themeColors.pink, 620],
    ].forEach(([v, label, col, y]) => {
      const xx = x + (w * v) / 0.6;
      drawLine(ctx, api, xx, 500, xx, y, col, 3);
      api.circle(ctx, xx, 500, 13, col);
      drawText(ctx, api, label + ' ' + formatValue(v, 2), xx, y + (y > 500 ? 50 : -25), 31, col);
    });
    if (B('rule') || currentBeat > 0)
      drawText(ctx, api, 'max(0, d+ − d− + margin .10)', 960, 780, 39, themeColors.cyan);
    if (active)
      drawText(
        ctx,
        api,
        changed ? 'max(0, .50 − .30 + .10) = .30' : 'max(0, .20 − .50 + .10) = 0',
        960,
        915,
        37,
        changed ? themeColors.pink : themeColors.green,
      );
    drawNote(ctx, api, 'Zero loss certifies only this chosen triplet and margin');
  });
}
export default {
  id: 'triplet-margin',
  draw: drawTripletMargin,
  cues: [
    'cl-triplet-margin-rule',
    'cl-triplet-margin-zero',
    'cl-triplet-margin-active',
    'cl-triplet-margin-contract',
  ],
};
