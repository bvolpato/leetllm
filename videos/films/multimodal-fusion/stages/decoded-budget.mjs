import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBadge,
  drawExpandedBox,
  drawExpandedCells,
  drawExpandedFooter,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawDecodedBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-decoded-budget-' + currentBeat),
    u = api.phase(full, 0.08, 0.82),
    done = (cue) => (state.cues ? cueProgress(cue, 0) >= 1 - 1e-8 : progress >= 0.95);
  api.focus.target('mm-decoded-budget-construction', () => {
    if (currentBeat === 0) {
      [
        ['12 MB JPEG', themeColors.blue],
        ['400 KB WebP', themeColors.green],
      ].forEach(([name, col], i) => {
        const x = 180 + i * 860;
        drawExpandedTile(ctx, api, name, x, 340, 530, 90, col);
        drawExpandedCells(ctx, api, x + 40, 480, 12, 12, 29, col, 144);
        drawExpandedText(ctx, api, 'same admitted geometry', x + 265, 880, 30, col, 'center');
      });
      drawExpandedArrow(ctx, api, 790, 680, 1040, 680, themeColors.yellow, u);
      drawExpandedBadge(ctx, api, 'Separate upload, decoded-pixel and visual-token limits');
    } else if (currentBeat === 1) {
      const n = 24,
        count = Math.floor(u * n * n);
      drawExpandedCells(ctx, api, 170, 360, n, n, 22, themeColors.blue, count);
      drawExpandedText(ctx, api, '336 px', 435, 320, 29, themeColors.blue, 'center');
      drawExpandedText(ctx, api, '14 px patch', 870, 400, 30, themeColors.yellow);
      drawExpandedText(ctx, api, '24 positions across', 870, 510, 34, themeColors.ink);
      drawExpandedText(ctx, api, '24 positions down', 870, 620, 34, themeColors.ink);
      if (done('mm-patch-count'))
        drawExpandedText(
          ctx,
          api,
          '576 patch features',
          1320,
          780,
          43,
          themeColors.green,
          'center',
        );
      else
        drawExpandedText(
          ctx,
          api,
          'Constructing the patch grid',
          1310,
          780,
          30,
          themeColors.muted,
          'center',
        );
      drawExpandedFooter(
        ctx,
        api,
        'This divisible-view fixture excludes CLS; other processors may pad, crop or retain extra tokens.',
      );
    } else {
      const count = Math.floor(u * 120);
      for (let i = 0; i < 120; i++) {
        const x = 155 + (i % 20) * 80,
          y = 360 + Math.floor(i / 20) * 74;
        drawExpandedBox(
          ctx,
          api,
          x,
          y,
          61,
          51,
          i < count ? themeColors.blue : themeColors.muted,
          i < count ? themeColors.blue : themeColors.panel,
        );
      }
      drawExpandedText(
        ctx,
        api,
        '120 admitted frame IDs · 2 frames / second × 60 seconds',
        960,
        310,
        32,
        themeColors.ink,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Each 224 px frame: 256 patches',
        960,
        850,
        32,
        themeColors.cyan,
        'center',
      );
      drawExpandedBadge(
        ctx,
        api,
        done('mm-video-count')
          ? '30,720 patches · 7.5 × 4,096-token windows'
          : 'Build the frame count before the full visual sequence',
        done('mm-video-count') ? themeColors.pink : themeColors.yellow,
      );
      drawExpandedFooter(
        ctx,
        api,
        'Frame selection changes observation coverage; representation training determines useful compression.',
      );
    }
  });
}
export default {
  id: 'decoded-budget',
  draw: drawDecodedBudget,
  cues: [
    'mm-decoded-budget-0',
    'mm-decoded-budget-1',
    'mm-patch-count',
    'mm-decoded-budget-2',
    'mm-video-count',
  ],
};
