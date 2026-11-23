import { rms } from '../arithmetic.mjs';
import { kernelChapterFrame } from '../construction.mjs';
import { sceneClock } from '../worksheet.mjs';
import { drawArrow, drawChapterText, drawNote, drawRow, drawTitle } from '../defaults.mjs';
export function drawLibraryBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    { b: currentBeat, p: progress, at } = kernelChapterFrame('library-boundary', state);
  if (currentBeat === 3) {
    const { progress } = sceneClock(state);
    const device = progress('kg-library-device', 3, 0.67, 0.92);
    api.focus.target('library-worker', () => {
      const label = (s, x, y, size, color) => api.text(ctx, s, x, y, size, color, 'center');
      api.rect(ctx, 160, 344, 700, 385, themeColors.panel, themeColors.blue, 12);
      label('Disposable build worker', 510, 417, 42, themeColors.blue);
      label('Pinned compiler   ·   public fixtures', 510, 536, 32, themeColors.ink);
      label('Writable build directory', 510, 631, 33, themeColors.ink);
      api.rect(ctx, 1080, 344, 700, 385, themeColors.panel, device ? themeColors.yellow : themeColors.muted, 12);
      label('Isolated device worker', 1430, 417, 42, themeColors.yellow);
      label('Reviewed build K1', 1430, 536, 34, themeColors.ink);
      if (device > 0) label('External timeout and recovery', 1430, 631, 32, themeColors.yellow);
      api.arrow(ctx, 880, 536, 1058, 536, themeColors.blue, 4);
      label('Kept outside both workers', 960, 852, 36, themeColors.muted);
      label('Private evaluator   ·   credentials   ·   live traffic', 960, 930, 38, themeColors.ink);
    });
    return;
  }
  api.focus.target('library-boundary-construction', () => {
    if (currentBeat === 0) {
      drawTitle(
        ctx,
        api,
        'Fresh output means a different owned array',
        'Unit weights / ε=1e−5 · caller storage remains intact',
      );
      drawRow(ctx, api, [1, 2, 3, 4], 240, 450, 680, themeColors.blue);
      drawRow(
        ctx,
        api,
        rms([1, 2, 3, 4], [1, 1, 1, 1], 1e-5).outputs,
        1090,
        650,
        680,
        themeColors.green,
      );
      drawChapterText(ctx, api, 'caller input A', 580, 405, 31, themeColors.blue, 'center');
      drawChapterText(ctx, api, 'new result B', 1430, 610, 31, themeColors.green, 'center');
      drawArrow(ctx, api, 950, 500, 950 + 120 * progress, 625, themeColors.cyan);
      drawChapterText(
        ctx,
        api,
        'A ≠ B in object/storage identity',
        960,
        855,
        33,
        themeColors.yellow,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Fake tensors,autograd and compiler integration each retain their promised contracts',
      );
    } else if (currentBeat === 1) {
      drawTitle(
        ctx,
        api,
        'Registration and mathematical checks answer different questions',
        'Test the registration, then compare the values and gradients',
      );
      const labels = [
        'schema / mutation',
        'fake metadata',
        'compiler consistency',
        'mathematical values',
        'mathematical gradients',
      ];
      labels.forEach((label, i) => {
        drawChapterText(
          ctx,
          api,
          label,
          280,
          415 + i * 95,
          29,
          i < 3 ? themeColors.cyan : themeColors.green,
        );
        drawChapterText(
          ctx,
          api,
          i < 3 ? 'registration check' : 'separate oracle',
          1300,
          415 + i * 95,
          29,
          i < 3 ? themeColors.cyan : themeColors.green,
        );
        if (i < Math.ceil(progress * 5))
          api.line(
            ctx,
            900,
            395 + i * 95,
            1070,
            395 + i * 95,
            i < 3 ? themeColors.cyan : themeColors.green,
            4,
          );
      });
      drawNote(
        ctx,
        api,
        'Run opcheck on the input shapes and layouts the operator accepts',
      );
    } else {
      drawTitle(
        ctx,
        api,
        'A prompt does not enforce a host capability boundary',
        'Keep the actual candidate and requested operation attached',
      );
      const allowed = progress < 0.5,
        op = allowed ? 'build K1' : 'read private evaluator';
      drawChapterText(ctx, api, 'S1 / K1', 300, 465, 36, themeColors.blue);
      drawRow(ctx, api, [op], 700, 410, 900, allowed ? themeColors.green : themeColors.pink);
      drawChapterText(
        ctx,
        api,
        allowed ? 'declared build capability' : 'outside granted capabilities',
        960,
        655,
        33,
        allowed ? themeColors.green : themeColors.pink,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        allowed ? 'host permits the bounded build' : 'host denies the attempted read',
        960,
        820,
        35,
        allowed ? themeColors.green : themeColors.pink,
        'center',
      );
      drawNote(
        ctx,
        api,
        'Public structural requirements are visible · private tensors and evaluator stay outside',
      );
    }
  });
}
export default {
  id: 'library-boundary',
  draw: drawLibraryBoundary,
  cues: [
    'kg-library-boundary-voice-0',
    'kg-library-boundary-voice-1',
    'kg-library-boundary-opcheck',
    'kg-library-boundary-voice-2',
    'kg-library-isolate',
    'kg-library-device',
  ],
};
