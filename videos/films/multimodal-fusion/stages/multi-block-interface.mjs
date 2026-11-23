import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBadge,
  drawExpandedBox,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawMultiBlockInterface(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-multi-block-interface-' + currentBeat),
    u = api.phase(full, 0.08, 0.82);
  api.focus.target('mm-multi-block-interface-construction', () => {
    const ys = [355, 435, 515, 595, 675, 755],
      vx = 150,
      lx = 1410,
      taps = [1, 3, 5],
      first = currentBeat === 2 ? 4 : 3;
    drawExpandedText(ctx, api, 'Vision levels', vx + 130, 290, 31, themeColors.blue, 'center');
    drawExpandedText(ctx, api, 'Language blocks', lx + 130, 290, 31, themeColors.green, 'center');
    ys.forEach((y, i) => {
      drawExpandedTile(ctx, api, 'V' + (i + 1), vx, y, 260, 58, themeColors.blue);
      drawExpandedTile(ctx, api, 'L' + (i + 1), lx, y, 260, 58, themeColors.green);
    });
    drawExpandedText(ctx, api, 'Collected features', 775, 320, 29, themeColors.cyan, 'center');
    drawExpandedBox(ctx, api, 680, 380, 200, 385, themeColors.cyan);
    taps.forEach((v, i) => {
      const y = 430 + i * 120;
      drawExpandedTile(ctx, api, 'V' + (v + 1), 710, y, 140, 65, themeColors.blue);
      api.path(
        ctx,
        [
          {
            x: 425,
            y: ys[v] + 29,
          },
          {
            x: 540,
            y: ys[v] + 29,
          },
          {
            x: 540,
            y: y + 32,
          },
          {
            x: 670,
            y: y + 32,
          },
        ],
        {
          color: themeColors.blue,
          width: 3,
        },
      );
    });
    drawExpandedTile(ctx, api, 'K aligner', 1000, 420, 270, 92, themeColors.cyan);
    drawExpandedTile(ctx, api, 'V aligner', 1000, 650, 270, 92, themeColors.cyan);
    api.path(
      ctx,
      [
        {
          x: 890,
          y: 520,
        },
        {
          x: 940,
          y: 520,
        },
        {
          x: 940,
          y: 466,
        },
        {
          x: 990,
          y: 466,
        },
      ],
      {
        color: themeColors.cyan,
        width: 3,
      },
    );
    api.path(
      ctx,
      [
        {
          x: 890,
          y: 630,
        },
        {
          x: 940,
          y: 630,
        },
        {
          x: 940,
          y: 696,
        },
        {
          x: 990,
          y: 696,
        },
      ],
      {
        color: themeColors.cyan,
        width: 3,
      },
    );
    drawExpandedLine(ctx, api, 1280, 466, 1340, 466, themeColors.cyan, 4);
    drawExpandedLine(ctx, api, 1280, 696, 1340, 696, themeColors.cyan, 4);
    drawExpandedLine(ctx, api, 1340, 466, 1340, ys[5] + 29, themeColors.cyan, 4);
    drawExpandedText(ctx, api, 'K/V', 1340, 855, 28, themeColors.cyan, 'center');
    for (let i = 3; i < 6; i++) {
      const y = ys[i] + 29,
        active = i >= first;
      if (active) drawExpandedLine(ctx, api, 1340, y, 1400, y, themeColors.cyan, 4);
      if (currentBeat > 0 && active) {
        api.circle(ctx, 1740, y, 19, themeColors.panel, themeColors.yellow, 3);
        drawExpandedText(ctx, api, 'α' + (i + 1), 1800, y + 9, 27, themeColors.yellow, 'center');
      }
    }
    if (currentBeat > 0) {
      drawExpandedArrow(ctx, api, 1855, ys[5] + 65, 1855, ys[first] + 15, themeColors.yellow, u);
      drawExpandedText(ctx, api, 'backward path', 1700, 900, 27, themeColors.yellow, 'center');
    }
    drawExpandedBadge(
      ctx,
      api,
      currentBeat === 0
        ? 'Every tapped level feeds BOTH key and value aligners'
        : currentBeat === 1
          ? 'Trainable per-block K/V weights · three late insertions'
          : 'Schematic two-block choice: omit the L4 insertion',
    );
    drawExpandedFooter(
      ctx,
      api,
      'MPnP runtime-training scope · frozen earlier blocks still execute their forward computation.',
    );
  });
}
export default {
  id: 'multi-block-interface',
  draw: drawMultiBlockInterface,
  cues: ['mm-multi-block-interface-0', 'mm-multi-block-interface-1', 'mm-multi-block-interface-2'],
};
