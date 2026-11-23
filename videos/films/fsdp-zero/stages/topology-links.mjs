import { bounded } from '../arithmetic.mjs';
import { onWords } from '../card-memory.mjs';
import {
  drawExpandedLine,
  drawExpandedText,
  drawExpandedTile,
  drawExpandedTitle,
} from '../defaults.mjs';
export function drawTopologyLinks(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = bounded(state.beatP ?? 0),
    F = api.components.fade;
  const cueProgress = (a = 0.1, z = 0.85) => api.phase(progress, a, z);
  {
    if (currentBeat < 2)
      drawExpandedTitle(ctx, api, 'GPU placement and link bandwidth');
    const q = cueProgress();
    if (currentBeat === 0) {
      const points = [
        [350, 500, 'GPU0'],
        [850, 500, 'GPU1'],
        [1450, 500, 'GPU2'],
      ];
      points.forEach(([x, y, n]) =>
        drawExpandedTile(ctx, api, n, x, y, 220, 130, themeColors.blue),
      );
      drawExpandedLine(ctx, api, 570, 565, 850, 565, themeColors.cyan, 9);
      drawExpandedLine(ctx, api, 1070, 565, 1450, 565, themeColors.pink, 4);
      drawExpandedText(ctx, api, 'Fast peer domain', 700, 760, 32, themeColors.cyan, 'center');
      drawExpandedText(
        ctx,
        api,
        'Measured cross-domain path',
        1350,
        760,
        32,
        themeColors.pink,
        'center',
      );
      drawExpandedLine(ctx, api, 460, 850, 1560, 850, themeColors.muted, 3);
      api.circle(ctx, 460 + q * 1100, 850, 15, themeColors.yellow);
      drawExpandedText(
        ctx,
        api,
        'Place frequently communicating groups using this topology',
        960,
        1000,
        32,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 1) {
      [
        ['400 Gb/s', 400, themeColors.blue],
        ['800 Gb/s', 800, themeColors.cyan],
      ].forEach(([name, v, col], i) => {
        const y = 440 + i * 240;
        drawExpandedText(ctx, api, name, 300, y + 45, 42, col);
        api.arrow(ctx, 650, y + 25, 950, y + 25, themeColors.muted, 3);
        drawExpandedText(ctx, api, '÷ 8', 800, y - 30, 32, themeColors.yellow, 'center');
        if (q > 0.4)
          drawExpandedText(ctx, api, v / 8 + ' GB/s / port, one direction', 1150, y + 45, 36, col);
      });
      drawExpandedText(
        ctx,
        api,
        'Line rate before overhead · compare matched one-way/aggregate quantities',
        960,
        1020,
        28,
        themeColors.muted,
        'center',
      );
    }
    if (currentBeat === 2) {
      const read = onWords(state, api, 2, 'rdma-read', 0.18, 0.36);
      const network = onWords(state, api, 2, 'rdma-network', 0.38, 0.5);
      const write = onWords(state, api, 2, 'rdma-write', 0.57, 0.72);
      for (const [left, name] of [[138, 'Sending server'], [1190, 'Receiving server']]) {
        api.rect(ctx, left, 370, 588, 360, themeColors.panel, themeColors.muted, 3);
        api.text(ctx, name, left + 294, 445, 43, themeColors.ink, 'center');
      }
      const centers = [285, 577, 1343, 1635];
      const names = ['GPU memory', 'Adapter', 'Adapter', 'GPU memory'];
      centers.forEach((x, i) => api.text(ctx, names[i], x, 675, 34, themeColors.ink, 'center'));
      api.text(ctx, 'Network', 960, 511, 34, themeColors.muted, 'center');
      api.line(ctx, centers[0], 563, centers[3], 563, themeColors.muted, 4);
      for (const x of centers) api.circle(ctx, x, 563, 10, themeColors.muted);
      api.focus.target('shard-path', () => {
        const x = centers[0] + read * (centers[1] - centers[0])
          + network * (centers[2] - centers[1]) + write * (centers[3] - centers[2]);
        api.rect(ctx, x - 44, 535, 88, 56, themeColors.cyan, undefined, 0);
      });
      api.text(ctx, 'One shard over GPUDirect RDMA', 960, 305, 48, themeColors.cyan, 'center');
    }
    return;
  }
  return;
}
export default {
  id: 'topology-links',
  draw: drawTopologyLinks,
  cues: ['rdma-read', 'rdma-network', 'rdma-write'],
};
