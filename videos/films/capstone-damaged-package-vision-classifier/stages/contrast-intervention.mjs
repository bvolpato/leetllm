import { visionFrame } from '../model.mjs';
import { visionMatrix, visionNote, visionText, visionValue } from '../defaults.mjs';
export function drawContrastIntervention(ctx, scene, state, api) {
  const frameState = visionFrame('contrast-intervention', state);
  return api.focus.target('dv-contrast-intervention-mechanism', () => {
    const { C: themeColors } = api;
    {
      const panels = [
        {
          x: 180,
          name: 'Original',
          data: frameState.initial,
          color: themeColors.blue,
        },
        {
          x: 1030,
          name: 'Changed contrast',
          data: frameState.changed,
          color: themeColors.pink,
        },
      ];
      panels.forEach(({ x, name, data, color }, i) => {
        visionText(ctx, api, name, x + 320, 300, 35, color, 'center');
        for (let r = 0; r < 5; r++)
          for (let col = 0; col < 5; col++) {
            const v = data.pixels[r][col],
              gray = Math.round(255 * v);
            api.rect(
              ctx,
              x + 100 + col * 66,
              350 + r * 50,
              63,
              47,
              `rgb(${gray},${gray},${gray})`,
              themeColors.muted,
              0,
            );
          }
        visionText(ctx, api, 'Same edge position', x + 265, 660, 27, themeColors.muted, 'center');
        const labels = Array.from(
          {
            length: 3,
          },
          (_, r) =>
            Array.from(
              {
                length: 3,
              },
              (_, col) => (i && !frameState.showResponses ? '·' : data.responses[r * 3 + col]),
            ),
        );
        visionMatrix(ctx, api, labels, x + 475, 405, 76);
        visionValue(
          ctx,
          api,
          'Population variance',
          i ? '1 / 6' : '2 / 3',
          x + 90,
          760,
          !i || frameState.showVariance,
          color,
        );
        if (!i || frameState.showVariance)
          visionText(ctx, api, data.variance.toFixed(6), x + 440, 817, 31, color);
      });
      if (frameState.showLaw)
        visionText(
          ctx,
          api,
          'Responses × c     Variance × c²',
          960,
          910,
          35,
          themeColors.yellow,
          'center',
        );
      else
        visionText(
          ctx,
          api,
          'Only intensity amplitude changes; no blur is added.',
          960,
          910,
          31,
          themeColors.ink,
          'center',
        );
      visionNote(
        ctx,
        api,
        'The invented routing blur score is a separate quantity, with no implemented conversion.',
      );
    }
  });
}
export default {
  id: 'contrast-intervention',
  draw: drawContrastIntervention,
  cues: [
    'dv-contrast-intervention-0',
    'dv-contrast-intervention-operation-0',
    'dv-contrast-input',
    'dv-contrast-responses',
    'dv-contrast-variance',
    'dv-contrast-intervention-1',
    'dv-contrast-intervention-operation-1',
    'dv-contrast-law',
    'dv-contrast-intervention-2',
    'dv-contrast-intervention-operation-2',
    'dv-blur-score-boundary',
  ],
};
