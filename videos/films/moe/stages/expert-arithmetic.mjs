import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import {
  arrow,
  footer,
  matrix,
  mechanismLine,
  mechanismMath,
  mechanismText,
  rectangle,
  tag,
} from '../defaults.mjs';
export function drawExpertArithmetic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-expert-arithmetic-mechanism', () => {
    const swiglu = currentBeat > 0;
    mechanismText(
      ctx,
      api,
      swiglu ? 'SwiGLU: two parallel H→I projections, then I→H' : 'Two-projection FFN: H→I→H',
      960,
      290,
      35,
      themeColors.yellow,
    );
    matrix(ctx, api, cols, [['x0'], ['x1'], ['x2']], 180, 470, 80, [themeColors.cyan]);
    const blocks = swiglu
      ? [
          {
            x: 470,
            y: 390,
            label: 'gate H×I',
            c: themeColors.blue,
          },
          {
            x: 470,
            y: 700,
            label: 'up H×I',
            c: themeColors.pink,
          },
          {
            x: 1250,
            y: 540,
            label: 'down I×H',
            c: themeColors.yellow,
          },
        ]
      : [
          {
            x: 470,
            y: 400,
            label: 'H×I',
            c: themeColors.blue,
          },
          {
            x: 940,
            y: 400,
            label: 'I×H',
            c: themeColors.pink,
          },
        ];
    for (const { x, y, label, c } of blocks) {
      rectangle(ctx, api, x, y, 300, 180, themeColors.panel, c);
      for (let j = 0; j < 6; j++) mechanismLine(ctx, api, x + 50 * j, y, x + 50 * j, y + 180, c, 1);
      for (let j = 0; j < 4; j++) mechanismLine(ctx, api, x, y + 45 * j, x + 300, y + 45 * j, c, 1);
      mechanismText(ctx, api, label, x + 150, y - 25, 33, c);
    }
    if (swiglu) {
      api.path(
        ctx,
        [
          {
            x: 270,
            y: 590,
          },
          {
            x: 350,
            y: 590,
          },
          {
            x: 350,
            y: 480,
          },
          {
            x: 470,
            y: 480,
          },
        ],
        {
          color: themeColors.cyan,
          width: 3,
        },
      );
      api.path(
        ctx,
        [
          {
            x: 350,
            y: 590,
          },
          {
            x: 350,
            y: 790,
          },
          {
            x: 470,
            y: 790,
          },
        ],
        {
          color: themeColors.cyan,
          width: 3,
        },
      );
      arrow(ctx, api, 770, 480, 800, 480, themeColors.blue);
      tag(ctx, api, 'SiLU', 870, 480, 140, themeColors.blue);
      api.path(
        ctx,
        [
          {
            x: 940,
            y: 480,
          },
          {
            x: 1035,
            y: 480,
          },
          {
            x: 1035,
            y: 600,
          },
        ],
        {
          color: themeColors.blue,
          width: 4,
        },
      );
      api.path(
        ctx,
        [
          {
            x: 770,
            y: 790,
          },
          {
            x: 1035,
            y: 790,
          },
          {
            x: 1035,
            y: 690,
          },
        ],
        {
          color: themeColors.pink,
          width: 4,
        },
      );
      rectangle(ctx, api, 960, 600, 150, 90, themeColors.panel, themeColors.cyan);
      mechanismMath(ctx, api, String.raw`\odot`, 1035, 658, 45, themeColors.cyan);
      arrow(ctx, api, 1110, 645, 1250, 645, themeColors.cyan);
      arrow(ctx, api, 1550, 645, 1720, 645, themeColors.yellow);
      mechanismText(ctx, api, 'SiLU(gate) ⊙ up', 1035, 855, 34, themeColors.yellow);
    } else {
      arrow(ctx, api, 270, 590, 470, 490, themeColors.cyan);
      arrow(ctx, api, 800, 490, 920, 490, themeColors.cyan);
    }
    if (resultComplete(swiglu ? 'swiglu-work' : 'ffn-work'))
      mechanismMath(
        ctx,
        api,
        swiglu ? '3(2THI)=6THI' : '2(2THI)=4THI',
        960,
        945,
        47,
        themeColors.cyan,
      );
    else if (resultComplete('projection-work'))
      mechanismMath(
        ctx,
        api,
        String.raw`2THI\;\mathrm{FLOPs\ per\ projection}`,
        960,
        945,
        43,
        themeColors.cyan,
      );
    footer(
      ctx,
      api,
      'Multiply-add counts as two FLOPs; elementwise work omitted and widths must be compared.',
    );
  });
}
export default {
  id: 'expert-arithmetic',
  draw: drawExpertArithmetic,
  cues: [
    'mo-expert-arithmetic-op-0',
    'mo-projection-work',
    'mo-ffn-work',
    'mo-expert-arithmetic-op-1',
    'mo-swiglu-work',
    'mo-expert-arithmetic-op-2',
  ],
};
