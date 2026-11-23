import { coverageFixture } from '../model.mjs';
import { retainedDrawEquation, retainedDrawText } from '../defaults.mjs';
export function drawCoverage(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.1, 0.9),
    F = components.fade;
  {
    if (currentBeat === 0) {
      const coverage = coverageFixture();
      components.matrix({
        values: [[1, 1]],
        x: 300,
        y: 450,
        cellSize: 160,
        style: {
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.blue,
          fontSize: 40,
          padding: 16,
        },
      });
      F(phaseForBeat(0), () => {
        components.matrix({
          values: [[0, Math.SQRT2.toFixed(3)]],
          x: 1250,
          y: 450,
          cellSize: 160,
          style: {
            fill: themeColors.panel,
            stroke: themeColors.green,
            textColor: themeColors.green,
            fontSize: 36,
            padding: 10,
          },
        });
      });
      retainedDrawText(ctx, api, 'two active directions', 460, 330, 38, themeColors.blue, 'center');
      retainedDrawText(
        ctx,
        api,
        'one combined unit direction',
        1410,
        330,
        34,
        themeColors.green,
        'center',
      );
      api.focus.target('equivalent-reconstruction', () =>
        retainedDrawText(
          ctx,
          api,
          'Same reconstruction [1, 1]',
          960,
          820,
          44,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('coverage-general-code', () =>
        retainedDrawEquation(
          ctx,
          api,
          String.raw`z_g=\max(0,x_1-x_2)=${coverage.general}`,
          1410,
          700,
          36,
          themeColors.green,
          'center',
        ),
      );
      api.focus.target('equivalent-reconstruction', () =>
        retainedDrawEquation(
          ctx,
          api,
          String.raw`\hat x=0[1,0]+\sqrt2\,\frac{[1,1]}{\sqrt2}=[1,1]`,
          960,
          960,
          40,
          themeColors.yellow,
          'center',
        ),
      );
    } else {
      const baseline = api.lerp(20, 2.4, phaseForBeat(1)),
        recovered = 1 - 0.2 / (baseline - 2);
      api.focus.target('raw-losses', () =>
        teaching.bars({
          x: 280,
          y: 420,
          width: 800,
          height: 330,
          values: [2, 2.2, baseline],
          labels: ['clean', 'reconstructed', 'ablated'],
          max: 20,
          color: themeColors.blue,
          showValues: true,
          format: (v) => v.toFixed(2),
          fontSize: 34,
        }),
      );
      api.focus.target('relative-recovery', () =>
        retainedDrawText(
          ctx,
          api,
          `loss recovered ≈ ${recovered.toFixed(3)}`,
          1470,
          470,
          40,
          themeColors.yellow,
          'center',
        ),
      );
      retainedDrawText(
        ctx,
        api,
        'same absolute damage: 0.2',
        1470,
        680,
        36,
        themeColors.pink,
        'center',
      );
    }
  }
}
export default {
  id: 'coverage',
  draw: drawCoverage,
  cues: [
    'coverage-b1-1',
    'coverage-general-silent',
    'coverage-b2-1',
    'coverage-b2-2',
    'coverage-b3-1',
  ],
};
