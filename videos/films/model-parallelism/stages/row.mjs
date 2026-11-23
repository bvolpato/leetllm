import { W, X } from '../fixtures.mjs';
import { shards } from '../model.mjs';
import { drawOriginalEquation, drawOriginalMatrix, drawOriginalText } from '../defaults.mjs';
export function drawRow(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress2, 0.04, 0.92),
    whole = (currentBeat + phaseForBeat(currentBeat)) / 3;
  const result = shards();
  {
    if (currentBeat < 2) {
      api.focus.target('row-input-coordinate-contributions', () =>
        drawOriginalText(
          ctx,
          api,
          'Input-coordinate contributions',
          960,
          285,
          39,
          themeColors.ink,
          'center',
        ),
      );
      const partials = W.map((row, i) => row.map((v) => v * X[0][i]));
      api.focus.target('row-gpu-0-x-times-row-1', () =>
        drawOriginalText(
          ctx,
          api,
          'GPU 0: x₁ times row 1',
          500,
          405,
          33,
          themeColors.blue,
          'center',
        ),
      );
      api.focus.target('row-gpu-1-x-times-row-2', () =>
        drawOriginalText(
          ctx,
          api,
          'GPU 1: x₂ times row 2',
          1390,
          405,
          33,
          themeColors.cyan,
          'center',
        ),
      );
      const progress = phaseForBeat(1),
        position = progress * 4,
        index = Math.min(3, Math.floor(position)),
        travel = position >= 4 ? 1 : position - index;
      if (currentBeat === 1) {
        const target = {
          x: 820,
          y: 625,
          width: 280,
          height: 90,
        };
        [0, 1].forEach((gpu) => {
          const x = (gpu ? 1120 : 260) + index * 128 + 60,
            edge = gpu ? 1140 : 780,
            col = gpu ? themeColors.cyan : themeColors.blue;
          if (travel > 0 && travel < 0.75)
            api.focus.target('row-readout', () =>
              components.card({
                label: String(partials[gpu][index]),
                x: api.lerp(x, edge, travel / 0.75) - 28,
                y: api.lerp(595, 650, travel / 0.75),
                width: 56,
                height: 42,
                fontSize: 25,
                fill: themeColors.bg,
                stroke: col,
                textColor: col,
                padding: 5,
              }),
            );
          else
            api.path(
              ctx,
              [
                {
                  x,
                  y: 590,
                },
                {
                  x,
                  y: 610,
                },
                {
                  x: edge,
                  y: 670,
                },
              ],
              {
                color: col,
                width: 3,
              },
            );
        });
        api.focus.target('row-readout-2', () =>
          components.card({
            ...target,
            label: `${partials[0][index]} + ${partials[1][index]} = ${travel >= 0.75 ? result.y[index] : '?'}`,
            fontSize: 32,
            fill: themeColors.panel,
            stroke: themeColors.yellow,
            textColor: themeColors.yellow,
            padding: 10,
          }),
        );
        const complete = Math.min(4, Math.floor(position) + Number(travel >= 0.75)),
          visible = result.y.map((v, j) => (j < complete ? v : '·'));
        [0, 1].forEach((gpu) => {
          const x = gpu ? 1120 : 260;
          api.focus.target('row-readout-3', () =>
            drawOriginalText(
              ctx,
              api,
              'GPU ' + gpu + ' · reduced result',
              x + 252,
              790,
              29,
              themeColors.yellow,
              'center',
            ),
          );
          api.focus.target('row-readout-4', () =>
            drawOriginalMatrix(ctx, api, [visible], x, 825, 120, themeColors.yellow, [
              undefined,
              index,
            ]),
          );
        });
        api.focus.target('row-same-coordinate-sums-reach-both-participants', () =>
          drawOriginalText(
            ctx,
            api,
            'Same coordinate sums reach both participants',
            960,
            1000,
            29,
            themeColors.muted,
            'center',
          ),
        );
      } else
        api.focus.target('row-each-vector-is-a-partial-contribution-to-every-output-coordi', () =>
          drawOriginalText(
            ctx,
            api,
            'Each vector is a partial contribution to every output coordinate',
            960,
            825,
            31,
            themeColors.muted,
            'center',
          ),
        );
      api.focus.target('row-readout-5', () =>
        drawOriginalMatrix(
          ctx,
          api,
          [partials[0]],
          260,
          460,
          120,
          themeColors.blue,
          currentBeat === 1 ? [undefined, index] : undefined,
        ),
      );
      api.focus.target('row-readout-6', () =>
        drawOriginalMatrix(
          ctx,
          api,
          [partials[1]],
          1120,
          460,
          120,
          themeColors.cyan,
          currentBeat === 1 ? [undefined, index] : undefined,
        ),
      );
    } else {
      api.focus.target('row-complete-the-sum-before-a-nonlinear-activation', () =>
        drawOriginalText(
          ctx,
          api,
          'Complete the sum before a nonlinear activation',
          960,
          285,
          39,
          themeColors.ink,
          'center',
        ),
      );
      api.focus.target('row-equation', () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\operatorname{ReLU}([3,-2]+[-1,4])=[2,2]`,
          960,
          500,
          48,
          themeColors.green,
          'center',
        ),
      );
      api.focus.target('row-equation-2', () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`\operatorname{ReLU}([3,-2])+\operatorname{ReLU}([-1,4])=[3,4]`,
          960,
          740,
          43,
          themeColors.pink,
          'center',
        ),
      );
    }
  }
}
export default {
  id: 'row',
  draw: drawRow,
  cues: [
    'row-split',
    'incomplete-output',
    'sum-contributions',
    'all-reduce-result',
    'sum-before-relu',
    'complete-relu',
  ],
};
