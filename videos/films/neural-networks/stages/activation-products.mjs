import { activations } from '../fixtures.mjs';
import { neuralFrame } from '../construction.mjs';
import {
  arrow,
  axes,
  curve,
  equation,
  focusTarget,
  formatNumber,
  head,
  note,
  pill,
  text,
} from '../defaults.mjs';
export function drawActivationProducts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'activation-products-mechanism', () => {
    if (currentBeat < 2) {
      head(
        ctx,
        api,
        currentBeat === 0
          ? 'Each local derivative is a multiplier'
          : 'Preserve signs through sensitivity × slope × feature',
      );
      if (currentBeat === 0) {
        const n = Math.floor(cueProgress('activation-products-beat-0', 0) * 6),
          plot = axes(ctx, api, {
            x: 270,
            y: 510,
            width: 1000,
            height: 200,
            xDomain: [0, 6],
            yDomain: [0, 1.1],
            xTicks: [0, 1, 2, 3, 4, 5, 6],
            yTicks: [0, 0.25, 1],
            xLabel: 'number of repeated local multipliers',
          });
        curve(ctx, api, plot, (x) => 0.25 ** x, 0, n, themeColors.blue);
        curve(ctx, api, plot, () => 1, 0, n, themeColors.cyan);
        text(ctx, api, 'sigmoid maximum 1/4', 1520, 460, 29, themeColors.blue, 'center');
        text(ctx, api, 'tanh maximum 1', 1520, 610, 29, themeColors.cyan, 'center');
        equation(ctx, api, String.raw`g\prod_i a_i\prime(z_i)`, 960, 885, 49, themeColors.yellow);
      } else {
        const rows = [
          ['ReLU', 0],
          ['GELU', activations.GELU.derivative(-1)],
          ['SiLU', activations.SiLU.derivative(-1)],
        ];
        text(
          ctx,
          api,
          'input sensitivity −2 · local input z = −1',
          960,
          350,
          33,
          themeColors.ink,
          'center',
        );
        rows.forEach(([key, slope], i) => {
          const y = 465 + i * 145;
          text(
            ctx,
            api,
            key,
            280,
            y,
            33,
            [themeColors.yellow, themeColors.cyan, themeColors.pink][i],
          );
          pill(ctx, api, '−2', 570, y - 10, 160, themeColors.ink);
          text(
            ctx,
            api,
            '× ' + formatNumber(ctx, api, slope, 4),
            850,
            y,
            31,
            themeColors.blue,
            'center',
          );
          arrow(ctx, api, 1010, y - 10, 1160, y - 10, themeColors.muted);
          pill(
            ctx,
            api,
            resultComplete('activation-products-beat-1', 1)
              ? formatNumber(ctx, api, -2 * slope, 4)
              : '?',
            1360,
            y - 10,
            280,
            themeColors.yellow,
          );
        });
        if (S('activation-signed-products', 1))
          equation(
            ctx,
            api,
            String.raw`\frac{\partial L}{\partial w_j}=\frac{\partial L}{\partial z}x_j\quad (x_j<0\ \text{can reverse sign})`,
            960,
            960,
            37,
            themeColors.cyan,
          );
      }
    } else if (currentBeat === 3) {
      const u = [1, -2],
        v = [3, -1];
      const active = u.map(activations.SiLU.value);
      const product = active.map((a, i) => a * v[i]);
      const vectorLabel = (values) =>
        '[' + values.map((n) => n.toFixed(3).replace('-', '−')).join(', ') + ']';
      const activeReady = resultComplete('nn-swiglu-activation', 3);
      const paired = S('match-coordinates', 3);
      const productReady = resultComplete('swiglu-product-values', 3);
      text(ctx, api, 'Projection u = [1, −2]', 570, 300, 38, themeColors.cyan, 'center');
      text(ctx, api, 'Projection v = [3, −1]', 1350, 300, 38, themeColors.blue, 'center');
      pill(
        ctx,
        api,
        activeReady ? vectorLabel(active) : 'SiLU(u)',
        570,
        435,
        540,
        themeColors.cyan,
        40,
      );
      pill(ctx, api, '[3, −1]', 1350, 435, 540, themeColors.blue, 40);
      if (paired) {
        product.forEach((_, i) => {
          const x = 570 + 780 * i;
          text(ctx, api, 'Coordinate ' + (i + 1), x, 570, 32, themeColors.muted, 'center');
          equation(
            ctx,
            api,
            '(' + active[i].toFixed(3) + ')(' + v[i] + ')',
            x,
            650,
            52,
            themeColors.ink,
          );
          arrow(ctx, api, x, 713, x + (i ? -170 : 170), 772, themeColors.muted, 3);
        });
      }
      if (productReady) {
        text(ctx, api, 'r =', 620, 849, 41, themeColors.yellow, 'right');
        pill(ctx, api, vectorLabel(product), 960, 835, 580, themeColors.yellow, 43);
      }
      if (resultComplete('nn-swiglu-output', 3))
        equation(
          ctx,
          api,
          '0.5r_1-r_2' + '\\approx' + (0.5 * product[0] - product[1]).toFixed(3),
          960,
          979,
          47,
          themeColors.green,
        );
    } else {
      head(ctx, api, 'Two projections are distinct operands in SwiGLU');
      const values = ['u = xW', 'v = xV'];
      pill(ctx, api, values[0], 450, 420, 550, themeColors.cyan, 37);
      pill(ctx, api, values[1], 1450, 420, 550, themeColors.blue, 37);
      arrow(ctx, api, 450, 470, 450, 585);
      pill(ctx, api, 'SiLU(u)', 450, 650, 550, themeColors.cyan, 36);
      arrow(ctx, api, 450, 705, 960, 795);
      arrow(ctx, api, 1450, 470, 960, 795, themeColors.blue);
      pill(ctx, api, 'SiLU(u) ⊙ v', 960, 820, 600, themeColors.yellow, 37);
      equation(
        ctx,
        api,
        String.raw`x\mapsto(\operatorname{SiLU}(xW)\odot xV)W_{\rm out}`,
        960,
        960,
        42,
        themeColors.ink,
      );
      note(
        ctx,
        api,
        'Chosen two-coordinate vectors · an activation alone is not the complete gated block.',
      );
    }
    return;
  });
}
export default {
  id: 'activation-products',
  draw: drawActivationProducts,
  cues: [
    'activation-products-beat-0',
    'activation-products-beat-1',
    'activation-signed-products',
    'activation-products-beat-2',
    'activation-products-beat-3',
    'swiglu-product-values',
    'nn-swiglu-activation',
    'match-coordinates',
    'nn-swiglu-output',
  ],
};
