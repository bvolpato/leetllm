import { seedRows } from '../fixtures.mjs';
import { researchEvent } from '../construction.mjs';
import { deltas, researchConstructionModel } from '../model.mjs';
import {
  drawResearchConstructionArrow,
  drawResearchConstructionBox,
  drawResearchConstructionFooter,
  drawResearchConstructionHeader,
  drawResearchConstructionLine,
  drawResearchConstructionRect,
  drawResearchConstructionResult,
  drawResearchConstructionText,
  formatResearchSigned,
} from '../defaults.mjs';
export function drawLockedContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = researchConstructionModel('locked-contract', state),
    currentBeat = modelState.b;
  const E = (beat, sentence) => researchEvent('locked-contract', state, beat, sentence),
    resultComplete = (beat, sentence) => E(beat, sentence) === 1;
  api.focus.target('rs-locked-contract-mechanism', () => {
    drawResearchConstructionHeader(
      ctx,
      api,
      currentBeat === 0
        ? 'One seed is one paired analysis unit'
        : 'Different predicates protect different claims',
    );
    if (currentBeat === 0) {
      const n = 1 + Math.floor(E(0, 2) * 5);
      for (let i = 0; i < n; i++) {
        const y = 350 + i * 83,
          r = seedRows[i];
        drawResearchConstructionText(ctx, api, 'seed ' + i, 220, y + 34, 29, themeColors.muted);
        drawResearchConstructionRect(ctx, api, 430, y, 400 * r.early_sparse, 32, themeColors.blue);
        drawResearchConstructionRect(
          ctx,
          api,
          430,
          y + 39,
          400 * r.early_shaped,
          32,
          themeColors.cyan,
        );
        drawResearchConstructionText(
          ctx,
          api,
          r.early_sparse.toFixed(3) + ' sparse',
          900,
          y + 30,
          27,
          themeColors.blue,
        );
        drawResearchConstructionText(
          ctx,
          api,
          r.early_shaped.toFixed(3) + ' shaped',
          1150,
          y + 30,
          27,
          themeColors.cyan,
        );
        drawResearchConstructionArrow(ctx, api, 1420, y + 32, 1510, y + 32);
        drawResearchConstructionText(
          ctx,
          api,
          formatResearchSigned(ctx, api, deltas[i]),
          1560,
          y + 40,
          29,
          themeColors.yellow,
        );
      }
      if (resultComplete(0, 2))
        drawResearchConstructionResult(
          ctx,
          api,
          'Mean = sum of all planned within-seed differences / pair count',
        );
    } else {
      const x = (v) => 330 + ((v + 0.04) / 0.3) * 1260;
      drawResearchConstructionLine(ctx, api, 330, 475, 1590, 475);
      drawResearchConstructionLine(ctx, api, x(0), 370, x(0), 500, themeColors.muted);
      drawResearchConstructionLine(ctx, api, x(0.1), 370, x(0.1), 500, themeColors.yellow, 4);
      drawResearchConstructionText(ctx, api, 'zero', x(0) - 45, 845, 29, themeColors.muted);
      drawResearchConstructionText(
        ctx,
        api,
        'useful mean ≥ +.10',
        x(0.1) - 45,
        335,
        29,
        themeColors.yellow,
      );
      drawResearchConstructionBox(
        ctx,
        api,
        'EARLY\nmean ≥ +.10 AND lower > 0',
        310,
        520,
        570,
        145,
        themeColors.cyan,
        31,
      );
      drawResearchConstructionBox(
        ctx,
        api,
        'FINAL\nmean + interval within ±.02',
        1020,
        520,
        570,
        145,
        themeColors.blue,
        31,
      );
      if (currentBeat === 2) {
        drawResearchConstructionBox(
          ctx,
          api,
          'Stronger magnitude claim\nrequires early lower > +.10',
          570,
          790,
          780,
          115,
          themeColors.yellow,
          30,
        );
      }
    }
    drawResearchConstructionFooter(
      ctx,
      api,
      'Fixed illustrative decision rules, not universal scientific thresholds',
    );
  });
}
export default {
  id: 'locked-contract',
  draw: drawLockedContract,
  cues: [
    'rs-locked-contract-0',
    'rsx-locked-contract-b0-s0',
    'rsx-locked-contract-b0-s1',
    'rsx-locked-contract-b0-s2',
    'rs-locked-contract-1',
    'rsx-locked-contract-b1-s0',
    'rsx-locked-contract-b1-s1',
    'rs-locked-contract-2',
    'rsx-locked-contract-b2-s0',
    'rsx-locked-contract-b2-s1',
    'rsx-locked-contract-b2-s2',
    'rsx-locked-contract-b2-s3',
  ],
};
