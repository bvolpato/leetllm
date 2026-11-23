import { steps } from '../fixtures.mjs';
import { sentence } from '../construction.mjs';
import { constructionModel } from '../model.mjs';
import {
  drawConstructionBox,
  drawConstructionFoot,
  drawConstructionGrid,
  drawConstructionHead,
  drawConstructionText,
  drawConstructionTransfer,
} from '../defaults.mjs';
export function drawVerifierEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    modelState = constructionModel('verifier-evidence', state),
    progress = (beat, n) => sentence(state, 'verifier-evidence', beat, n),
    done = (beat, n) => progress(beat, n) === 1;
  {
    drawConstructionHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Outcome labels and intermediate-step labels supervise different objects'
        : currentBeat === 1
          ? 'A rollout can recover from an invalid earlier step'
          : 'A pre-continuation check can avoid the fourth request',
    );
    if (currentBeat === 0) {
      const answer = drawConstructionBox(
          ctx,
          api,
          'Completed answer',
          200,
          385,
          590,
          120,
          themeColors.blue,
          35,
        ),
        label = drawConstructionBox(
          ctx,
          api,
          'Outcome label',
          1120,
          385,
          590,
          120,
          themeColors.green,
          35,
        );
      drawConstructionTransfer(ctx, api, answer, label, progress(0, 0));
      for (let i = 0; i < 3; i++)
        drawConstructionBox(
          ctx,
          api,
          'Step ' + (i + 1),
          280 + i * 520,
          650,
          360,
          100,
          i === 2 ? themeColors.pink : themeColors.cyan,
          31,
        );
      if (done(0, 2))
        drawConstructionText(
          ctx,
          api,
          'Human step supervision: about 800,000 labels in the reported math setting',
          960,
          875,
          31,
          themeColors.yellow,
          'center',
        );
    } else if (currentBeat === 1) {
      drawConstructionGrid(
        ctx,
        api,
        [
          ['step label', 'supplied mass'],
          ['positive', 0.6],
          ['negative', 0.25],
          ['neutral', 0.15],
        ],
        150,
        345,
        780,
        340,
        themeColors.cyan,
        30,
      );
      drawConstructionBox(
        ctx,
        api,
        'Step 2 has an invalid operation',
        1080,
        365,
        660,
        105,
        themeColors.pink,
        30,
      );
      if (done(1, 2)) {
        drawConstructionBox(
          ctx,
          api,
          'Later correction → final success',
          1080,
          565,
          660,
          105,
          themeColors.green,
          30,
        );
        drawConstructionText(
          ctx,
          api,
          'M/N estimates downstream rollout success',
          960,
          830,
          37,
          themeColors.yellow,
          'center',
        );
      }
      drawConstructionFoot(
        ctx,
        api,
        'Label masses are an authored example, not calibrated confidence or a measured dataset result.',
      );
    } else {
      for (let i = 0; i < 4; i++) {
        const known = i < 3;
        drawConstructionBox(
          ctx,
          api,
          known ? steps[i].label : 'Not requested',
          180 + i * 435,
          460,
          380,
          130,
          i === 2 ? themeColors.pink : known ? themeColors.green : themeColors.muted,
          27,
        );
        if (known)
          drawConstructionText(
            ctx,
            api,
            i === 2 ? 'FAIL' : 'PASS',
            370 + i * 435,
            670,
            30,
            i === 2 ? themeColors.pink : themeColors.green,
            'center',
          );
      }
      if (done(2, 1))
        drawConstructionBox(
          ctx,
          api,
          '3 generated steps · fourth request avoided',
          320,
          790,
          1280,
          100,
          themeColors.green,
          34,
        );
      drawConstructionFoot(
        ctx,
        api,
        'Scoring an already completed trace would retain all four generation costs.',
      );
    }
  }
}
export default {
  id: 'verifier-evidence',
  draw: drawVerifierEvidence,
  cues: [
    'ra-verifier-evidence-0-0',
    'ra-verifier-evidence-0-1',
    'ra-verifier-evidence-0-2',
    'ra-verifier-evidence-0-3',
    'ra-verifier-evidence-1-0',
    'ra-verifier-evidence-1-1',
    'ra-verifier-evidence-1-2',
    'ra-verifier-evidence-1-3',
    'ra-verifier-evidence-2-0',
    'ra-verifier-evidence-2-1',
    'ra-verifier-evidence-2-2',
    'ra-verifier-evidence-2-3',
  ],
};
