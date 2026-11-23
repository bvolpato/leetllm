import { FORECAST_CUE_AT } from '../fixtures.mjs';
import { forecastCueProgress } from '../construction.mjs';
import { box, extensionText, line, rectangle } from '../defaults.mjs';
import { smoothstep } from 'vizmatic';
export function drawSarimaxContract(ctx, scene, state, api) {
  if (!Object.keys(FORECAST_CUE_AT).some((id) => id.startsWith('fc-sarimax-contract-'))) return;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const cueProgress = (suffix) => forecastCueProgress(state, `fc-${'sarimax-contract'}-${suffix}`);
  const done = (suffix) => cueProgress(suffix) >= 1;
  const lerp = (a, z, p) => a + (z - a) * smoothstep(p);
  api.focus.target('fc-sarimax-contract-mechanism', () => {
    const reg = cueProgress('regressor'),
      diff = cueProgress('difference');
    const vals = [132, 160 - 20 * reg],
      base = 830,
      scale = 2.6;
    vals.forEach((v, i) => {
      const x = 500 + i * 700;
      rectangle(ctx, api, x, base - v * scale, 220, v * scale, themeColors.blue, themeColors.blue);
      extensionText(ctx, api, i ? 'Current Friday' : 'Previous Friday', x + 110, 890, 30);
      extensionText(
        ctx,
        api,
        (i ? 160 : v).toFixed(0),
        x + 110,
        i ? 385 : base - v * scale - 26,
        34,
        themeColors.blue,
      );
    });
    if (reg > 0) {
      rectangle(
        ctx,
        api,
        1200,
        base - 160 * scale,
        220,
        20 * scale * reg,
        themeColors.yellow,
        themeColors.yellow,
      );
      extensionText(ctx, api, 'βx = 20', 1540, 420, 30, themeColors.yellow);
      if (done('regressor')) extensionText(ctx, api, 'u = 140', 1540, 530, 30, themeColors.blue);
    }
    if (done('equation')) extensionText(ctx, api, 'y = βx + u', 960, 330, 40, themeColors.cyan);
    if (diff > 0) {
      line(
        ctx,
        api,
        860,
        base - 132 * scale,
        860,
        lerp(base - 132 * scale, base - 140 * scale, diff),
        themeColors.green,
        8,
      );
      if (diff === 1)
        extensionText(ctx, api, 'Δ₇u = 140 − 132 = 8', 960, 950, 32, themeColors.green);
    }
    if (done('raw')) box(ctx, api, 'Raw Δ₇y = 28', 180, 720, 330, themeColors.pink, 27);
    if (done('future'))
      extensionText(
        ctx,
        api,
        'Supply future regressors that are known at issuance.',
        960,
        285,
        27,
        themeColors.muted,
      );
  });
  return;
}
export default {
  id: 'sarimax-contract',
  draw: drawSarimaxContract,
  cues: [
    'fc-sarimax-contract-equation',
    'fc-sarimax-contract-regressor',
    'fc-sarimax-contract-difference',
    'fc-sarimax-contract-raw',
    'fc-sarimax-contract-future',
  ],
};
