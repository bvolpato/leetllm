import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBadge,
  drawExpandedBox,
  drawExpandedCells,
  drawExpandedChart,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
} from '../defaults.mjs';
export function drawJointAndPosttraining(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-joint-and-posttraining-' + currentBeat),
    u = api.phase(full, 0.08, 0.82);
  api.focus.target('mm-joint-and-posttraining-construction', () => {
    if (currentBeat === 0) {
      const cols = [themeColors.blue, themeColors.cyan, themeColors.green];
      ['Encoder', 'Connector', 'Language'].forEach((name, i) => {
        const x = 200 + i * 565;
        drawExpandedCells(ctx, api, x, 390, 7, 7, 48, cols[i], 49);
        drawExpandedText(ctx, api, name, x + 168, 800, 34, cols[i], 'center');
        drawExpandedArrow(ctx, api, x + 380, 910, x + 380, 480, cols[i], u);
      });
      drawExpandedBadge(
        ctx,
        api,
        'Joint updates: measure grounded slices and text-only regressions',
      );
      drawExpandedFooter(
        ctx,
        api,
        'Starting from pretrained weights is compatible with a fully unfrozen stage.',
      );
    } else if (currentBeat === 1) {
      const x = 960,
        y = 620;
      drawExpandedLine(ctx, api, 260, y, 1660, y);
      drawExpandedLine(ctx, api, x, 350, x, 880);
      for (let i = 0; i < 18; i++) {
        const a = i * 2.4;
        api.circle(
          ctx,
          650 + Math.cos(a) * (80 + (i % 4) * 12),
          570 + Math.sin(a) * 100,
          10,
          themeColors.blue,
        );
        api.circle(
          ctx,
          1180 + Math.cos(a) * (85 + (i % 3) * 16),
          650 + Math.sin(a) * 110,
          10,
          themeColors.pink,
        );
      }
      drawExpandedArrow(ctx, api, 760, 480, 1080, 480, themeColors.yellow, u);
      drawExpandedText(ctx, api, 'Image representations', 570, 860, 30, themeColors.blue, 'center');
      drawExpandedText(ctx, api, 'Text representations', 1260, 860, 30, themeColors.pink, 'center');
      drawExpandedFooter(
        ctx,
        api,
        'Authored geometry of a contrastive modality gap · not a diagnosis of decoder grounding.',
      );
    } else {
      drawExpandedChart(ctx, api, 110, 345, 680, 470);
      drawExpandedBox(ctx, api, 360, 615, 170, 100, themeColors.yellow);
      drawExpandedArrow(ctx, api, 820, 580, 1090, 580, themeColors.yellow, u);
      drawExpandedBox(ctx, api, 1140, 400, 520, 370, themeColors.blue);
      drawExpandedText(ctx, api, 'Axis label A12', 1400, 500, 40, themeColors.green, 'center');
      drawExpandedText(
        ctx,
        api,
        u > 0.5 ? 'After lossy reduction: A?' : 'Retained source label',
        1400,
        635,
        31,
        u > 0.5 ? themeColors.pink : themeColors.muted,
        'center',
      );
      drawExpandedBadge(ctx, api, 'Recover the observation; then evaluate answer behavior');
      drawExpandedFooter(
        ctx,
        api,
        'A preference update cannot recreate detail absent from this representation.',
      );
    }
  });
}
export default {
  id: 'joint-and-posttraining',
  draw: drawJointAndPosttraining,
  cues: [
    'mm-joint-and-posttraining-0',
    'mm-joint-and-posttraining-1',
    'mm-joint-and-posttraining-2',
  ],
};
