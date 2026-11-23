import { qUpdate, shaping } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalResearchCorridor, drawOriginalResearchText } from '../defaults.mjs';
export function drawUpdate(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    api.focus.target('slipped-agent', () =>
      drawOriginalResearchCorridor(
        ctx,
        api,
        360,
        modelState.b ? 0 : 1 - modelState.p,
        themeColors.cyan,
      ),
    );
    drawOriginalResearchText(
      ctx,
      api,
      'Start state 1 · intended RIGHT · realized next state 0',
      960,
      280,
      34,
      themeColors.ink,
      'center',
    );
    api.focus.target('state-action-entry', () =>
      teaching.grid({
        x: 390,
        y: 620,
        width: 1140,
        height: 170,
        rows: 2,
        columns: 3,
        labels: [
          ['Q entry', 'Training reward', 'Next value'],
          ['Q(1, right)', shaping(1, 0).toFixed(3), modelState.b ? '0.400' : '0.000'],
        ],
        fontSize: 31,
        padding: 13,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: [
          {
            row: 1,
            column: 0,
            fill: themeColors.panel,
            stroke: themeColors.yellow,
          },
        ],
      }),
    );
    const next = modelState.b ? 0.4 : 0;
    api.focus.target('q-target-calculation', () =>
      api.math(
        ctx,
        String.raw`Q_{\mathrm{new}}=0+0.2\left(-0.117+0.95\times` +
          next.toFixed(1) +
          String.raw`\right)\approx` +
          qUpdate(0, shaping(1, 0), next).toFixed(3),
        960,
        920,
        43,
        themeColors.yellow,
        'center',
      ),
    );
    {
    }
  }
}
export default {
  id: 'update',
  draw: drawUpdate,
  cues: ['update-state-action-entry-b1-1', 'update-q-target-calculation-b2-1'],
};
