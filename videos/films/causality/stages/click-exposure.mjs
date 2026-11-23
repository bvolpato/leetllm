import { clickExposureFixture } from '../model.mjs';
import { box, datum, focusProgress, footer, label } from '../defaults.mjs';
export function drawClickExposure(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    q = (id) => focusProgress(ctx, api, 'cau-' + id),
    done = (id) => q(id) >= 1;
  const pc = (v, d = 1) => Number((100 * v).toFixed(d)) + '%';
  api.focus.target('cau-click-exposure-mechanism', () => {
    const wrong = done('click-wrong-input'),
      f = clickExposureFixture(wrong ? 0.4 : 0.2);
    box(
      ctx,
      api,
      'Supplied position-based model',
      ['P(examination)=0.2', 'P(relevant)=0.6', 'independence is assumed'],
      180,
      315,
      730,
      240,
      themeColors.blue,
    );
    box(
      ctx,
      api,
      'Expected per 100 impressions',
      [
        done('click-product') ? '12 clicks' : 'click product ?',
        `used observation probability ${f.usedExamination}`,
      ],
      1040,
      315,
      700,
      195,
      themeColors.yellow,
    );
    api.rect(ctx, 300, 680, 1000 * 0.2, 115, themeColors.panel, themeColors.yellow, 7);
    if (done('click-product'))
      api.rect(ctx, 300, 680, 1000 * 0.12, 115, themeColors.green, undefined, 7);
    label(ctx, api, 'examined mass', 670, 750, themeColors.yellow, 29);
    datum(
      ctx,
      api,
      'Corrected ' + pc(f.corrected, 0),
      1260,
      815,
      wrong ? done('click-wrong-weight') : done('click-correct-weight'),
      themeColors.green,
      42,
    );
    footer(
      ctx,
      api,
      'Constructed expectations under the declared click model; trust and popularity effects remain unchecked.',
    );
  });
}
export default {
  id: 'click-exposure',
  draw: drawClickExposure,
  cues: [
    'cau-click-exposure-0',
    'cau-click-product',
    'cau-click-exposure-1',
    'cau-click-correct-weight',
    'cau-click-wrong-weight',
    'cau-click-wrong-input',
    'cau-click-exposure-2',
  ],
};
