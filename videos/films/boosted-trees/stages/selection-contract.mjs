import { boostCue } from '../construction.mjs';
import { arrow, cellText, dot, footer, heading, line, outlineBox } from '../defaults.mjs';
export function drawSelectionContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const K = (id, beat = currentBeat) => boostCue(state, id, beat) === 1;
  const S = (id, beat = currentBeat) =>
    state.cues?.[id]
      ? state.cues[id].phase !== 'before'
      : (state.beat ?? 0) > beat || ((state.beat ?? 0) === beat && progress > 0.15);
  api.focus.target('selection-contract-model', () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'How many trees did April select?');
      for (let i = 0; i < 160; i++) {
        const x = 265 + (i % 40) * 34,
          y = 410 + Math.floor(i / 40) * 64;
        api.rect(ctx, x, y, 21, 38, i < 50 ? themeColors.blue : themeColors.grid);
      }
      cellText(
        ctx,
        api,
        'blue: selected 50 · dim: other trained stages',
        960,
        690,
        themeColors.muted,
        25,
      );
      cellText(ctx, api, 'all 160 search stages trained', 960, 750, themeColors.ink, 33);
      if (S('selection-refit', 0)) {
        arrow(ctx, api, 960, 770, 960, 825, themeColors.yellow, 5);
        cellText(ctx, api, 'refit 50 stages on Jan–Mar', 960, 900, themeColors.yellow, 35);
      }
      footer(
        ctx,
        api,
        'Fixed depth 2, learning rate 0.05, seed 11. April selects the minimum; the last 110 stages already consumed training work.',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Validation loss across four trained stages');
      const losses = [0.62, 0.58, 0.59, 0.58];
      const minimum = Math.min(...losses);
      const first = losses.indexOf(minimum);
      const chosen = K('gbt-selection-tie', 1);
      const scan = (losses.length - 1) * boostCue(state, 'selection-contract-step-2', 1);
      const x = (i) => 360 + i * 400;
      const y = (loss) => 705 - (loss - minimum) * 6100;
      if (chosen) line(ctx, api, x(first), y(minimum), x(3), y(minimum), themeColors.muted, 2);
      losses.forEach((loss, i) => {
        if (i < losses.length - 1 && scan > i) {
          const fraction = Math.min(1, scan - i);
          const next = loss + fraction * (losses[i + 1] - loss);
          line(ctx, api, x(i), y(loss), x(i + fraction), y(next), themeColors.blue, 6);
        }
        const color = chosen && i === first ? themeColors.yellow : themeColors.blue;
        dot(ctx, api, x(i), y(loss), color, 17);
        cellText(ctx, api, loss.toFixed(2), x(i), y(loss) - 45, color, 51);
        cellText(ctx, api, 'Stage ' + (i + 1), x(i), 823, themeColors.ink, 35);
        if (chosen && loss === minimum)
          cellText(ctx, api, i === first ? 'first minimum' : 'later tie', x(i), 908, color, 34);
      });
    } else {
      heading(ctx, api, 'A new fitting set creates a different candidate binding');
      const changed = S('selection-invalid', 2);
      outlineBox(ctx, api, 290, 410, 500, 290, themeColors.blue);
      cellText(ctx, api, 'M(Jan–Mar)', 540, 490, themeColors.blue, 34);
      cellText(ctx, api, 'frozen April cutoff', 540, 610, themeColors.cyan, 29);
      arrow(ctx, api, 830, 560, 1080, 560, themeColors.yellow, 4);
      outlineBox(ctx, api, 1130, 410, 540, 290, changed ? themeColors.pink : themeColors.muted);
      cellText(
        ctx,
        api,
        changed ? 'M(Jan–Mar + April)' : 'proposed refit',
        1400,
        490,
        changed ? themeColors.pink : themeColors.muted,
        31,
      );
      cellText(
        ctx,
        api,
        changed ? 'old cutoff evidence invalid' : 'candidate identity ?',
        1400,
        610,
        changed ? themeColors.pink : themeColors.muted,
        27,
      );
      if (changed) {
        line(ctx, api, 1000, 515, 930, 610, themeColors.pink, 5);
        line(ctx, api, 930, 515, 1000, 610, themeColors.pink, 5);
      }
      cellText(ctx, api, 'May remains outside every selection', 960, 880, themeColors.yellow, 33);
      footer(ctx, api, 'A separate justified refit/policy design requires its own evidence.');
    }
  });
}
export default {
  id: 'selection-contract',
  draw: drawSelectionContract,
  cues: [
    'selection-contract-step-1',
    'selection-refit',
    'selection-contract-step-2',
    'gbt-selection-tie',
    'selection-contract-step-3',
    'selection-invalid',
  ],
};
