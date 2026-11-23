import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionSmallGrid,
} from '../defaults.mjs';
export function drawExperimentLedger(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('experiment-ledger', state),
    currentBeat = modelState.b;
  api.focus.target('rs-experiment-ledger-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Attempt history remains immutable while a run advances',
    );
    drawResearchConstructionSmallGrid(
      ctx,
      api,
      [
        ['seed', 'attempt', 'status', 'retained output'],
        ['6', 'A', 'mechanical failure', 'error + invalid bytes'],
        [
          '6',
          'B',
          currentBeat ? 'complete' : 'planned',
          currentBeat ? 'linked replacement' : 'pending',
        ],
        ['11', 'A', 'complete', 'unfavorable result kept'],
        ['17', 'A', 'complete', 'unfavorable result kept'],
      ],
      200,
      350,
      1520,
      420,
      [themeColors.muted, themeColors.pink, themeColors.cyan, themeColors.ink, themeColors.ink],
    );
    if (currentBeat) {
      drawResearchConstructionArrow(ctx, api, 725, 500, 725, 600, themeColors.yellow);
      drawResearchConstructionMid(
        ctx,
        api,
        'B replaces the failed attempt; it does not erase A',
        960,
        875,
        34,
        themeColors.yellow,
      );
    }
    drawResearchConstructionFooter(
      ctx,
      api,
      'Constructed attempt ledger · sort by seed identity, not performance',
    );
  });
}
export default {
  id: 'experiment-ledger',
  draw: drawExperimentLedger,
  cues: [
    'rs-experiment-ledger-0',
    'rsx-experiment-ledger-b0-s0',
    'rsx-experiment-ledger-b0-s1',
    'rsx-experiment-ledger-b0-s2',
    'rsx-experiment-ledger-b0-s3',
    'rs-experiment-ledger-1',
    'rsx-experiment-ledger-b1-s0',
    'rsx-experiment-ledger-b1-s1',
    'rsx-experiment-ledger-b1-s2',
  ],
};
