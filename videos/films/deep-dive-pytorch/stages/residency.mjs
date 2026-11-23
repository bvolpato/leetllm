import { clamp01 } from '../arithmetic.mjs';
import { sampleModel, sampleOriginalModel } from '../construction.mjs';
import { drawOriginalGrid, drawOriginalText, drawText } from '../defaults.mjs';
function drawResidencyAllocation(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('residency', state),
    currentBeat = modelState.b;
  const route = (a, z, color = themeColors.cyan, progress = modelState.q) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress,
      color,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 3,
    });
  {
    drawOriginalText(
      ctx,
      api,
      currentBeat === 0
        ? modelState.gatherStarted
          ? 'All-gather into the compute parameter'
          : 'Rank 0 at rest · owned shard [1, 2]'
        : currentBeat === 1
          ? 'Full parameter available during module computation'
          : modelState.retainedVisible
            ? 'Reshard policy frees the copy · retain policy keeps it'
            : 'Reshard after forward · release the compute copy',
      960,
      285,
      36,
      themeColors.yellow,
      'center',
    );
    const sources = [0, 1, 2, 3].map((i) => {
      drawOriginalText(
        ctx,
        api,
        `Rank ${i}`,
        330 + i * 420,
        375,
        27,
        i ? themeColors.blue : themeColors.cyan,
        'center',
      );
      return api.focus.target(
        'residency-grid-2-i-1-2-i-2-155-i-420-400-350-85-i-c-blue-c-cyan',
        () =>
          drawOriginalGrid(
            ctx,
            api,
            [[2 * i + 1, 2 * i + 2]],
            155 + i * 420,
            400,
            350,
            85,
            i ? themeColors.blue : themeColors.cyan,
          ),
      );
    });
    if (modelState.gatherStarted || currentBeat > 0) {
      const target = api.focus.target(
        'residency-grid-array-from-length-8-i-i-s-parameter-length-s-parameter-i-200-56',
        () =>
          drawOriginalGrid(
            ctx,
            api,
            [
              Array.from(
                {
                  length: 8,
                },
                (_, i) => (i < modelState.parameter.length ? modelState.parameter[i] : ''),
              ),
            ],
            200,
            560,
            1520,
            100,
            themeColors.cyan,
          ),
      );
      if (currentBeat === 0)
        sources.forEach((source, i) => {
          const progress = clamp01(modelState.gatherProgress * 4 - i);
          if (progress > 0)
            route(source.shape, target.shape, i ? themeColors.blue : themeColors.cyan, progress);
        });
    } else
      drawOriginalText(
        ctx,
        api,
        'Owned values on rank 0 · 2 of 8',
        960,
        575,
        31,
        themeColors.cyan,
        'center',
      );
    if (modelState.gatherStarted || currentBeat > 0)
      drawOriginalText(
        ctx,
        api,
        `Compute parameter · ${modelState.received} of 8 values present`,
        960,
        700,
        27,
        themeColors.cyan,
        'center',
      );
    if (modelState.retainedVisible) {
      drawOriginalText(
        ctx,
        api,
        'Current · reshard after forward',
        500,
        735,
        25,
        themeColors.cyan,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        'Alternative · retain full parameter',
        1420,
        735,
        25,
        themeColors.pink,
        'center',
      );
      teaching.allocation({
        x: 80,
        y: 765,
        width: 840,
        height: 240,
        capacity: 10,
        parts: modelState.parts.map((part) => ({
          ...part,
          color: themeColors[part.color],
        })),
        fontSize: 23,
        unit: 'elements',
        color: themeColors.ink,
        trackColor: themeColors.panel,
      });
      teaching.allocation({
        x: 1000,
        y: 765,
        width: 840,
        height: 240,
        capacity: 10,
        parts: modelState.retainedParts.map((part) => ({
          ...part,
          color: themeColors[part.color],
        })),
        fontSize: 23,
        unit: 'elements',
        color: themeColors.ink,
        trackColor: themeColors.panel,
      });
      drawOriginalText(
        ctx,
        api,
        `Current ledger ${modelState.live} · alternative ledger ${modelState.retainedLive} parameter elements`,
        960,
        1035,
        24,
        themeColors.muted,
        'center',
      );
    } else {
      drawOriginalText(
        ctx,
        api,
        'Current policy · live parameter allocations',
        960,
        735,
        25,
        themeColors.cyan,
        'center',
      );
      teaching.allocation({
        x: 250,
        y: 765,
        width: 1400,
        height: 240,
        capacity: 10,
        parts: modelState.parts.map((part) => ({
          ...part,
          color: themeColors[part.color],
        })),
        fontSize: 24,
        unit: 'elements',
        color: themeColors.ink,
        trackColor: themeColors.panel,
      });
      drawOriginalText(
        ctx,
        api,
        `Current parameter ledger ${modelState.live} elements · activations and other training state omitted`,
        960,
        1035,
        25,
        themeColors.muted,
        'center',
      );
    }
  }
}
export function drawResidency(ctx, scene, state, api) {
  return api.focus.target('pt-residency-mechanism', () => {
    const { C: themeColors } = api,
      modelState = sampleModel('residency', state),
      { b: currentBeat, p: progress } = modelState;
    {
      drawResidencyAllocation(ctx, scene, state, api);
      drawText(
        ctx,
        api,
        currentBeat === 2
          ? 'After forward → release the managed compute allocation'
          : modelState.received === 8
            ? 'Gather dependency complete → managed compute hook'
            : 'Module call → gather dependency → compute awaits complete values',
        960,
        330,
        23,
        modelState.received === 8 ? themeColors.green : themeColors.muted,
        'center',
      );
      return;
    }
  });
}
export default {
  id: 'residency',
  draw: drawResidency,
  cues: [
    'residency-beat-1-focus-1',
    'pt-residency-0',
    'residency-beat-2-focus-1',
    'residency-beat-2-focus-2',
    'pt-residency-1',
    'residency-beat-3-focus-1',
    'residency-beat-3-focus-2',
    'pt-residency-2',
  ],
};
