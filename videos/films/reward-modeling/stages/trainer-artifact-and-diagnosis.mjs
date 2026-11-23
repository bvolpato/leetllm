import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionBox,
  drawRewardExpansionFoot,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawTrainerArtifactAndDiagnosis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    on = (id, a = 0.3) => q(id, a, a + 0.02) > 0;
  api.focus.target('trainer-artifact-and-diagnosis-mechanism', () => {
    if (currentBeat === 0) {
      drawRewardExpansionTitle(ctx, api, 'Split by prompt before the trainer sees the pairs');
      drawRewardExpansionBox(
        ctx,
        api,
        'TRL 1.13 transformer fragment',
        180,
        400,
        700,
        110,
        themeColors.blue,
        35,
      );
      drawRewardExpansionBox(
        ctx,
        api,
        'TRL 1.17.1 preprocessing source',
        1040,
        400,
        700,
        110,
        themeColors.cyan,
        33,
      );
      drawRewardExpansionBox(
        ctx,
        api,
        'One score per completed answer',
        180,
        620,
        700,
        100,
        themeColors.yellow,
        30,
      );
      drawRewardExpansionBox(
        ctx,
        api,
        'Chat template and length filter',
        1040,
        620,
        700,
        100,
        themeColors.yellow,
        28,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'The CPU experiment fitted the compliance and length weights.',
        960,
        910,
        31,
        themeColors.muted,
      );
    } else if (currentBeat === 1) {
      drawRewardExpansionTitle(ctx, api, 'Omitting the trained head changes the saved function');
      const labels = [
        'base revision',
        'adapter weights',
        'trained score head',
        'tokenizer / template',
      ];
      labels.forEach((v, i) =>
        drawRewardExpansionBox(
          ctx,
          api,
          v,
          160 + i * 435,
          360,
          400,
          95,
          i === 2 ? themeColors.yellow : themeColors.blue,
          29,
        ),
      );
      const missing = on('artifact-missing');
      drawRewardExpansionBox(
        ctx,
        api,
        missing ? 'Reload omits trained head' : 'Save actual trained function',
        260,
        600,
        1400,
        105,
        missing ? themeColors.pink : themeColors.cyan,
        38,
      );
      const trained = [0.5, 1],
        wrong = [0, 0],
        h = [2, 3],
        w = missing ? wrong : trained;
      drawRewardExpansionText(
        ctx,
        api,
        'Probe h = [2, 3] · ' +
          (missing ? 'replacement' : 'trained') +
          ' head [' +
          w.join(', ') +
          ']',
        960,
        800,
        34,
        missing ? themeColors.pink : themeColors.cyan,
      );
      drawRewardExpansionText(
        ctx,
        api,
        missing ? 'Changed score 0 ≠ saved score 4' : 'Saved score 0.5 × 2 + 1 × 3 = 4',
        960,
        930,
        38,
        missing ? themeColors.pink : themeColors.green,
      );
    } else {
      drawRewardExpansionTitle(ctx, api, 'Diagnose the observed state before selecting a repair');
      const pts = [
          [0, 0.8],
          [0.25, 0.55],
          [0.5, 0.38],
          [0.75, 0.25],
          [1, 0.15],
        ],
        x = 240,
        y = 380,
        w = 1050,
        h = 420;
      drawRewardExpansionL(ctx, api, x, y + h, x + w, y + h);
      drawRewardExpansionL(ctx, api, x, y, x, y + h);
      api.trace(
        ctx,
        pts.map(([a, z]) => ({
          x: x + a * w,
          y: y + h - z * h,
        })),
        1,
        themeColors.pink,
        5,
      );
      api.trace(
        ctx,
        pts.map(([a]) => ({
          x: x + a * w,
          y: y + h - 0.55 * h,
        })),
        1,
        themeColors.blue,
        5,
      );
      drawRewardExpansionText(ctx, api, 'training loss falls', 620, 330, 32, themeColors.pink);
      drawRewardExpansionText(
        ctx,
        api,
        'held-out accuracy stalls',
        1280,
        330,
        31,
        themeColors.blue,
      );
      ['overlap + labels', 'held-out loss', 'calibration + slices'].forEach((v, i) =>
        drawRewardExpansionBox(ctx, api, v, 1370, 430 + i * 150, 400, 90, themeColors.yellow, 26),
      );
      drawRewardExpansionText(
        ctx,
        api,
        'For leakage, look for prompts shared by both splits.',
        960,
        930,
        36,
        themeColors.yellow,
      );
    }
    drawRewardExpansionFoot(
      ctx,
      api,
      'Reload and compare the actual head/base/adapter/tokenizer/template package before any online policy trial.',
    );
  });
}
export default {
  id: 'trainer-artifact-and-diagnosis',
  draw: drawTrainerArtifactAndDiagnosis,
  cues: [
    'trainer-artifact-and-diagnosis-step-1',
    'trainer-artifact-and-diagnosis-step-2',
    'artifact-missing',
    'artifact-replay',
    'trainer-artifact-and-diagnosis-step-3',
  ],
};
