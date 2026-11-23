import { drawLedgerEquation, drawStateLedger } from '../defaults.mjs';
export function drawLedger(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const colors = {
    weights: themeColors.blue,
    gradients: themeColors.pink,
    optimizer: themeColors.yellow,
  };
  {
    api.focus.target('state-ledger', () =>
      drawStateLedger(ctx, api, currentBeat, progress, colors, 0, true),
    );
    if (currentBeat >= 1)
      api.focus.target('ledger-total', () =>
        drawLedgerEquation(
          ctx,
          api,
          String.raw`2+2+4=8\quad\text{units per rank}`,
          960,
          1010,
          37,
          themeColors.yellow,
        ),
      );
  }
}
export default {
  id: 'ledger',
  draw: drawLedger,
  cues: ['ledger-weights', 'ledger-gradients', 'ledger-optimizer', 'ledger-b2-1', 'ledger-b3-1'],
};
