import { binomialMasses } from '../arithmetic.mjs';
import { cueProgress, resultOrOperation } from '../model.mjs';
import { legacyEquation, legacyText, mark, nullBars } from '../defaults.mjs';
export function drawPValue(ctx, scene, state, api) {
  const themeColors = api.C,
    currentBeat = state.beat ?? 0,
    cp = (id, beat, a, z) => cueProgress(state, id, beat, a, z),
    on = (id, beat) => resultOrOperation(state, id, beat);
  {
    const tail = cp('tail-sum', 0),
      mir = cp('tail-mirror', 1);
    nullBars(ctx, api, {
      tail: tail > 0,
      mirror: mir > 0 && !on('tail-return', 1),
      cutoff: 8,
      tailCount: Math.ceil(tail * 6),
      id: 'tail-bars',
    });
    const masses = binomialMasses(13);
    const width = (1480 - 13 * 20) / 14;
    const center = 210 + 8 * (width + 20) + width / 2;
    mark(api, 'observed-boundary', () => {
      legacyText(ctx, api, 'Observed   8 B wins', center, 335, 35, themeColors.yellow, 'center');
      api.line(
        ctx,
        center,
        359,
        center,
        725 - (335 * masses[8]) / 0.24 - 12,
        themeColors.yellow,
        3,
      );
    });
    if (!on('tail-result', 0)) {
      const mass = masses.slice(8, 8 + Math.ceil(6 * tail)).reduce((a, v) => a + v, 0);
      mark(api, 'tail-result', () =>
        legacyText(
          ctx,
          api,
          Math.round(mass * 8192).toLocaleString('en-US') + ' highlighted assignments out of 8,192',
          960,
          890,
          36,
          themeColors.ink,
          'center',
        ),
      );
    }
    if (on('tail-result', 0))
      mark(api, 'tail-result', () =>
        legacyEquation(
          ctx,
          api,
          mir > 0 && !on('tail-return', 1)
            ? String.raw`p_{two}=4760/8192\approx0.581`
            : String.raw`P_0(W\geq8)=2380/8192\approx0.291`,
          960,
          890,
          44,
          themeColors.yellow,
        ),
      );
    mark(api, 'mirror-tail', () =>
      legacyText(
        ctx,
        api,
        mir > 0 && !on('tail-return', 1)
          ? 'Two-sided question: W ≤ 5 or W ≥ 8'
          : 'Direction fixed before the data',
        960,
        980,
        30,
        mir ? themeColors.pink : themeColors.muted,
        'center',
      ),
    );
    if (on('tail-return', 1))
      mark(api, 'tail-plan', () =>
        legacyText(ctx, api, 'Retain the one-sided plan', 960, 270, 26, themeColors.cyan, 'center'),
      );
  }
}
export default {
  id: 'p-value',
  draw: drawPValue,
  cues: ['tail-observed', 'tail-sum', 'tail-result', 'tail-mirror', 'tail-return'],
};
