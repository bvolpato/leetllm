import { sentence, tinkerConstruction } from '../construction.mjs';
import { drawExtendedCard, drawExtendedNote, drawExtendedText } from '../defaults.mjs';
export function drawPrimitiveReceipts(ctx, scene, state, api) {
  return paintPrimitiveReceipts(ctx, scene, state, api);
}
function paintPrimitiveReceipts(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('primitive-receipts', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'primitive-receipts', beat, index),
    resultComplete = (beat, index) => cueProgress(beat, index) === 1;
  return focus.target('tk-primitive-receipts-trace', () => {
    const names = [
      'Batch B0',
      'Accumulated gradient',
      'Trainer adapter',
      'Sampler selection',
      'Recovery artifact',
    ];
    names.forEach((name, i) => {
      drawExtendedText(ctx, api, name, 170, 370 + i * 117, 28, themeColors.blue);
      const value =
        i === 0
          ? 'tokens / targets / loss'
          : i === 1
            ? resultComplete(0, 0)
              ? (resultComplete(0, 1) ? 'g(B0) consumed by optimizer' : 'g(B0) accumulated')
              : 'await forward-backward'
            : i === 2
              ? resultComplete(0, 1)
                ? 'v2 + optimizer moments'
                : 'v1 + optimizer moments'
              : i === 3
                ? 'sampler path v1'
                : resultComplete(0, 3)
                  ? 'training state v2'
                  : 'not yet saved';
      drawExtendedCard(
        ctx,
        api,
        value,
        670,
        315 + i * 117,
        1010,
        86,
        i === 3
          ? themeColors.cyan
          : resultComplete(0, Math.min(i, 3))
            ? themeColors.green
            : themeColors.muted,
      );
    });
    if (currentBeat === 1)
      drawExtendedCard(
        ctx,
        api,
        'One training client · ordered request IDs · weight decay default 0',
        250,
        900,
        1420,
        70,
        themeColors.yellow,
        27,
      );
    drawExtendedNote(
      ctx,
      api,
      'A completed training receipt leaves the independently selected sampler unchanged.',
    );
  });
}
export default {
  id: 'primitive-receipts',
  draw: drawPrimitiveReceipts,
  cues: [
    'tk-primitive-receipts-0-0',
    'tk-primitive-receipts-0-1',
    'tk-primitive-receipts-0-2',
    'tk-primitive-receipts-0-3',
    'tk-primitive-receipts-0-4',
    'tk-primitive-receipts-1-0',
    'tk-primitive-receipts-1-1',
    'tk-primitive-receipts-1-2',
    'tk-primitive-receipts-1-3',
  ],
};
