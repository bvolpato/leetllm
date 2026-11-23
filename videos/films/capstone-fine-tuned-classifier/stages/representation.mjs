import { representationSnapshot, sampleModel } from '../construction.mjs';
import { text } from '../defaults.mjs';
export function drawRepresentation(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    modelState = sampleModel(state);
  {
    const z = representationSnapshot(state.beat ?? 0, state.beatP ?? 0),
      cols = [themeColors.blue, themeColors.pink];
    if (state.cues) {
      z.summed ||= state.cues['representation-b1-2'].phase !== 'before';
      z.headVisible ||= state.cues['representation-b1-3'].phase !== 'before';
      z.logitsVisible ||= state.cues['representation-b1-3'].phase !== 'before';
      const normalized = state.cues['representation-b1-4'].phase !== 'before';
      z.weightsVisible ||= normalized;
      z.normalizerVisible ||= normalized;
      z.probabilitiesVisible ||= normalized;
    }
    ['key', 'disabled'].forEach((word, i) => {
      const x = api.lerp(360 + i * 900, 360 + (1 - i) * 900, z.swap),
        y = 285 + (i ? 1 : -1) * 90 * Math.sin(Math.PI * z.swap);
      components.panel({
        x,
        y,
        width: 300,
        height: 110,
        fill: themeColors.panel,
        stroke: cols[i],
      });
      api.focus.target('token-vectors', () =>
        text(ctx, api, word, x + 150, y + 42, 28, cols[i], 'center'),
      );
      if (z.vectorsVisible)
        api.focus.target('token-vectors', () =>
          text(
            ctx,
            api,
            '[' + z.vectors[i].join(', ') + ']',
            x + 150,
            y + 86,
            28,
            cols[i],
            'center',
          ),
        );
    });
    if (z.summed)
      api.focus.target('pooled-vector', () =>
        api.math(
          ctx,
          z.pooledVisible
            ? z.swap > 0.5
              ? 'h=\\frac{[0,2]+[2,0]}{2}=[1,1]'
              : 'h=\\frac{[2,0]+[0,2]}{2}=[1,1]'
            : '[2,0]+[0,2]=[2,2]',
          960,
          550,
          41,
          themeColors.green,
          'center',
        ),
      );
    text(ctx, api, 'Supplied head', 440, 615, 30, themeColors.yellow, 'center');
    text(ctx, api, 'Class logits', 960, 615, 30, themeColors.cyan, 'center');
    text(ctx, api, 'Softmax scores', 1500, 615, 30, themeColors.green, 'center');
    if (z.headVisible) {
      api.focus.target('head-weights', () =>
        components.matrix({
          values: z.weights,
          x: 300,
          y: 665,
          cellSize: 105,
          style: {
            fill: themeColors.panel,
            stroke: themeColors.yellow,
            textColor: themeColors.ink,
            font: 'mono',
          },
        }),
      );
      api.focus.target('head-weights', () =>
        api.math(ctx, 'z=Wh+0', 440, 920, 36, themeColors.yellow, 'center'),
      );
    }
    if (z.logitsVisible) {
      api.focus.target('head-logits', () =>
        api.math(ctx, '1.5(1)+0.5(1)=2', 960, 705, 33, themeColors.blue, 'center'),
      );
      api.focus.target('head-logits', () =>
        api.math(ctx, '0.5(1)+0.5(1)=1', 960, 790, 33, themeColors.pink, 'center'),
      );
    }
    if (z.weightsVisible)
      api.focus.target('softmax-strengths', () =>
        api.math(ctx, 'e^{z-2}\\approx[1,0.368]', 1500, 695, 32, themeColors.cyan, 'center'),
      );
    if (z.normalizerVisible)
      api.focus.target('softmax-normalizer', () =>
        api.math(ctx, 'Z=1+0.368=1.368', 1500, 765, 31, themeColors.yellow, 'center'),
      );
    if (z.probabilitiesVisible) {
      api.focus.target('softmax-probabilities', () =>
        teaching.bars({
          x: 1280,
          y: 825,
          width: 440,
          height: 100,
          values: z.probabilities,
          labels: ['Routine', 'Urgent'],
          colors: [themeColors.blue, themeColors.pink],
          max: 1,
          showValues: true,
          format: (v) => v.toFixed(3),
          fontSize: 25,
          gap: 90,
        }),
      );
    }
  }
}
export default {
  id: 'representation',
  draw: drawRepresentation,
  cues: [
    'representation-b1-1',
    'representation-b1-2',
    'representation-b1-3',
    'representation-b1-4',
    'representation-b2-1',
    'representation-b2-2',
    'representation-b2-3',
  ],
};
