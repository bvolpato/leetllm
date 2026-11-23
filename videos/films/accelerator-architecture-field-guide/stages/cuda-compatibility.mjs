import { sharedBound } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import { drawCard, drawCenteredText, drawFooter, drawLine, drawPanel } from '../defaults.mjs';
export function drawCudaCompatibility(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    resultComplete = (name, beat) => ev(name, beat) === 1,
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('cuda-compatibility-mechanism', () => {
    if (currentBeat === 0) {
      drawCenteredText(
        ctx,
        api,
        'One local tile · movement owners stay explicit',
        960,
        285,
        34,
        themeColors.yellow,
      );
      drawCard(ctx, api, 'Global device memory', 130, 390, 600, 140, themeColors.blue, 34);
      drawCard(ctx, api, 'Block shared tile', 1170, 390, 600, 140, themeColors.cyan, 34);
      if (B('copy', 0)) {
        const amount = ev('copy', 0);
        drawCard(
          ctx,
          api,
          'tile A',
          api.lerp(200, 1320, amount),
          640,
          250,
          90,
          themeColors.yellow,
          30,
        );
      }
      if (B('cluster', 0))
        drawCenteredText(
          ctx,
          api,
          'Cluster: participating blocks can expose distributed shared memory',
          960,
          900,
          31,
          themeColors.cyan,
        );
    } else if (currentBeat === 1) {
      drawPanel(ctx, api, 160, 360, 720, 185, themeColors.yellow);
      drawCenteredText(ctx, api, 'Hopper architecture-specific PTX', 520, 433, 32, themeColors.ink);
      api.text(ctx, 'compute_90a', 520, 504, 42, themeColors.yellow, 'center', 'mono');
      drawCard(ctx, api, 'New Blackwell target', 1090, 360, 660, 185, themeColors.cyan, 34);
      if (resultComplete('reject', 1)) {
        drawLine(ctx, api, 940, 375, 940, 540, themeColors.pink, 8);
        drawCenteredText(ctx, api, '90a path is incompatible', 960, 680, 35, themeColors.pink);
      }
      if (resultComplete('compatible', 1) && resultComplete('reject', 1))
        drawCard(
          ctx,
          api,
          'Alternate native target or documented compatible PTX',
          350,
          825,
          1220,
          110,
          themeColors.green,
          32,
        );
    } else {
      const large = B('footprint', 2),
        bytes = large ? 96 : 64,
        blocks = sharedBound(192, bytes);
      drawCenteredText(
        ctx,
        api,
        '192 KiB of shared memory on one SM',
        960,
        315,
        43,
        themeColors.ink,
      );
      const left = 200,
        width = 1520,
        scale = width / 192;
      for (let i = 0; i < blocks; i++) {
        const x = left + i * bytes * scale,
          w = bytes * scale;
        drawPanel(ctx, api, x + 5, 450, w - 10, 205, themeColors.cyan);
        drawCenteredText(ctx, api, 'Block ' + (i + 1), x + w / 2, 531, 39, themeColors.ink);
        drawCenteredText(ctx, api, bytes + ' KiB', x + w / 2, 604, 37, themeColors.cyan);
      }
      drawLine(ctx, api, left, 695, left + width, 695, themeColors.muted, 3);
      for (const kib of [0, 64, 96, 128, 192]) {
        const x = left + kib * scale;
        drawLine(ctx, api, x, 684, x, 710, themeColors.muted, 3);
        drawCenteredText(ctx, api, String(kib), x, 759, 29, themeColors.muted);
      }
      if (resultComplete('floor', 2))
        drawCenteredText(
          ctx,
          api,
          'floor(192 / ' + bytes + ') = ' + blocks + ' blocks',
          960,
          900,
          40,
          themeColors.yellow,
        );
    }
    drawFooter(
      ctx,
      api,
      currentBeat === 2
        ? 'Shared memory sets this bound. Registers and threads can reduce residency further.'
        : 'Hopper to Blackwell   ·   verify the binary target before timing the port',
    );
  });
}
export default {
  id: 'cuda-compatibility',
  draw: drawCudaCompatibility,
  cues: [
    'ag-cuda-compatibility-copy',
    'ag-cuda-compatibility-cluster',
    'ag-cuda-compatibility-compatible',
    'ag-cuda-compatibility-reject',
    'ag-cuda-compatibility-floor',
    'ag-cuda-compatibility-footprint',
  ],
};
