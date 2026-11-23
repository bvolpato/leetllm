import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBox,
  drawExpandedCells,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawEncoderDirections(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-encoder-directions-' + currentBeat),
    u = api.phase(full, 0.08, 0.82);
  api.focus.target('mm-encoder-directions-construction', () => {
    if (currentBeat === 0) {
      ['Image', 'Speech content', 'Sound similarity'].forEach((name, i) => {
        const x = 150 + i * 580;
        drawExpandedText(
          ctx,
          api,
          name,
          x + 240,
          320,
          31,
          [themeColors.blue, themeColors.green, themeColors.pink][i],
          'center',
        );
      });
      drawExpandedCells(ctx, api, 190, 390, 9, 9, 42, themeColors.blue, Math.floor(u * 81));
      for (let i = 0; i < 45; i++) {
        const x = 760 + i * 9,
          h = 30 + 100 * Math.abs(Math.sin(i * 0.6));
        api.rect(ctx, x, 590 - h, 6, h, themeColors.green, undefined, 0);
      }
      drawExpandedText(ctx, api, 'log-Mel / ASR', 960, 750, 29, themeColors.green, 'center');
      const cx = 1530,
        cy = 570;
      drawExpandedLine(ctx, api, cx - 140, cy, cx + 140, cy);
      drawExpandedLine(ctx, api, cx, cy - 150, cx, cy + 150);
      [
        [1, 0.3],
        [0.6, 0.9],
        [-0.5, -0.6],
      ].forEach(([x, y], i) =>
        drawExpandedArrow(
          ctx,
          api,
          cx,
          cy,
          cx + x * 120 * u,
          cy - y * 120 * u,
          [themeColors.pink, themeColors.cyan, themeColors.yellow][i],
        ),
      );
      drawExpandedText(ctx, api, 'CLIP / SigLIP', 420, 800, 30, themeColors.blue, 'center');
      drawExpandedText(ctx, api, 'Whisper', 960, 800, 30, themeColors.green, 'center');
      drawExpandedText(ctx, api, 'CLAP', 1530, 800, 30, themeColors.pink, 'center');
      drawExpandedFooter(ctx, api, 'Find the alarm in a recording, or transcribe the words someone spoke.');
    } else if (currentBeat === 1) {
      const configs = [
        ['BLIP-2', 'frozen', 'bridge', 'frozen'],
        ['PaLI', 'freeze → tune', 'interface', 'train'],
        ['Llama 4 · 2025', 'align encoder', 'early fusion', 'frozen alignment'],
      ];
      ['Published stage', 'Vision', 'Interface', 'Language'].forEach((s, i) =>
        drawExpandedText(
          ctx,
          api,
          s,
          [330, 790, 1170, 1570][i],
          340,
          28,
          themeColors.muted,
          'center',
        ),
      );
      configs.forEach((row, i) =>
        row.forEach((s, j) => {
          const x = [140, 610, 1000, 1380][j],
            y = 430 + i * 150;
          drawExpandedTile(
            ctx,
            api,
            s,
            x,
            y,
            j ? 340 : 380,
            92,
            j === 2 ? themeColors.cyan : j === 0 ? themeColors.blue : themeColors.green,
          );
        }),
      );
      drawExpandedFooter(
        ctx,
        api,
        'Read each row to see which weights train at that stage.',
      );
    } else {
      const x = 400,
        y = 580;
      drawExpandedBox(ctx, api, x - 160, y - 180, 320, 360, themeColors.blue);
      drawExpandedCells(ctx, api, x - 120, y - 110, 6, 6, 40, themeColors.blue);
      drawExpandedText(ctx, api, 'Read image / audio', x, y + 230, 30, themeColors.blue, 'center');
      const outputs = [
        {
          x: 1140,
          y: 350,
          n: 'Cited text',
          col: themeColors.green,
        },
        {
          x: 1530,
          y: 570,
          n: 'Generated image',
          col: themeColors.pink,
        },
        {
          x: 1140,
          y: 790,
          n: 'Generated speech',
          col: themeColors.yellow,
        },
      ];
      outputs.forEach((o, i) => {
        drawExpandedArrow(
          ctx,
          api,
          590,
          580,
          o.x - 175,
          o.y + 30,
          o.col,
          api.phase(u, i * 0.18, 0.55 + i * 0.18),
        );
        drawExpandedTile(ctx, api, o.n, o.x - 160, o.y, 320, 80, o.col);
      });
      drawExpandedText(
        ctx,
        api,
        'Different trained output paths',
        1260,
        285,
        34,
        themeColors.ink,
        'center',
      );
      drawExpandedFooter(
        ctx,
        api,
        'GPT-4o architecture, May 2024   ·   This copilot returns cited text.',
      );
    }
  });
}
export default {
  id: 'encoder-directions',
  draw: drawEncoderDirections,
  cues: ['mm-encoder-directions-0', 'mm-encoder-directions-1', 'mm-encoder-directions-2'],
};
