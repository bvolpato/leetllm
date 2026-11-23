import { RS_ARTIFACT_HASHES } from '../fixtures.mjs';
import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionRect,
  drawResearchConstructionText,
} from '../defaults.mjs';
export function drawArtifactLayers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('artifact-layers', state),
    currentBeat = modelState.b;
  api.focus.target('rs-artifact-layers-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Compare each evidence layer to an independently retained reference',
    );
    const names = [
      'tracked commit',
      'executed snapshot',
      'environment +lock',
      'configuration history',
      'rows +derived outputs',
      'producer identity',
    ];
    const values = [
      'not recorded by miniature',
      RS_ARTIFACT_HASHES.code.slice(0, 16) + '…',
      'Python 3.12 / NumPy 2.2.6',
      '80 episodes / 12 steps / α = 0.35',
      RS_ARTIFACT_HASHES.rows.slice(0, 12) + '…',
      'unsigned manifest',
    ];
    const comparisons = [
      'retain separately',
      'matches retained code',
      'host properties separate',
      'same retained config',
      'matches retained rows',
      'identity unproved',
    ];
    names.forEach((name, i) => {
      const y = 345 + i * 90;
      drawResearchConstructionText(
        ctx,
        api,
        name,
        230,
        y + 27,
        30,
        i === 5 ? themeColors.yellow : themeColors.cyan,
      );
      drawResearchConstructionRect(ctx, api, 690, y, 510, 45, themeColors.panel, themeColors.muted);
      drawResearchConstructionText(ctx, api, values[i], 710, y + 32, 24, themeColors.ink);
      drawResearchConstructionRect(
        ctx,
        api,
        1310,
        y,
        360,
        45,
        themeColors.panel,
        themeColors.muted,
      );
      drawResearchConstructionText(ctx, api, comparisons[i], 1330, y + 32, 25, themeColors.muted);
      if (i < 5)
        drawResearchConstructionArrow(ctx, api, 1215, y + 22, 1290, y + 22, themeColors.cyan);
    });
    if (currentBeat === 0)
      drawResearchConstructionBox(
        ctx,
        api,
        'Record modified and untracked files separately.',
        630,
        900,
        1040,
        75,
        themeColors.pink,
        29,
      );
    else if (currentBeat === 1)
      drawResearchConstructionBox(
        ctx,
        api,
        'Generator +seed +calls +build +host constrain streams',
        460,
        900,
        1210,
        75,
        themeColors.yellow,
        29,
      );
    else
      drawResearchConstructionBox(
        ctx,
        api,
        'Same hashes ≠ observed execution ≠ scientific validity',
        460,
        900,
        1210,
        75,
        themeColors.yellow,
        29,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      'An unsigned internally consistent manifest does not identify its producer',
    );
  });
}
export default {
  id: 'artifact-layers',
  draw: drawArtifactLayers,
  cues: [
    'rs-artifact-layers-0',
    'rsx-artifact-layers-b0-s0',
    'rsx-artifact-layers-b0-s1',
    'rsx-artifact-layers-b0-s2',
    'rs-artifact-layers-1',
    'rsx-artifact-layers-b1-s0',
    'rsx-artifact-layers-b1-s1',
    'rsx-artifact-layers-b1-s2',
    'rs-artifact-layers-2',
    'rsx-artifact-layers-b2-s0',
    'rsx-artifact-layers-b2-s1',
    'rsx-artifact-layers-b2-s2',
  ],
};
