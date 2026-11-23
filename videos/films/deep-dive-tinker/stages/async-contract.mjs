import { sentence, tinkerConstruction } from '../construction.mjs';
import {
  drawExtendedCard,
  drawExtendedNote,
  drawExtendedText,
  drawExtendedTransfer,
} from '../defaults.mjs';
export function drawAsyncContract(ctx, scene, state, api) {
  return paintAsyncContract(ctx, scene, state, api);
}
function paintAsyncContract(ctx, scene, state, api) {
  const { C: themeColors, focus } = api,
    modelState = tinkerConstruction('async-contract', state),
    currentBeat = modelState.b;
  const cueProgress = (beat, index) => sentence(state, 'async-contract', beat, index),
    resultComplete = (beat, index) => cueProgress(beat, index) === 1;
  return focus.target('tk-async-contract-trace', () => {
    drawExtendedText(
      ctx,
      api,
      'Training and sampling in SDK 0.27',
      960,
      280,
      34,
      themeColors.yellow,
      'center',
    );
    const training = drawExtendedCard(
      ctx,
      api,
      'await forward_backward_async(B0)',
      170,
      355,
      630,
      105,
      themeColors.blue,
      29,
    );
    const future = drawExtendedCard(
      ctx,
      api,
      resultComplete(0, 1) ? 'APIFuture · request F7' : 'return type pending',
      1120,
      355,
      600,
      105,
      themeColors.cyan,
      30,
    );
    drawExtendedTransfer(ctx, api, training, future, cueProgress(0, 1), themeColors.blue);
    const result = drawExtendedCard(
      ctx,
      api,
      resultComplete(0, 2) ? 'await F7.result_async()\nTrainingOutput' : 'Training result pending',
      1120,
      555,
      600,
      145,
      resultComplete(0, 2) ? themeColors.green : themeColors.muted,
      28,
    );
    if (resultComplete(0, 1))
      drawExtendedTransfer(ctx, api, future, result, cueProgress(0, 2), themeColors.cyan);
    const sample = drawExtendedCard(
        ctx,
        api,
        'await sample_async(snapshot v1)',
        170,
        765,
        630,
        105,
        themeColors.yellow,
        28,
      ),
      response = drawExtendedCard(
        ctx,
        api,
        resultComplete(0, 3) ? 'SampleResponse · tokens + logprobs' : 'completed response pending',
        1120,
        765,
        600,
        105,
        resultComplete(0, 3) ? themeColors.green : themeColors.muted,
        28,
      );
    drawExtendedTransfer(ctx, api, sample, response, cueProgress(0, 3), themeColors.yellow);
    drawExtendedNote(
      ctx,
      api,
      currentBeat === 0
        ? 'Follow the return type of each call.'
        : 'The future returns training metrics. The worker keeps the parameter gradients.',
    );
  });
}
export default {
  id: 'async-contract',
  draw: drawAsyncContract,
  cues: [
    'tk-async-contract-0-0',
    'tk-async-contract-0-1',
    'tk-async-contract-0-2',
    'tk-async-contract-0-3',
    'tk-async-contract-0-4',
    'tk-async-contract-1-0',
    'tk-async-contract-1-1',
    'tk-async-contract-1-2',
    'tk-async-contract-1-3',
  ],
};
