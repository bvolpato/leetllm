import { afterCue, sampleModel } from '../construction.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawContracts(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors, teaching: teaching } = api,
      modelState = sampleModel('contracts', state),
      currentBeat = modelState.b;
    {
      const names = ['Tensor layout', 'Causal mask', 'Return structure'];
      const values = modelState.gates[0]
        ? ['t0h0=10', 't0h1=100', 't1h0=20', 't1h1=200']
        : ['t0h0=10', 't1h0=20', 't0h1=100', 't1h1=200'];
      teaching.grid({
        x: 250,
        y: 285,
        width: 1400,
        height: 75,
        rows: 1,
        columns: 4,
        labels: [values],
        fontSize: 26,
        textColor: themeColors.ink,
        fill: themeColors.panel,
        stroke: modelState.gates[0] ? themeColors.green : themeColors.pink,
      });
      names.forEach((name, i) => {
        api.focus.target('contracts-name', () =>
          drawOriginalCard(
            ctx,
            api,
            name,
            170 + i * 560,
            400,
            460,
            modelState.gates[i] ? themeColors.green : themeColors.pink,
            110,
          ),
        );
        drawOriginalText(
          ctx,
          api,
          modelState.gates[i] ? 'matched' : 'mismatch',
          400 + i * 560,
          620,
          35,
          modelState.gates[i] ? themeColors.green : themeColors.pink,
          'center',
        );
      });
      drawOriginalText(
        ctx,
        api,
        modelState.ready ? 'Layout, mask and return match' : 'Repair caller contract',
        960,
        770,
        42,
        modelState.ready ? themeColors.green : themeColors.pink,
        'center',
      );
      if (currentBeat < 2) return;
      const sized = afterCue(state, 2, 'fa-contract-size');
      api.focus.target('contracts-fallback-budget', () =>
        drawOriginalText(
          ctx,
          api,
          sized ? `Hold fallback: ${modelState.fallbackGiB} GiB of scores > ${modelState.budgetGiB} GiB available`
            : `Materialize scores?   Score-buffer allowance: ${modelState.budgetGiB} GiB`,
          960,
          910,
          33,
          themeColors.yellow,
          'center',
        ),
      );
      api.focus.target('contracts-fallback-budget', () =>
        drawOriginalEquation(
          ctx,
          api,
          String.raw`8\cdot32\cdot8192^2\cdot2/2^{30}` + (sized ? String.raw`=32\ \mathrm{GiB}` : String.raw`=\ ?\ \mathrm{GiB}`),
          960,
          995,
          31,
          themeColors.yellow,
        ),
      );
    }
  });
}
export default {
  id: 'contracts',
  draw: drawContracts,
  cues: [
    'contracts-beat-1-focus-1',
    'fa-contracts-0',
    'contracts-beat-2-focus-1',
    'fa-contracts-1',
    'fa-contract-layout',
    'fa-contract-rest',
    'fa-contract-ready',
    'contracts-fallback-workspace',
    'fa-contract-size',
    'fa-contracts-2',
  ],
};
