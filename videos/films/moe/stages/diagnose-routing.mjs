import { mc } from '../arithmetic.mjs';
import { moeCue } from '../construction.mjs';
import { arrow, mechanismLine, mechanismText, rectangle } from '../defaults.mjs';
export function drawDiagnoseRouting(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = mc(state.beatP ?? 0),
    resultComplete = (id) => moeCue(state, id),
    cueProgress = (i) => moeCue(state, 'diagnose-routing-op-' + i, 'progress'),
    cols = [themeColors.blue, themeColors.pink, themeColors.yellow, themeColors.green];
  api.focus.target('mo-diagnose-routing-mechanism', () => {
    const phase = currentBeat;
    mechanismText(
      ctx,
      api,
      ['Residency', 'Learned behavior', 'Critical path'][phase] + ' requires its own evidence',
      960,
      285,
      35,
      themeColors.yellow,
    );
    if (phase === 0) {
      const u = 35;
      rectangle(ctx, api, 250, 440, 38 * u, 130, themeColors.blue);
      rectangle(ctx, api, 250, 720, 14 * u, 100, themeColors.panel, themeColors.pink);
      mechanismText(ctx, api, 'Complete weights: 38 GB', 960, 395, 35, themeColors.blue);
      mechanismText(ctx, api, 'Device: 14 GB', 490, 880, 33, themeColors.pink);
      if (resultComplete('diagnose-pool'))
        mechanismText(
          ctx,
          api,
          'Load-balancing pressure does not remove stored weights',
          960,
          970,
          32,
          themeColors.yellow,
        );
    } else if (phase === 1) {
      [0, 1, 2, 3].forEach((i) => {
        rectangle(ctx, api, 300 + i * 390, 450, 170, 270, themeColors.blue);
        mechanismText(ctx, api, 'E' + i, 385 + i * 390, 780, 32, themeColors.blue);
      });
      mechanismLine(ctx, api, 250, 900, 1600, 900, themeColors.muted);
      arrow(ctx, api, 350, 850, 1450, 950, themeColors.pink);
      mechanismText(
        ctx,
        api,
        'Uniform count bars; supplied answer-quality regression',
        960,
        355,
        31,
        themeColors.yellow,
      );
    } else {
      const names = ['router', 'pack', 'transfer', 'expert', 'combine'],
        w = [140, 190, 400, 430, 170];
      let x = 230;
      for (let i = 0; i < 5; i++) {
        rectangle(ctx, api, x, 500, w[i] - 10, 160, cols[i % 4]);
        mechanismText(ctx, api, names[i], x + w[i] / 2, 740, 28, cols[i % 4]);
        const current = mc(cueProgress(2) * 5 - i);
        mechanismLine(ctx, api, x, 825, x + (w[i] - 10) * current, 825, themeColors.cyan, 8);
        x += w[i];
      }
      mechanismText(
        ctx,
        api,
        'Schematic stage widths; inspect an actual serving trace',
        960,
        940,
        32,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'diagnose-routing',
  draw: drawDiagnoseRouting,
  cues: [
    'mo-diagnose-routing-op-0',
    'mo-diagnose-pool',
    'mo-diagnose-routing-op-1',
    'mo-diagnose-quality',
    'mo-diagnose-routing-op-2',
    'mo-diagnose-trace',
  ],
};
