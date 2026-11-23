import { multiTenantConstructionModel } from '../model.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionCenter,
  drawConstructionFoot,
  drawConstructionLine,
  withConstructionFocus,
} from '../defaults.mjs';
export function drawIncidentEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = multiTenantConstructionModel('incident-evidence', state),
    currentBeat = modelState.b;
  withConstructionFocus(ctx, api, 'incident-evidence', () => {
    if (currentBeat === 0) {
      drawConstructionBox(
        ctx,
        api,
        'A-private postmortem\nreader Carol / tenant A',
        150,
        350,
        720,
        160,
        themeColors.blue,
        32,
      );
      drawConstructionBox(
        ctx,
        api,
        'B request / Bob\nnot permitted for A-private',
        1050,
        350,
        720,
        160,
        themeColors.pink,
        32,
      );
      if (modelState.leakPathVisible) {
        drawConstructionArrow(ctx, api, 900, 575, 1020, 575, themeColors.pink);
        drawConstructionBox(
          ctx,
          api,
          'Incident: foreign evidence reached B',
          440,
          690,
          1040,
          120,
          themeColors.pink,
          34,
        );
      } else {
        drawConstructionLine(ctx, api, 960, 550, 960, 840, themeColors.pink, 7);
        drawConstructionBox(
          ctx,
          api,
          'Leaking path contained',
          430,
          690,
          1060,
          120,
          themeColors.green,
          35,
        );
      }
      drawConstructionCenter(
        ctx,
        api,
        'Preserve scoped identity, retrieval and cache audit evidence',
        960,
        950,
        31,
        themeColors.yellow,
      );
    } else if (currentBeat === 1) {
      drawConstructionCenter(
        ctx,
        api,
        'Revisit the supplied five-page admission fixture',
        960,
        285,
        33,
        themeColors.yellow,
      );
      drawConstructionBox(ctx, api, 'Needs 5 pages', 150, 385, 620, 115, themeColors.blue, 35);
      drawConstructionBox(
        ctx,
        api,
        modelState.addedCapacity ? 'Available 5 pages' : 'Available 4 pages',
        1150,
        385,
        620,
        115,
        modelState.addedCapacity ? themeColors.green : themeColors.pink,
        35,
      );
      modelState.metrics.forEach((v, i) =>
        drawConstructionBox(
          ctx,
          api,
          v,
          150 + (i % 4) * 445,
          615 + Math.floor(i / 4) * 145,
          400,
          95,
          i === 3 ? themeColors.yellow : themeColors.muted,
          26,
        ),
      );
      if (modelState.diagnosed)
        drawConstructionCenter(
          ctx,
          api,
          'Moderate aggregate utilization does not rule out page pressure',
          960,
          545,
          29,
          themeColors.yellow,
        );
      if (modelState.addedCapacity)
        drawConstructionCenter(
          ctx,
          api,
          'One extra eligible page fixes this memory condition, not the data leak',
          960,
          970,
          28,
          themeColors.green,
        );
    } else {
      const scenarios = [
        'short summaries',
        'long prompts',
        'adapter churn',
        'cache misses',
        'disconnects',
        'worker loss',
        'quota outage',
        'overload',
      ];
      scenarios.forEach((v, i) =>
        drawConstructionBox(
          ctx,
          api,
          v,
          160 + (i % 4) * 440,
          370 + Math.floor(i / 4) * 230,
          400,
          145,
          [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.pink][i % 4],
          29,
        ),
      );
      drawConstructionCenter(
        ctx,
        api,
        'Measure tenant tails and useful completions under the same offered load',
        960,
        945,
        30,
        themeColors.yellow,
      );
    }
    drawConstructionFoot(
      ctx,
      api,
      'Contain the authority failure first; add capacity only for a demonstrated capacity constraint',
    );
  });
}
export default {
  id: 'incident-evidence',
  draw: drawIncidentEvidence,
  cues: [
    'mt-incident-evidence-b0',
    'mt-incident-evidence-s0-0',
    'mt-incident-evidence-s0-1',
    'mt-incident-evidence-b1',
    'mt-incident-evidence-s1-1',
    'mt-incident-evidence-s1-3',
    'mt-incident-evidence-b2',
  ],
};
