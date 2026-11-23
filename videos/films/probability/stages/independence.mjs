import { mix, phase } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import {
  box,
  countReceipt,
  detailText,
  equation,
  focus,
  focusTarget,
  rectangle,
  text,
} from '../defaults.mjs';
function drawIndependence(ctx, state, api) {
  const q = cueProgress(state, 'independent-select', 1),
    selected = phase(q, 0, 0.4),
    joined = phase(q, 0.42, 1);
  focus(api, 'independent-sources', () => {
    [100, 9900].forEach((count, i) => {
      const x = i ? 1100 : 280,
        color = i ? api.C.blue : api.C.red;
      box(ctx, api, i ? '9,900 clean' : '100 abusive', x, 285, 540, 90, color, 39);
      text(ctx, api, 'Select 20% within this source', x + 270, 420, 29, color);
      api.rect(ctx, x, 470, 540, 105, api.C.panel, undefined, 8);
      const targetX = i ? 294 : 280,
        targetWidth = i ? 1386 : 14;
      if (selected > 0)
        api.rect(
          ctx,
          mix(x, targetX, joined),
          mix(470, 710, joined),
          mix(108 * selected, targetWidth, joined),
          105,
          color,
          undefined,
          6,
        );
      if (q === 1) text(ctx, api, count * 0.2 + ' selected', x + 270, 650, 36, color);
    });
    countReceipt(
      ctx,
      api,
      q === 1 ? '20 / (20 + 1,980) = 1%' : 'Would this flag change the prior?',
      q === 1
        ? 'The class proportion is preserved'
        : 'Join the equal source fractions before dividing',
    );
  });
}
export function drawIndependenceStage(ctx, scene, state, api) {
  if (drawAdditional(ctx, scene, state, api)) return;
  drawIndependence(ctx, state, api);
}
function drawAdditional(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const exclusive = currentBeat >= 2;
  if (!exclusive) return false;
  const { C: themeColors } = api,
    E = (beat, id) => cueProgress(state, id, beat);
  if (exclusive) {
    detailText(
      ctx,
      api,
      'Abuse and clean partition the same population',
      960,
      300,
      37,
      themeColors.ink,
    );
    rectangle(ctx, api, 260, 480, 14, 150, themeColors.red);
    rectangle(ctx, api, 274, 480, 1386, 150, themeColors.blue);
    detailText(ctx, api, 'A:100', 390, 410, 35, themeColors.red);
    detailText(ctx, api, 'C:9900', 1370, 410, 35, themeColors.blue);
    detailText(ctx, api, 'No row belongs to both', 960, 740, 36, themeColors.yellow);
    focusTarget(ctx, api, 'mutually-exclusive', () =>
      equation(
        ctx,
        api,
        E(2, 'exclude-update') > 0.8 ? 'P(C\\mid A)=0\\neq P(C)=0.99' : 'P(C\\mid A)=?',
        960,
        930,
        49,
        themeColors.yellow,
      ),
    );
    return true;
  }
  return true;
}
export default {
  id: 'independence',
  draw: drawIndependenceStage,
  cues: ['independent-prediction', 'independent-select', 'exclude-update'],
};
