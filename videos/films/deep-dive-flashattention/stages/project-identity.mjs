import { clamp, gradientFixture } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import {
  drawExtensionCell,
  drawExtensionFooter,
  drawExtensionL,
  drawExtensionRectangle,
  drawExtensionText,
  drawExtensionTravelling,
  drawExtensionVector,
} from '../defaults.mjs';
export function drawProjectIdentity(ctx, scene, state, api) {
  return api.focus.target('fa-' + scene.id + '-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('project-identity', state),
      { b: currentBeat, p: progress } = modelState,
      teaching2 = gradientFixture();
    {
      if (currentBeat === 0) {
        drawExtensionText(
          ctx,
          api,
          'Public source kernels + wrappers',
          960,
          300,
          39,
          themeColors.blue,
          'center',
        );
        drawExtensionRectangle(ctx, api, 330, 365, 1250, 350, themeColors.blue);
        for (let i = 0; i < Math.floor(4 * progress) + 1; i++) {
          drawExtensionL(
            ctx,
            api,
            390,
            430 + i * 65,
            1380 - (i % 2) * 240,
            430 + i * 65,
            themeColors.muted,
            6,
          );
        }
        drawExtensionCell(ctx, api, 'BSD 3-Clause', 650, 790, 620, 90, themeColors.green);
        drawExtensionFooter(
          ctx,
          api,
          'Source license · separate weights/data/components/support rights',
        );
      } else if (currentBeat === 1) {
        const rows = [
          ['flash-attn', 'flash_attn', 'FA2'],
          ['Hopper package', 'flash_attn_3', 'FA3'],
          ['flash-attn-4', 'flash_attn.cute', 'FA4'],
        ];
        drawExtensionCell(ctx, api, 'Installed record', 170, 490, 320, 100, themeColors.yellow);
        rows.forEach(([pkg, mod, g], i) => {
          const y = 320 + i * 220;
          drawExtensionL(ctx, api, 490, 540, 650, y + 50, themeColors.muted);
          if (progress > i / 3) {
            drawExtensionCell(ctx, api, pkg, 650, y, 400, 100, themeColors.blue);
            drawExtensionCell(ctx, api, mod, 1200, y, 500, 100, themeColors.cyan);
            drawExtensionTravelling(
              ctx,
              api,
              1050,
              y + 50,
              1200,
              y + 50,
              clamp(progress * 3 - i),
              themeColors.cyan,
            );
            drawExtensionText(ctx, api, g, 1780, y + 65, 28, themeColors.yellow, 'center');
          }
        });
        drawExtensionFooter(
          ctx,
          api,
          'Install paths in the article’s September 23, 2026 documentation check',
        );
      } else if (currentBeat === 2) {
        const rows = [
          ['FA2', 'Ampere / Ada / Hopper', 'CUDA ≥12 · Torch ≥2.2'],
          ['FA3 beta', 'H100 / H800', 'CUDA ≥12.3'],
          ['FA4', 'Hopper / Blackwell', 'CUDA 13 recommended extra'],
        ];
        rows.forEach(([g, device, tool], i) => {
          const y = 340 + i * 195;
          drawExtensionCell(ctx, api, g, 180, y, 200, 90, themeColors.blue);
          drawExtensionCell(ctx, api, device, 520, y, 570, 90, themeColors.cyan);
          if (progress > i / 3)
            drawExtensionCell(ctx, api, tool, 1210, y, 520, 90, themeColors.yellow);
          drawExtensionL(ctx, api, 380, y + 45, 520, y + 45);
          drawExtensionL(ctx, api, 1090, y + 45, 1210, y + 45);
        });
        drawExtensionFooter(
          ctx,
          api,
          'Record loaded module + toolkit + device; driver alone is not a build environment',
        );
      } else {
        const nodes = [
          'README',
          'public wrapper',
          'reference tests',
          'Hopper setup',
          'CuTe interface',
        ];
        nodes.forEach((n, i) => {
          const x = 165 + i * 330;
          drawExtensionCell(
            ctx,
            api,
            n,
            x,
            390,
            295,
            100,
            i < Math.ceil(5 * progress) ? themeColors.cyan : themeColors.muted,
          );
          if (i) drawExtensionL(ctx, api, x - 35, 440, x, 440);
        });
        drawExtensionVector(
          ctx,
          api,
          ['toolkit', 'PyTorch', 'packaging', 'psutil', 'ninja'],
          225,
          670,
          1450,
          80,
          themeColors.yellow,
        );
        drawExtensionFooter(
          ctx,
          api,
          'Two pinned revisions · Linux documented / Windows qualified · GPU extension unexecuted',
        );
      }
    }
  });
}
export default {
  id: 'project-identity',
  draw: drawProjectIdentity,
  cues: [
    'fa-project-identity-0',
    'fa-project-identity-1',
    'fa-project-identity-2',
    'fa-project-identity-3',
  ],
};
