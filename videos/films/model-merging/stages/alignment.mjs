import { evaluateNeurons } from '../arithmetic.mjs';
import { permutationExample } from '../fixtures.mjs';
import { after, progress as cueProgress } from '../decisions.mjs';
import { alignmentSnapshot } from '../model.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawAlignment(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.05, 0.93);
  {
    if (currentBeat === 0) {
      const base = api.focus.target('common-base', () =>
        card(ctx, api, 'Shared base checkpoint', 640, 340, 640, themeColors.yellow),
      );
      const a = card(ctx, api, 'Code fine-tune', 290, 640, 480, themeColors.blue),
        bb = card(ctx, api, 'Math fine-tune', 1150, 640, 480, themeColors.pink);
      api.connect(ctx, base, a, {
        color: themeColors.blue,
        gap: 20,
      });
      api.connect(ctx, base, bb, {
        color: themeColors.pink,
        gap: 20,
      });
      components.fade(phaseForBeat(0), () => {
        equation(ctx, api, String.raw`W_A=W_0+\Delta_A`, 520, 835, 42, themeColors.blue);
        equation(ctx, api, String.raw`W_B=W_0+\Delta_B`, 1400, 835, 42, themeColors.pink);
      });
      text(
        ctx,
        api,
        'A tensor index refers to a particular learned channel',
        960,
        935,
        30,
        themeColors.muted,
        'center',
      );
    } else {
      const example = permutationExample();
      const current = alignmentSnapshot(
          currentBeat,
          progress,
          cueProgress(state, 'alignment-b2-1'),
        ),
        reorder = current.reorder;
      equation(
        ctx,
        api,
        String.raw`f(x)=\sum_{j=0}^{1}v_j\max(0,w_jx)`,
        960,
        280,
        38,
        themeColors.yellow,
      );
      const table = (x, model, name, moving = false) => {
        components.panel(
          {
            x,
            y: 350,
            width: 750,
            height: 405,
            fill: themeColors.panel,
            stroke: themeColors.muted,
            padding: 12,
          },
          () => {
            text(ctx, api, name, x + 375, 407, 29, themeColors.ink, 'center');
            text(ctx, api, 'slot', x + 40, 478, 25, themeColors.muted, 'center');
            text(
              ctx,
              api,
              'input w → neuron → output v',
              x + 375,
              478,
              25,
              themeColors.muted,
              'center',
            );
            [0, 1].forEach((i) =>
              text(ctx, api, String(i), x + 40, 573 + i * 130, 26, themeColors.muted, 'center'),
            );
            const pairs = moving
              ? current.pairs
              : model.input.map((input, i) => ({
                  input,
                  output: model.output[i],
                  x: x + 375,
                  y: 561 + i * 130,
                }));
            pairs.forEach((pair) => {
              const color = pair.input > 0 ? themeColors.blue : themeColors.pink,
                y = pair.y - 32;
              const input = api.focus.target('neuron-weights', () =>
                components.card({
                  label: 'w=' + (pair.input > 0 ? '+1' : '−1'),
                  x: pair.x - 125,
                  y,
                  width: 85,
                  height: 64,
                  fontSize: 24,
                  padding: 6,
                  fill: themeColors.panel,
                  stroke: color,
                  textColor: color,
                }),
              );
              const output = api.focus.target('neuron-weights', () =>
                components.card({
                  label: 'v=' + pair.output,
                  x: pair.x + 40,
                  y,
                  width: 85,
                  height: 64,
                  fontSize: 25,
                  padding: 6,
                  fill: themeColors.panel,
                  stroke: color,
                  textColor: color,
                }),
              );
              const neuron = api.focus.target('permutation-neurons', () =>
                api.circle(ctx, pair.x, pair.y, 22, themeColors.panel, color, 3),
              );
              text(ctx, api, pair.input > 0 ? '+' : '−', pair.x, pair.y + 8, 24, color, 'center');
              api.connect(ctx, input, neuron, {
                color,
                width: 2,
                gap: 4,
              });
              api.connect(ctx, neuron, output, {
                color,
                width: 2,
                gap: 4,
              });
            });
          },
        );
      };
      table(130, example.a, 'Model A · canonical channel order');
      table(
        1040,
        current.displayedB,
        reorder === 0
          ? 'Model B · same function, swapped channels'
          : reorder === 1
            ? 'Model B · channel identities aligned'
            : 'Model B · reordering complete neurons',
        true,
      );
      text(
        ctx,
        api,
        'Test inputs x = −1, +1 · move input and output weights together',
        960,
        815,
        28,
        themeColors.muted,
        'center',
      );
      const result = (model) => [-1, 1].map((x) => evaluateNeurons(model, x)).join(', ');
      components.card({
        label: `A and B outputs: [${current.outputs.join(', ')}]`,
        x: 130,
        y: 855,
        width: 510,
        height: 92,
        fontSize: 27,
        padding: 12,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.blue,
      });
      if (currentBeat > 1 || after(state, 'naive-output'))
        components.card({
          label: `Before alignment\naverage outputs: [${result(example.naive)}]`,
          x: 705,
          y: 855,
          width: 510,
          height: 92,
          fontSize: 25,
          baselineOffset: -9,
          padding: 12,
          fill: themeColors.panel,
          stroke: themeColors.pink,
          textColor: themeColors.pink,
        });
      if (current.alignedAverage)
        api.focus.target('aligned-output', () =>
          components.card({
            label: `After alignment\naverage outputs: [${result(current.alignedAverage)}]`,
            x: 1280,
            y: 855,
            width: 510,
            height: 92,
            fontSize: 25,
            baselineOffset: -9,
            padding: 12,
            fill: themeColors.panel,
            stroke: themeColors.green,
            textColor: themeColors.green,
          }),
        );
    }
  }
}
export default {
  id: 'alignment',
  draw: drawAlignment,
  cues: ['alignment-b1-1', 'naive-output', 'alignment-b2-1', 'alignment-b3-1'],
};
