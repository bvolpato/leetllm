import { researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionMid,
  drawResearchConstructionSmallGrid,
} from '../defaults.mjs';
export function drawOutsiderTerms(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('outsider-terms', state),
    currentBeat = modelState.b;
  api.focus.target('rs-outsider-terms-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      'Different team and artifact axes define the evidence layer',
    );
    drawResearchConstructionSmallGrid(
      ctx,
      api,
      [
        ['', 'authors’ artifacts', 'independent artifacts'],
        ['same team and setup', 'repeatability', 'new method work'],
        ['different team', 'reproducibility', 'replicability'],
      ],
      250,
      350,
      1420,
      360,
      [themeColors.muted, themeColors.blue, themeColors.cyan],
    );
    if (currentBeat === 1)
      drawResearchConstructionBox(
        ctx,
        api,
        'Documented, consistent, complete, exercisable and validated',
        260,
        815,
        1400,
        110,
        themeColors.yellow,
        30,
      );
    else if (currentBeat === 2) {
      ['Findable', 'Accessible', 'Interoperable', 'Reusable'].forEach((v, i) =>
        drawResearchConstructionBox(ctx, api, v, 230 + i * 410, 815, 360, 85, themeColors.cyan, 28),
      );
      drawResearchConstructionMid(
        ctx,
        api,
        'Authentication can protect access; execution still needs verification',
        960,
        950,
        30,
        themeColors.yellow,
      );
    } else
      drawResearchConstructionMid(
        ctx,
        api,
        'Authors’ rerun does not establish an independent layer',
        960,
        865,
        33,
        themeColors.yellow,
      );
    drawResearchConstructionFooter(
      ctx,
      api,
      'Availability, reuse and independently validated results remain separate',
    );
  });
}
export default {
  id: 'outsider-terms',
  draw: drawOutsiderTerms,
  cues: [
    'rs-outsider-terms-0',
    'rsx-outsider-terms-b0-s0',
    'rsx-outsider-terms-b0-s1',
    'rsx-outsider-terms-b0-s2',
    'rsx-outsider-terms-b0-s3',
    'rs-outsider-terms-1',
    'rsx-outsider-terms-b1-s0',
    'rsx-outsider-terms-b1-s1',
    'rsx-outsider-terms-b1-s2',
    'rs-outsider-terms-2',
    'rsx-outsider-terms-b2-s0',
    'rsx-outsider-terms-b2-s1',
    'rsx-outsider-terms-b2-s2',
  ],
};
