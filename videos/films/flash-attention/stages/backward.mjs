import { SCORES, VALUES } from '../fixtures.mjs';
import { summarize } from '../model.mjs';
import {
  drawOriginalFlashCard,
  drawOriginalFlashEquation,
  drawOriginalFlashText,
} from '../defaults.mjs';
export function drawBackward(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.04, 0.92);
  const total = summarize(SCORES, VALUES),
    a = summarize([1, 2], [10, 20]),
    beta = Math.exp(-1),
    out = total.u / total.l;
  {
    const lse = total.m + Math.log(total.l);
    api.focus.target('backward-readout', () =>
      drawOriginalFlashCard(
        ctx,
        api,
        'Saved row LSE = ' + lse.toFixed(4),
        350,
        365,
        1200,
        themeColors.blue,
      ),
    );
    api.focus.target('backward-equation', () =>
      drawOriginalFlashEquation(
        ctx,
        api,
        String.raw`P_j=e^{s_j-\mathrm{LSE}}`,
        960,
        575,
        59,
        themeColors.cyan,
        'center',
      ),
    );
    const score = Math.min(3, 1 + Math.floor((3 * (currentBeat + phaseForBeat(currentBeat))) / 3));
    api.focus.target('backward-equation-2', () =>
      drawOriginalFlashEquation(ctx, api, 's_j=' + score, 550, 745, 48, themeColors.blue, 'center'),
    );
    api.focus.target('backward-readout-2', () =>
      drawOriginalFlashCard(
        ctx,
        api,
        'Reconstructed p = ' + Math.exp(score - lse).toFixed(4),
        1040,
        690,
        630,
        themeColors.cyan,
      ),
    );
    api.focus.target('backward-recompute-a-probability-tile-when-backward-needs-it', () =>
      drawOriginalFlashText(
        ctx,
        api,
        'Recompute a probability tile when backward needs it',
        960,
        925,
        35,
        themeColors.ink,
        'center',
      ),
    );
  }
}
export default {
  id: 'backward',
  draw: drawBackward,
  cues: [
    'saved-lse',
    'compact-statistic',
    'recompute-scores',
    'recover-probability',
    'linear-storage',
    'tile-recomputation',
  ],
};
