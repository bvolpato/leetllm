import { sampleModel } from '../model.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawTopology(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    modelState = sampleModel('topology', state),
    currentBeat = modelState.step;
  {
    api.focus.target('topology-reduction-derivation', () =>
      drawOriginalText(
        ctx,
        api,
        `${modelState.layers} layers × ${modelState.reductionsPerLayer} reductions / layer = ${modelState.totalReductions}`,
        960,
        280,
        36,
        themeColors.ink,
        'center',
      ),
    );
    drawOriginalText(
      ctx,
      api,
      `Layer ${modelState.activeLayer} / ${modelState.layers}`,
      150,
      390,
      31,
      themeColors.yellow,
    );
    const ticks = api.focus.target('topology-layer-ticks', () =>
      modelState.layerTicks.map((complete, i) =>
        components.card({
          label: `reduction ${i + 1}`,
          x: 590 + i * 360,
          y: 340,
          width: 260,
          height: 95,
          fontSize: 29,
          padding: 14,
          fill: complete ? '#63deec25' : themeColors.panel,
          stroke: complete ? themeColors.cyan : themeColors.muted,
          textColor: complete ? themeColors.cyan : themeColors.muted,
        }),
      ),
    );
    api.connect(ctx, ticks[0], ticks[1], {
      color: modelState.layerTicks[1] ? themeColors.cyan : themeColors.muted,
      gap: 14,
    });
    const accumulator = api.focus.target('topology-reduction-count', () =>
      components.card({
        label: `${modelState.reductions} / ${modelState.totalReductions} reductions`,
        x: 1390,
        y: 340,
        width: 380,
        height: 95,
        fontSize: 29,
        padding: 14,
        fill: themeColors.panel,
        stroke: themeColors.yellow,
        textColor: themeColors.yellow,
      }),
    );
    api.connect(ctx, ticks[1], accumulator, {
      color: modelState.layerTicks[1] ? themeColors.yellow : themeColors.muted,
      gap: 14,
    });
    api.focus.target('topology-startup-costs', () =>
      [5, 20].forEach((us, i) => {
        const y = 550 + i * 220;
        drawOriginalText(
          ctx,
          api,
          `Route ${i ? 'B' : 'A'} · ${us} µs startup`,
          170,
          y - 35,
          31,
          i ? themeColors.pink : themeColors.cyan,
        );
        api.rect(
          ctx,
          170,
          y,
          (1500 * modelState.ms[i]) / 3.2,
          75,
          i ? themeColors.pink : themeColors.cyan,
          undefined,
          0,
        );
        drawOriginalText(
          ctx,
          api,
          `${modelState.ms[i].toFixed(2)} ms exposed startup`,
          1700,
          y - 35,
          31,
          themeColors.yellow,
          'right',
        );
      }),
    );
    drawOriginalText(
      ctx,
      api,
      'Supplied startup times · payload movement and overlap require measurement',
      960,
      975,
      28,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'topology',
  draw: drawTopology,
  cues: ['topology-dependency-chain', 'topology-startup-total', 'topology-physical-grouping'],
};
