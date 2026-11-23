import { capturedCalls } from '../arithmetic.mjs';
import { drawBox, drawMatrix, drawText, mark } from '../defaults.mjs';
export function drawFreshBoundary(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1;
  const paint = () => {
    const ledger = capturedCalls([
      {
        length: 3,
        global: 2,
      },
      {
        length: 3,
        global: 4,
      },
      {
        length: 5,
        global: 4,
      },
    ]);
    drawText(ctx, api, 'Sum the input, then multiply by scale', 960, 270, 33, themeColors.yellow);
    const reveal = [
      currentBeat > 0 || resultComplete('fresh-given'),
      currentBeat > 1 || (currentBeat === 1 && resultComplete('fresh-repeat')),
      currentBeat > 1 || (currentBeat === 1 && resultComplete('fresh-newshape')),
    ];
    for (const [i, r] of ledger.results.entries()) {
      if (i > 0 && currentBeat === 0 && cueProgress('fresh-change') === 0) continue;
      const yy = 365 + i * 165;
      drawMatrix(ctx, api, Array(r.length).fill(1), 170, yy, {
        cw: 75,
        ch: 90,
        label: i === 0 ? 'float32 ones' : undefined,
      });
      drawBox(ctx, api, 'Python global ' + r.global, 650, yy, 350, 90, themeColors.blue);
      drawBox(
        ctx,
        api,
        reveal[i] ? 'variant ' + r.variant + ' · captured ' + r.captured : 'execution pending',
        1110,
        yy,
        400,
        90,
        reveal[i] ? (i === 1 ? themeColors.pink : themeColors.cyan) : themeColors.muted,
      );
      drawBox(
        ctx,
        api,
        reveal[i] ? r.result : '?',
        1640,
        yy,
        170,
        90,
        reveal[i] ? themeColors.green : themeColors.muted,
        39,
      );
    }
    if (currentBeat === 0)
      drawText(
        ctx,
        api,
        cueProgress('fresh-change') > 0
          ? 'What do the second and third calls return?'
          : 'First call on three float32 ones',
        960,
        950,
        33,
        themeColors.yellow,
      );
    else if (currentBeat === 1)
      drawText(
        ctx,
        api,
        resultComplete('fresh-newshape')
          ? 'Trace A kept 2. Trace B captured 4.'
          : 'Read the coefficient in each executable.',
        960,
        950,
        32,
        themeColors.pink,
      );
    else {
      drawMatrix(ctx, api, [1, 1, 1], 250, 885, {
        cw: 100,
        ch: 80,
        color: themeColors.blue,
        label: 'same original shape',
      });
      drawBox(ctx, api, 'explicit scalar array 4', 850, 885, 500, 80, themeColors.yellow);
      drawBox(
        ctx,
        api,
        resultComplete('fresh-explicit') ? '12' : '?',
        1540,
        885,
        250,
        80,
        resultComplete('fresh-explicit') ? themeColors.green : themeColors.muted,
        39,
      );
    }
  };
  mark(ctx, api, 'jx-fresh-boundary-mechanism', paint);
}
export default {
  id: 'fresh-boundary',
  draw: drawFreshBoundary,
  cues: [
    'jx-fresh-boundary-b0',
    'fresh-given',
    'fresh-change',
    'jx-fresh-boundary-b1',
    'fresh-repeat',
    'fresh-newshape',
    'jx-fresh-boundary-b2',
    'fresh-explicit',
  ],
};
