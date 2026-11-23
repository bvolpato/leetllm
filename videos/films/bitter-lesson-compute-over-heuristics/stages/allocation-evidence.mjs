import { mechanismFocus, mechanismText } from '../defaults.mjs';
export function drawAllocationEvidence(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, 'allocation-evidence-mechanism', () => {
    if (currentBeat === 0) {
      mechanismText(
        ctx,
        api,
        'Build the six-N planning factor',
        960,
        275,
        40,
        themeColors.cyan,
        'center',
      );
      for (let i = 0; i < 6; i++) {
        const x = 270 + i * 250;
        api.rect(ctx, x, 440, 180, 180, i < 2 ? themeColors.blue : themeColors.pink);
        mechanismText(ctx, api, 'N', x + 90, 550, 52, themeColors.bg, 'center');
      }
      mechanismText(ctx, api, 'Forward: about 2N', 520, 755, 37, themeColors.blue, 'center');
      mechanismText(ctx, api, 'Backward: about 4N', 1290, 755, 37, themeColors.pink, 'center');
      mechanismText(
        ctx,
        api,
        'Non-embedding dense approximation · attention terms can matter separately',
        960,
        1010,
        30,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      mechanismText(
        ctx,
        api,
        'Normalized power-law illustration · study fits remain separate',
        960,
        275,
        34,
        themeColors.yellow,
        'center',
      );
      const x = (v) => 310 + v * 290,
        y = (v) => 900 - v * 160;
      api.line(ctx, x(0), y(0), x(4), y(0), themeColors.muted, 3);
      api.line(ctx, x(0), y(0), x(0), y(3.2), themeColors.muted, 3);
      [
        [0.73, 'Kaplan N ∝ C⁰·⁷³', themeColors.blue],
        [0.27, 'Kaplan D ∝ C⁰·²⁷', themeColors.pink],
        [0.5, 'Roughly equal growth', themeColors.green],
      ].forEach(([slope, label, col], i) => {
        api.line(ctx, x(0), y(0), x(4), y(4 * slope), col, 5);
        mechanismText(ctx, api, label, 1480, y(4 * slope) + 20, 29, col);
      });
      mechanismText(ctx, api, 'log compute ratio', 900, 1010, 31, themeColors.muted, 'center');
      mechanismText(
        ctx,
        api,
        'Hoffmann tested >400 models; its fitted methods gave nearby distinct exponents',
        960,
        1070,
        27,
        themeColors.muted,
        'center',
      );
    } else {
      mechanismText(
        ctx,
        api,
        'Chinchilla and Gopher · supplied published allocations',
        960,
        275,
        36,
        themeColors.cyan,
        'center',
      );
      [
        ['Chinchilla', 70, 1400, themeColors.green],
        ['Gopher', 280, 300, themeColors.blue],
      ].forEach(([name, n, d, col], i) => {
        const y = 435 + i * 250;
        mechanismText(ctx, api, name, 250, y, 37, col);
        mechanismText(ctx, api, n + 'B parameters', 810, y, 35, col);
        mechanismText(ctx, api, d + 'B training tokens', 1360, y + 90, 35, col, 'center');
      });
      mechanismText(
        ctx,
        api,
        'Roughly matching training compute does not define every deployment objective',
        960,
        955,
        30,
        themeColors.yellow,
        'center',
      );
      mechanismText(
        ctx,
        api,
        'Longer small-model training can target a fixed serving budget',
        960,
        1040,
        30,
        themeColors.muted,
        'center',
      );
    }
  });
  return;
}
export default {
  id: 'allocation-evidence',
  draw: drawAllocationEvidence,
  cues: ['allocation-evidence-b1', 'allocation-evidence-b2', 'allocation-evidence-b3'],
};
