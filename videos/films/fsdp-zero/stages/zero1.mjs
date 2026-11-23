import { stageSnapshot } from '../model.mjs';
import { drawLedgerEquation, drawStateLedger, text } from '../defaults.mjs';
export function drawZero1(ctx, scene, state, api) {
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
      drawStateLedger(ctx, api, currentBeat, progress, colors, 1, true, false),
    );
    const totals = [8, 5, 3.5, 2];
    const equation = String.raw`2+2+4/4=5`;
    if (stageSnapshot(1, currentBeat, progress).q === 1)
      api.focus.target('rank-total', () =>
        drawLedgerEquation(
          ctx,
          api,
          String.raw`${equation}\quad\text{units per rank}`,
          960,
          1015,
          37,
          themeColors.green,
        ),
      );
    text(ctx, api, `Stage ${1}: ${'optimizer'} shards`, 960, 295, 32, themeColors.ink, 'center');
  }
}
export default {
  id: 'zero1',
  draw: drawZero1,
  cues: ['zero1-b1-1', 'zero1-b2-1', 'zero1-b2-2', 'zero1-b3-1'],
};
