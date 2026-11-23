import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
} from '../defaults.mjs';
export function drawDataProvenance(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('data-provenance', state),
    currentBeat = modelState.b;
  api.focus.target('rs-data-provenance-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      currentBeat
        ? 'A future public dataset needs its own origin record'
        : 'A synthetic CSV still has an origin',
    );
    const entries = currentBeat
      ? [
          'original URL + license',
          'version + retrieval date',
          'input checksum',
          'preprocessing + exclusions',
        ]
      : [
          'generator version',
          'seeds 0 through 23',
          '7 states, 15% slips, 12 steps',
          'exact command +configuration',
        ];
    entries.forEach((v, i) =>
      drawResearchConstructionBox(
        ctx,
        api,
        v,
        220 + (i % 2) * 850,
        360 + Math.floor(i / 2) * 230,
        660,
        105,
        i < 2 ? themeColors.blue : themeColors.cyan,
        30,
      ),
    );
    drawResearchConstructionArrow(ctx, api, 600, 760, 600, 835);
    drawResearchConstructionArrow(ctx, api, 1440, 760, 1440, 835);
    drawResearchConstructionBox(
      ctx,
      api,
      currentBeat ? 'retained original inputs' : 'canonical seed rows',
      410,
      860,
      1100,
      85,
      themeColors.yellow,
      32,
    );
    drawResearchConstructionFooter(
      ctx,
      api,
      'Derivative files remain linked to the retained source, not a renamed local path',
    );
  });
}
export default {
  id: 'data-provenance',
  draw: drawDataProvenance,
  cues: [
    'rs-data-provenance-0',
    'rsx-data-provenance-b0-s0',
    'rsx-data-provenance-b0-s1',
    'rsx-data-provenance-b0-s2',
    'rs-data-provenance-1',
    'rsx-data-provenance-b1-s0',
    'rsx-data-provenance-b1-s1',
    'rsx-data-provenance-b1-s2',
  ],
};
