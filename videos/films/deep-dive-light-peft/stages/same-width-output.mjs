import { beatCue, headFixture } from '../model.mjs';
import { drawHeadComparison } from '../head-comparison.mjs';

const f = headFixture([1, -1]);

export function drawSameWidthOutput(ctx, scene, state, api) {
  const values = beatCue(state, 0, 'lp-four-values', 0.12, 0.53);
  const pack = beatCue(state, 0, 'lp-slot-pack', 0.56, 0.82);
  const sumA = beatCue(state, 1, 'lp-output-a', 0.07, 0.36) === 1;
  const sumB = beatCue(state, 1, 'lp-output-b', 0.46, 0.8) === 1;
  const key = beatCue(state, 2, 'lp-slot-mismatch', 0.15, 0.45);
  drawHeadComparison(ctx, api, f, {
    values,
    pack,
    sumA,
    sumB,
    inputTarget: 'head-token',
    sourceTarget: 'head-values',
    aTarget: 'head-a',
    bTarget: 'head-b',
  });
  api.focus.target('head-decision', () => {
    const line =
      key > 0
        ? 'Separate cache entries for H2 and H1 in the middle slot.'
        : sumB
          ? 'Shared ends: 1 + 8. The middle slot changes the sum.'
          : 'Which original head supplies each middle slot?';
    api.text(ctx, line, 960, 958, 38, api.C.yellow, 'center');
  });
}
export default {
  id: 'same-width-output',
  draw: drawSameWidthOutput,
  cues: ['lp-four-values', 'lp-slot-pack', 'lp-output-a', 'lp-output-b', 'lp-slot-mismatch'],
};
