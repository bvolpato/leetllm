import { spokenProgress, spokenResult } from '../construction.mjs';

const weightCount = 1_000_000;
const megabytes = (bits) => (weightCount * bits) / 8 / 1e6;
const codes = megabytes(4);
const weights = megabytes(16);
const total = codes + 2 * weights;

export function drawKernelPath(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const read = spokenProgress(state, 'kernel-path-build-0', 0, 0.14, 0.36);
  const write = spokenProgress(state, 'kernel-path-build-1', 1, 0.32, 0.48);
  const readback = spokenProgress(state, 'weight-readback', 1, 0.48, 0.66);
  const extra = spokenResult(state, 'kernel-path-build-2', 2, 0, 0.16);
  const timed = spokenResult(state, 'ascend-result', 2, 0.55, 0.85);
  const x = 465;
  const pixelsPerMB = 280;
  const barHeight = 84;
  const right = x + total * pixelsPerMB;
  api.text(ctx, 'Device memory traffic for 1 million weights', 155, 275, 48, C.ink);
  api.text(ctx, 'Code and weight bytes only', 155, 335, 33, C.muted);

  function segment(start, size, y, color, label, progress) {
    const width = size * pixelsPerMB;
    if (progress > 0) api.rect(ctx, start, y, width * progress, barHeight, color, undefined, 0);
    if (progress === 1) api.text(ctx, label, start + width / 2, y + 55, 33, C.bg, 'center', 'mono');
  }

  api.text(ctx, 'Fused', 150, 493, 49, C.ink);
  api.line(ctx, x, 531, right, 531, C.muted, 2);
  api.focus.target('kernel-path-state-0', () => {
    segment(x, codes, 445, C.blue, codes + ' MB', read);
    if (read === 1) {
      api.text(ctx, 'Read codes', x + (codes * pixelsPerMB) / 2, 580, 31, C.blue, 'center');
      api.text(ctx, 'Unpack and multiply on chip', 720, 499, 45, C.cyan);
    }
  });

  if (beat > 0) {
    const y = 610;
    const afterCodes = x + codes * pixelsPerMB;
    const afterWrite = afterCodes + weights * pixelsPerMB;
    api.text(ctx, 'Standalone', 150, y + 54, 49, C.ink);
    api.line(ctx, x, y + barHeight + 2, right, y + barHeight + 2, C.muted, 2);
    segment(x, codes, y, C.blue, codes + ' MB', 1);
    api.text(ctx, 'Read codes', x + (codes * pixelsPerMB) / 2, y + 139, 31, C.blue, 'center');
    api.focus.target('kernel-path-state-1', () =>
      segment(afterCodes, weights, y, C.cyan, 'Write FP16  ' + weights + ' MB', write),
    );
    api.focus.target('readback', () =>
      segment(afterWrite, weights, y, C.pink, 'Read FP16  ' + weights + ' MB', readback),
    );
    api.focus.target('kernel-path-state-2', () => {
      if (extra) {
        const bracketY = y + 162;
        api.line(ctx, afterCodes, bracketY, right, bracketY, C.yellow, 4);
        for (const end of [afterCodes, right])
          api.line(ctx, end, bracketY - 15, end, bracketY, C.yellow, 4);
        api.text(
          ctx,
          '+' + (total - codes) + ' MB',
          (right + afterCodes) / 2,
          bracketY + 68,
          54,
          C.yellow,
          'center',
          'mono',
        );
      } else if (readback === 1) {
        api.text(ctx, 'How much extra traffic?', 960, 835, 46, C.yellow, 'center');
      }
    });
  }
  api.focus.target('timed-kernel', () => {
    const study = spokenProgress(state, 'ascend-result', 2, 0.55, 0.85);
    if (study > 0) {
      api.text(
        ctx,
        timed
          ? 'Ascend study   ·   up to 1.48× native FP16'
          : 'Ascend study   ·   measured speed',
        1750,
        335,
        33,
        C.muted,
        'right',
      );
    }
  });
}

export default {
  id: 'kernel-path',
  draw: drawKernelPath,
  cues: [
    'kernel-path-build-0',
    'kernel-path-build-1',
    'weight-readback',
    'kernel-path-build-2',
    'ascend-result',
  ],
};
