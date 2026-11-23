import { bounded } from '../arithmetic.mjs';
import { SHARDS } from '../fixtures.mjs';
import {
  drawExpandedBar,
  drawExpandedLine,
  drawExpandedText,
  drawExpandedTile,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawFsdp2Contract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat === 0) {
      drawExpandedTitle(ctx, api, 'Build communication ownership before optimizer references');
      const q = cueProgress(),
        names = ['block 0', 'block 1', 'block 2', 'root remainder'];
      names.forEach((name, i) => {
        const x = 230 + i * 400;
        drawExpandedTile(
          ctx,
          api,
          name,
          x,
          420,
          330,
          100,
          i < 3 ? themeColors.blue : themeColors.pink,
        );
        const done = q > (i + 1) / 5;
        if (done) {
          SHARDS.forEach((id, j) =>
            drawExpandedTile(ctx, api, id, x + j * 80, 610, 70, 62, themeColors.blue),
          );
          drawExpandedText(
            ctx,
            api,
            'DTensor identities',
            x + 165,
            745,
            26,
            themeColors.green,
            'center',
          );
        }
      });
      if (q > 0.9) {
        drawExpandedLine(ctx, api, 350, 820, 1530, 820, themeColors.yellow);
        drawExpandedText(
          ctx,
          api,
          'Optimizer now binds these sharded parameters',
          960,
          935,
          37,
          themeColors.yellow,
          'center',
        );
      }
    }
    if (currentBeat === 1) {
      drawExpandedTitle(ctx, api, 'Same unit · change parameter lifetime');
      const q = cueProgress();
      [
        ['True: release then regather', [1, 0, 1], themeColors.blue],
        ['False: retain for backward', [1, 1, 1], themeColors.pink],
        ['Integer: retain partial', [1, 0.5, 1], themeColors.yellow],
      ].forEach(([name, vs, col], i) => {
        const y = 420 + i * 180;
        drawExpandedText(ctx, api, name, 200, y + 30, 28, col);
        vs.forEach((v, j) => {
          drawExpandedBar(ctx, api, v, 750 + j * 310, y, 270, 75, 1, col);
          if (q > j / 3)
            drawExpandedText(
              ctx,
              api,
              ['Forward', 'Between', 'Backward'][j],
              885 + j * 310,
              y + 125,
              24,
              themeColors.muted,
              'center',
            );
        });
      });
      drawExpandedText(
        ctx,
        api,
        'Default: true for non-root, false for root · integer needs a supported divisor',
        960,
        1030,
        26,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 2) {
      drawExpandedTitle(ctx, api, 'Accumulation controls different buffers');
      const q = cueProgress();
      const rows = [
        ['FP32 owned parameter', 0.25, themeColors.blue],
        ['BF16 compute copy', currentBeat === 2 && q > 0.5 ? 1 : 0.25, themeColors.cyan],
        ['Gradient: sync disabled', q, themeColors.pink],
        ['Gradient: reductions enabled', q * 0.25, themeColors.green],
      ];
      rows.forEach(([label, v, col], i) => {
        const y = 410 + i * 140;
        drawExpandedText(ctx, api, label, 210, y + 35, 28, col);
        drawExpandedBar(ctx, api, v, 800, y, 820, 62, 1, col);
      });
      drawExpandedText(
        ctx,
        api,
        'Suppressing gradient reduction can retain full gradients; parameter retention is separate',
        960,
        1030,
        27,
        themeColors.yellow,
        'center',
      );
    }
    if (currentBeat === 3) {
      drawExpandedTitle(ctx, api, 'A frozen weight still participates in the dependency graph');
      const q = cueProgress();
      drawExpandedTile(ctx, api, 'dY', 250, 480, 180, 90, themeColors.pink);
      drawExpandedTile(ctx, api, 'Frozen W', 750, 480, 250, 90, themeColors.blue);
      drawExpandedTile(ctx, api, 'dX = dY Wᵀ', 1320, 480, 330, 90, themeColors.cyan);
      api.arrow(ctx, 440, 525, 730, 525, themeColors.muted, 3);
      api.arrow(ctx, 1020, 525, 1300, 525, themeColors.muted, 3);
      if (q > 0.35) {
        api.rect(ctx, 720, 440, 310, 170, themeColors.panel + '00', themeColors.yellow, 6);
        drawExpandedText(
          ctx,
          api,
          'Materialize W for this use',
          880,
          730,
          31,
          themeColors.yellow,
          'center',
        );
      }
      drawExpandedText(
        ctx,
        api,
        'FSDP2: standard clipping on DTensor · FSDP1 sharded: wrapper clipping',
        960,
        900,
        30,
        themeColors.ink,
        'center',
      );
      drawExpandedText(
        ctx,
        api,
        'Compile the train step or module; verify the actual integration',
        960,
        990,
        28,
        themeColors.muted,
        'center',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'fsdp2-contract',
  draw: drawFsdp2Contract,
  cues: [],
};
