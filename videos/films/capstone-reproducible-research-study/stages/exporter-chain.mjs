import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionResult,
} from '../defaults.mjs';
export function drawExporterChain(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('exporter-chain', state),
    currentBeat = modelState.b;
  api.focus.target('rs-exporter-chain-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Execute one named source; derive every result view from it',
    );
    const labels = [
      'named code fence',
      'unmodified exporter',
      '24-row CSV',
      'result JSON',
      'derived figure',
    ];
    labels.forEach((v, i) => {
      const x = 165 + i * 340;
      drawResearchConstructionBox(
        ctx,
        api,
        v,
        x,
        390,
        285,
        100,
        i < 2 ? themeColors.blue : themeColors.cyan,
        27,
      );
      if (i < 4) drawResearchConstructionArrow(ctx, api, x + 292, 440, x + 328, 440);
    });
    if (currentBeat >= 1) {
      drawResearchConstructionBox(
        ctx,
        api,
        'Retained reference\nread-only during comparison',
        230,
        690,
        620,
        125,
        themeColors.blue,
        30,
      );
      drawResearchConstructionBox(
        ctx,
        api,
        'Isolated rerun output\ncompare beside the reference',
        1070,
        690,
        620,
        125,
        themeColors.cyan,
        30,
      );
      drawResearchConstructionArrow(ctx, api, 880, 753, 1040, 753, themeColors.yellow);
    }
    if (currentBeat === 2)
      drawResearchConstructionResult(
        ctx,
        api,
        'Submission also needs a command, lockfile, plan, traces, license and citation.',
        themeColors.yellow,
        935,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      'Three exported files are a miniature, not a complete public research package',
    );
  });
}
export default {
  id: 'exporter-chain',
  draw: drawExporterChain,
  cues: [
    'rs-exporter-chain-0',
    'rsx-exporter-chain-b0-s0',
    'rsx-exporter-chain-b0-s1',
    'rsx-exporter-chain-b0-s2',
    'rs-exporter-chain-1',
    'rsx-exporter-chain-b1-s0',
    'rsx-exporter-chain-b1-s1',
    'rs-exporter-chain-2',
    'rsx-exporter-chain-b2-s0',
    'rsx-exporter-chain-b2-s1',
    'rsx-exporter-chain-b2-s2',
  ],
};
