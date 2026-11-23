import { opProgress } from '../construction.mjs';
import {
  drawConstructionArrow,
  drawConstructionBox,
  drawConstructionFooter,
  drawConstructionRoute,
  drawConstructionRows,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawControlsFast(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'controls-fast');
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Choose the mechanism matching the intended control'
        : currentBeat === 1
          ? 'Numerical solvers and trained acceleration have separate inputs'
          : 'Teacher + adversarial training is a distinct recipe',
    );
    if (currentBeat === 0) {
      drawConstructionRows(
        ctx,
        api,
        [
          ['LoRA adapter', 'Selected weight updates: style / specialization'],
          ['ControlNet', 'Trainable control branch + zero connectors'],
          ['Inpaint route', 'Mask + preserved context'],
        ],
        385,
        175,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Actual control fidelity, readable text and permitted marks need their own checks',
      );
    } else if (currentBeat === 1) {
      const labels = ['Teacher step 1', 'Teacher step 2', 'Student step 1'];
      drawConstructionBox(ctx, api, labels[0], 170, 440, 450, themeColors.blue, 110, 30);
      drawConstructionBox(ctx, api, labels[1], 730, 440, 450, themeColors.blue, 110, 30);
      drawConstructionArrow(ctx, api, 650, 495, 700, 495);
      drawConstructionBox(ctx, api, labels[2], 1290, 740, 450, themeColors.cyan, 110, 30);
      drawConstructionRoute(
        ctx,
        api,
        [
          {
            x: 960,
            y: 590,
          },
          {
            x: 960,
            y: 650,
          },
          {
            x: 1515,
            y: 650,
          },
          {
            x: 1515,
            y: 710,
          },
        ],
        progress,
      );
      drawConstructionFooter(
        ctx,
        api,
        'DPM-Solver: solver without retraining · distillation:2→1 · consistency / LCM: trained mappings',
      );
    } else {
      drawConstructionRows(
        ctx,
        api,
        [
          ['Adversarial diffusion distillation', 'Diffusion teacher + adversarial signal'],
          ['Reported experimental scope', '1–4 steps on its trained configurations'],
          ['Route compatibility', 'Model / adapter / scheduler / target / guidance'],
        ],
        385,
        175,
      );
      drawConstructionFooter(
        ctx,
        api,
        'Original DDPM regression still has no discriminator · measure complete intended route',
      );
    }
    return;
  }
}
export default {
  id: 'controls-fast',
  draw: drawControlsFast,
  cues: ['df-controls-fast-0', 'df-controls-fast-1', 'df-controls-fast-2'],
};
