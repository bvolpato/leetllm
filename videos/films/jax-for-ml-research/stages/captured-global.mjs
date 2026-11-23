import { capturedCalls } from '../arithmetic.mjs';
import { drawBox, drawLeftText, drawMatrix, drawText, footer, mark } from '../defaults.mjs';
export function drawCapturedGlobal(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    U = cueProgress('jx-captured-global-b' + currentBeat);
  const paint = () => {
    const ledger = capturedCalls([
        {
          length: 4,
          global: 1,
        },
        {
          length: 4,
          global: 3,
        },
        {
          length: 2,
          global: 3,
        },
      ]),
      current =
        currentBeat === 0 ? (cueProgress('global-stale') > 0 ? 1 : 0) : currentBeat === 1 ? 2 : 3;
    drawText(
      ctx,
      api,
      'Same captured callable · explicit fixture call ledger',
      960,
      270,
      34,
      themeColors.yellow,
    );
    ledger.results.forEach((r, i) => {
      const y = 365 + i * 170,
        show =
          (i === 0 && (currentBeat > 0 || resultComplete('global-four'))) ||
          (i === 1 && (currentBeat > 0 || resultComplete('global-stale'))) ||
          (i === 2 && (currentBeat > 1 || (currentBeat === 1 && resultComplete('global-six'))));
      drawLeftText(
        ctx,
        api,
        'call ' + (i + 1),
        140,
        y + 60,
        28,
        i === current ? themeColors.yellow : themeColors.muted,
      );
      drawMatrix(ctx, api, Array(r.length).fill(1), 340, y, {
        cw: 80,
        ch: 85,
        label: i === 0 ? 'float32 ones' : undefined,
      });
      drawBox(ctx, api, 'Python scale ' + r.global, 760, y, 290, 85, themeColors.blue);
      drawBox(
        ctx,
        api,
        show ? 'variant ' + r.variant + ' · captures ' + r.captured : 'variant pending',
        1110,
        y,
        390,
        85,
        show ? (r.captured !== r.global ? themeColors.pink : themeColors.green) : themeColors.muted,
      );
      drawBox(
        ctx,
        api,
        show ? r.result : '?',
        1600,
        y,
        150,
        85,
        show ? themeColors.cyan : themeColors.muted,
        36,
      );
    });
    if (currentBeat === 2) {
      const fixed = resultComplete('global-twelve');
      drawMatrix(ctx, api, [1, 1, 1, 1], 270, 890, {
        cw: 90,
        ch: 80,
        color: themeColors.blue,
        label: 'repaired [4] input',
      });
      drawBox(ctx, api, 'scalar array scale 3', 820, 890, 440, 80, themeColors.yellow);
      drawBox(
        ctx,
        api,
        fixed ? '12' : '?',
        1450,
        890,
        280,
        80,
        fixed ? themeColors.green : themeColors.muted,
        38,
      );
    } else
      drawText(
        ctx,
        api,
        currentBeat === 0
          ? 'Python edit does not edit cached numerical operands'
          : 'Actual diagnostic tracing list: [(4,), (2,)]',
        960,
        955,
        31,
        themeColors.yellow,
      );
    footer(
      ctx,
      api,
      'This controlled fixture records tracing events; it does not count every device execution',
    );
  };
  mark(ctx, api, 'jx-captured-global-mechanism', paint);
}
export default {
  id: 'captured-global',
  draw: drawCapturedGlobal,
  cues: [
    'jx-captured-global-b0',
    'global-four',
    'global-stale',
    'jx-captured-global-b1',
    'global-six',
    'jx-captured-global-b2',
    'global-twelve',
  ],
};
