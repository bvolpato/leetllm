import { math, rect, text } from '../defaults.mjs';
export function drawBalancePressure(ctx, scene, state, api) {
  const themeColors = api.C;
  const beat = state.beat ?? 0;
  const bp = api.clamp(state.beatP ?? 0, 0, 1);
  const stage = (index, from = 0.06, until = 0.9) =>
    beat < index ? 0 : beat > index ? 1 : api.phase(bp, from, until);
  const colors = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  const fade = api.components.fade;
  {
    const f = [0.6, 0.2, 0.15, 0.05],
      p = [0.55, 0.22, 0.15, 0.08];
    const products = api.focus.progress('frequency-probability', stage(0, 0.1, 0.85)),
      gradient = state.cues
        ? api.focus.progress('probability-gradient', 0) > 0
          ? 1
          : 0
        : stage(1, 0.12, 0.85),
      quality = state.cues
        ? api.focus.progress('task-objective', 0) > 0
          ? 1
          : 0
        : stage(2, 0.08, 0.85);
    api.focus.target('balance-pressure-switch-top-1-batch', () =>
      text(ctx, api, 'SWITCH TOP-1 BATCH', 960, 265, 30, themeColors.muted, 'center'),
    );
    for (let i = 0; i < 4; i += 1) {
      const x = 270 + i * 420;
      api.focus.target('balance-pressure-readout', () =>
        text(ctx, api, `E${i + 1}`, x, 340, 38, colors[i], 'center'),
      );
      const box = rect(ctx, api, x - 140, 390, 280, 260, themeColors.bg, '#8d9cb944', 0);
      api.container(
        ctx,
        box,
        () => {
          const w = f[i] * 400,
            h = p[i] * 400;
          api.focus.target('assignment-products', () => {
            rect(ctx, api, x - 120, 625 - h, w, h, themeColors.panel, colors[i], 0);
            fade(products, () =>
              rect(ctx, api, x - 120, 625 - h, w, h, `${colors[i]}99`, undefined, 0),
            );
          });
        },
        {
          padding: 12,
        },
      );
      api.focus.target('balance-pressure-readout-2', () =>
        text(ctx, api, `f = ${f[i].toFixed(2)}`, x, 705, 28, colors[i], 'center', 'mono'),
      );
      api.focus.target('balance-pressure-readout-3', () =>
        text(ctx, api, `p = ${p[i].toFixed(2)}`, x, 755, 28, colors[i], 'center', 'mono'),
      );
      fade(gradient, () => {
        const h = (80 * f[i]) / f[0];
        api.focus.target('probability-gradient', () =>
          api.arrow(ctx, x + 110, 425, x + 110, 425 + h, themeColors.red, 4),
        );
      });
    }
    api.focus.target('balance-pressure-readout-4', () =>
      math(
        ctx,
        api,
        String.raw`\mathcal L_{\rm balance}=\alpha N\sum_i f_i p_i`,
        580,
        865,
        48,
        themeColors.ink,
        'center',
      ),
    );
    api.focus.target('balance-pressure-1-602', () =>
      text(ctx, api, 'Common product-area scale', 1470, 865, 28, themeColors.muted, 'center'),
    );
    fade(quality, () => {
      api.focus.target('balance-pressure-task-loss-balance-pressure', () =>
        text(ctx, api, 'task loss  +  balance pressure', 520, 960, 32, themeColors.cyan, 'center'),
      );
      api.focus.target('balance-pressure-uniform-reference', () =>
        text(ctx, api, 'uniform reference: α', 1450, 960, 30, themeColors.muted, 'center'),
      );
    });
  }
}
export default {
  id: 'balance-pressure',
  draw: drawBalancePressure,
  cues: [
    'frequency-probability',
    'rectangle-products',
    'probability-gradient',
    'concentration-pressure',
    'task-objective',
    'uniform-reference',
  ],
};
