import { event } from '../construction.mjs';
import { arrow, axes, card, centeredText, footer } from '../defaults.mjs';
export function drawElmoLayers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat);
  const fmt = (v) => (Math.abs(v) < 1e-10 ? '0' : Number(v.toFixed(3)).toString());
  api.focus.target('elmo-layers-mechanism', () => {
    if (currentBeat === 0) {
      centeredText(
        ctx,
        api,
        'Same positions · separate forward and backward recurrence',
        960,
        285,
        33,
        themeColors.ink,
      );
      ['charge', 'the', 'phone'].forEach((word, i) => {
        card(ctx, api, word, 400 + i * 420, 380, 300, themeColors.blue);
        for (const [r, color] of [
          [0, themeColors.cyan],
          [1, themeColors.pink],
        ]) {
          card(ctx, api, '512', 400 + i * 420, 530 + r * 150, 300, color, 85);
          if (i < 2) {
            const from = r ? 820 + i * 420 : 700 + i * 420,
              to = r ? 700 + i * 420 : 820 + i * 420;
            arrow(ctx, api, from, 570 + r * 150, to, 570 + r * 150, color);
          }
        }
      });
      centeredText(
        ctx,
        api,
        ev('elmo-duplicate', 0) > 0 ? 'h0: [CNN512, CNN512] → 1024' : 'character CNN → 512',
        960,
        875,
        36,
        themeColors.yellow,
      );
      centeredText(
        ctx,
        api,
        ev('elmo-concatenate', 0) > 0
          ? 'h1 and h2: [forward512, backward512] → 1024'
          : 'two contextual layer levels retain the token position',
        960,
        955,
        30,
        themeColors.muted,
      );
    } else {
      const layers =
          currentBeat === 2 && ev('elmo-change', 2) > 0
            ? [
                [0, 1],
                [1, 0],
                [0.5, 0.5],
              ]
            : [
                [1, 0],
                [0, 1],
                [1, 1],
              ],
        gamma = 1 + ev('elmo-gamma', 1),
        weights = [0.2, 0.3, 0.5],
        a = axes(ctx, api, 180, 400, 590, 440, [-0.1, 1.8], [-0.1, 1.8], [0, 0.5, 1, 1.5]),
        progress = currentBeat === 1 ? ev('elmo-mixture', 1) : ev('elmo-example', 2);
      centeredText(
        ctx,
        api,
        'Two-coordinate layer arithmetic · fixed task weights',
        960,
        285,
        33,
        themeColors.yellow,
      );
      api.teaching.vectorAccumulation({
        plot: a,
        terms: layers.map((values, i) => ({
          id: 'layer-' + i,
          label: 'h' + i,
          weight: weights[i] * gamma,
          values,
          color: [themeColors.blue, themeColors.cyan, themeColors.pink][i],
        })),
        progress,
        ledger: {
          x: 1020,
          y: 415,
          width: 750,
          height: 420,
        },
        fontSize: 30,
        color: themeColors.green,
        restColor: themeColors.muted,
        revealTotal: progress === 1,
        totalLabel: 'γ × layer mix',
        format: fmt,
      });
      centeredText(
        ctx,
        api,
        'task weights [0.2, 0.3, 0.5] · γ ' + fmt(gamma),
        1330,
        935,
        31,
        themeColors.ink,
      );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Changing token states changes the output under the same shared layer weights'
          : 'Layer weighting is not token-to-token attention',
      );
    }
  });
}
export default {
  id: 'elmo-layers',
  draw: drawElmoLayers,
  cues: [
    'emb-elmo-recurrent',
    'emb-elmo-duplicate',
    'emb-elmo-concatenate',
    'emb-elmo-mixture',
    'emb-elmo-gamma',
    'emb-elmo-example',
    'emb-elmo-change',
  ],
};
