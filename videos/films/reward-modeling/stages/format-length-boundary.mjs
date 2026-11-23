import { cueProgress } from '../construction.mjs';
import {
  drawRewardExpansionArrow,
  drawRewardExpansionBar,
  drawRewardExpansionBox,
  drawRewardExpansionFoot,
  drawRewardExpansionL,
  drawRewardExpansionText,
  drawRewardExpansionTitle,
} from '../defaults.mjs';
export function drawFormatLengthBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    q = (id, a = 0.15, z = 0.75) => cueProgress(state, id, api.phase(progress, a, z)),
    done = (id, a = 0.6) => q(id, a, a + 0.02) >= 1;
  api.focus.target('format-length-boundary-mechanism', () => {
    if (currentBeat === 0) {
      drawRewardExpansionTitle(
        ctx,
        api,
        'Keep the shared input; branch only at the assistant answer',
      );
      const hist = ['SYSTEM · P-7 approval first', 'USER · admin for migration?'];
      hist.forEach((v, i) =>
        drawRewardExpansionBox(ctx, api, v, 475, 350 + i * 105, 970, 80, themeColors.cyan, 32),
      );
      const branch = q('format-history', 0.18, 0.48);
      if (branch > 0) {
        drawRewardExpansionL(ctx, api, 960, 550, 960, 590, themeColors.cyan);
        drawRewardExpansionL(ctx, api, 510, 590, 1410, 590, themeColors.cyan);
        drawRewardExpansionArrow(ctx, api, 510, 590, 510, 630, themeColors.cyan);
        drawRewardExpansionArrow(ctx, api, 1410, 590, 1410, 630, themeColors.cyan);
      }
      drawRewardExpansionBox(
        ctx,
        api,
        'A · request ticket; wait',
        160,
        650,
        700,
        100,
        themeColors.green,
        34,
      );
      drawRewardExpansionBox(
        ctx,
        api,
        'B · grant admin now',
        1060,
        650,
        700,
        100,
        themeColors.pink,
        34,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'Conversational rows → chat template → actual token IDs',
        960,
        865,
        33,
        themeColors.cyan,
      );
      drawRewardExpansionText(
        ctx,
        api,
        'Standard strings → concatenate and tokenize',
        960,
        940,
        32,
        themeColors.blue,
      );
    } else if (currentBeat === 1) {
      drawRewardExpansionTitle(ctx, api, 'Distinct text can collapse to identical scored inputs');
      for (let k = 0; k < 2; k++) {
        const y = 370 + k * 210;
        drawRewardExpansionBox(
          ctx,
          api,
          k ? 'Raw B: grant access now' : 'Raw A: wait for approval',
          150,
          y,
          650,
          90,
          k ? themeColors.pink : themeColors.green,
          31,
        );
        drawRewardExpansionArrow(ctx, api, 830, y + 45, 970, y + 45, themeColors.yellow);
        [316, 942, 128].forEach((v, i) =>
          drawRewardExpansionBox(ctx, api, v, 1010 + i * 255, y, 220, 90, themeColors.blue, 38),
        );
      }
      const same = q('format-equal', 0.25, 0.6);
      if (same > 0) {
        drawRewardExpansionL(ctx, api, 1135, 690, 1135, 760, themeColors.cyan);
        drawRewardExpansionL(ctx, api, 1645, 690, 1645, 760, themeColors.cyan);
        drawRewardExpansionL(ctx, api, 1135, 760, 1645, 760, themeColors.cyan);
        drawRewardExpansionText(
          ctx,
          api,
          'Same IDs + masks → same shared score',
          960,
          830,
          36,
          themeColors.cyan,
        );
      }
      drawRewardExpansionText(
        ctx,
        api,
        done('format-equal')
          ? 'Δ = 0 · loss = ln 2 · pair parameter gradient = 0'
          : 'Inspect actual IDs and masks before trusting the label',
        960,
        945,
        35,
        done('format-equal') ? themeColors.yellow : themeColors.muted,
      );
    } else {
      drawRewardExpansionTitle(ctx, api, 'Filter the whole pair at the full templated length');
      const reveal = q('format-length', 0.25, 0.55),
        rows = [
          ['Boundary pair', 1024, 1024],
          ['Long rejected answer', 1008, 1025],
          ['Long chosen answer', 1030, 1000],
        ];
      rows.forEach(([v, a, z], i) => {
        const y = 390 + i * 160;
        drawRewardExpansionBox(ctx, api, v, 140, y, 480, 95, themeColors.blue, 30);
        const colors = [themeColors.green, themeColors.pink];
        [a, z].forEach((len, j) => {
          const x = 710 + j * 415;
          drawRewardExpansionBar(ctx, api, x, y + 5, 350, 35, Math.min(1, len / 1040), colors[j]);
          drawRewardExpansionText(
            ctx,
            api,
            (j ? 'rejected ' : 'chosen ') + len,
            x + 175,
            y + 85,
            28,
            colors[j],
          );
        });
        drawRewardExpansionBox(
          ctx,
          api,
          reveal >= 1 ? (Math.max(a, z) <= 1024 ? 'KEEP' : 'DROP PAIR') : 'Check limit',
          1570,
          y,
          230,
          95,
          reveal >= 1
            ? Math.max(a, z) <= 1024
              ? themeColors.green
              : themeColors.pink
            : themeColors.muted,
          27,
        );
      });
      drawRewardExpansionText(
        ctx,
        api,
        'TRL 1.17.1 default 1024 · None disables this length filter',
        960,
        945,
        32,
        themeColors.yellow,
      );
    }
    drawRewardExpansionFoot(
      ctx,
      api,
      'Input and length examples are supplied fixtures; no tokenizer or transformer is run by this scene.',
    );
  });
}
export default {
  id: 'format-length-boundary',
  draw: drawFormatLengthBoundary,
  cues: [
    'format-length-boundary-step-1',
    'format-history',
    'format-length-boundary-step-2',
    'format-equal',
    'format-length-boundary-step-3',
    'format-length',
  ],
};
