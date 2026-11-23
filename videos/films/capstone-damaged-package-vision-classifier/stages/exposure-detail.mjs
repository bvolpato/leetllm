import { visionFrame } from '../model.mjs';
import { visionCard, visionNote, visionText, visionValue } from '../defaults.mjs';
export function drawExposureDetail(ctx, scene, state, api) {
  const frameState = visionFrame('exposure-detail', state);
  return api.focus.target('dv-exposure-detail-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      if (currentBeat === 0) {
        api.rect(ctx, 190, 350, 690, 380, themeColors.panel, themeColors.blue, 7);
        api.rect(ctx, 270, 430, 500, 220, themeColors.muted, themeColors.cyan, 2);
        api.rect(ctx, 640, 460, 100, 65, themeColors.ink, themeColors.muted, 1);
        visionText(ctx, api, 'Dark parcel + bright label', 535, 810, 31, themeColors.ink, 'center');
        const vals = [7, 12, 9, 5, 2, 1, 1, 3];
        const hist = api.teaching.axes({
          x: 1080,
          y: 400,
          width: 590,
          height: 310,
          xDomain: [0, 8],
          yDomain: [0, 14],
          xTicks: [0, 4, 8],
          yTicks: [0, 7, 14],
          xLabel: 'Intensity bin',
          yLabel: 'Illustrative pixels',
          fontSize: 24,
        });
        vals.forEach((v, i) => {
          const a = hist.point(i + 0.12, 0),
            z = hist.point(i + 0.88, v);
          api.rect(
            ctx,
            a.x,
            z.y,
            z.x - a.x,
            a.y - z.y,
            i < 3 ? themeColors.blue : themeColors.yellow,
            undefined,
            0,
          );
        });
        visionText(
          ctx,
          api,
          'Inspect the parcel region',
          1390,
          810,
          31,
          themeColors.cyan,
          'center',
        );
        visionNote(ctx, api, 'Schematic histogram, not measured parcel pixels or calibrated lux.');
      } else {
        const show = resultComplete('resize-detail', 1),
          scale = 224 / 1024;
        visionText(ctx, api, 'Whole-frame resize', 960, 300, 37, themeColors.ink, 'center');
        api.rect(ctx, 170, 400, 1024, 220, themeColors.panel, themeColors.blue, 0);
        api.rect(ctx, 620, 400, 4, 220, themeColors.pink, undefined, 0);
        api.rect(ctx, 620, 700, 4 * 24, 45, themeColors.pink, undefined, 0);
        visionText(
          ctx,
          api,
          'Separate magnified inset ×24',
          682,
          680,
          27,
          themeColors.pink,
          'center',
        );
        const inset = visionCard(ctx, api, '4 pixels', 190, 765, 310, 100, themeColors.pink),
          ratio = visionCard(ctx, api, '224 / 1024', 720, 765, 360, 100, themeColors.cyan);
        api.arrow(ctx, 1230, 510, 1390, 510, themeColors.cyan, 4);
        api.rect(ctx, 1430, 400, 224, 220, themeColors.panel, themeColors.blue, 0);
        if (show)
          api.rect(ctx, 1430 + 450 * scale, 400, 4 * scale, 220, themeColors.pink, undefined, 0);
        visionValue(
          ctx,
          api,
          'Output feature width',
          '0.875 pixels',
          1310,
          750,
          show,
          themeColors.pink,
        );
        visionNote(
          ctx,
          api,
          'Geometric width accounting. Neither this sketch nor a missing corner predicts a learned damage score.',
        );
      }
    }
  });
}
export default {
  id: 'exposure-detail',
  draw: drawExposureDetail,
  cues: [
    'dv-exposure-detail-0',
    'dv-exposure-detail-operation-0',
    'dv-region-exposure',
    'dv-exposure-detail-1',
    'dv-exposure-detail-operation-1',
    'dv-resize-detail',
    'dv-exposure-detail-2',
    'dv-exposure-detail-operation-2',
  ],
};
