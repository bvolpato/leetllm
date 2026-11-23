import { languageStep } from '../construction.mjs';
import { extendedLanguageState } from '../model.mjs';
import {
  drawExtendedCell,
  drawExtendedFoot,
  drawExtendedHead,
  drawExtendedText,
  mixLanguage,
} from '../defaults.mjs';
export function drawCacheLifecycle(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    S = (beat, index = 0) => languageStep('cache-lifecycle', state, beat, index),
    E = (beat, index = 0) => S(beat, index) === 1;
  api.focus.target('cache-lifecycle-construction', () => {
    const m = extendedLanguageState('cache-lifecycle', state);
    drawExtendedHead(
      ctx,
      api,
      currentBeat === 0
        ? 'Compare the delivered words with the cached positions'
        : currentBeat === 1
          ? 'Consume the selected occurrence once'
          : 'Replay rebuilds resident state without another draw',
    );
    api.teaching.tokenHistory({
      ...m,
      x: 140,
      y: 320,
      width: 1640,
      height: 600,
      fontSize: 28,
      labelWidth: 300,
      gap: 52,
    });
    if (currentBeat === 1 && S(1, 0) > 0 && !E(1, 2)) {
      const q = S(1, 0);
      drawExtendedCell(
        ctx,
        api,
        'slept → new-position call',
        mixLanguage(ctx, api, 1060, 680, q),
        945,
        550,
        45,
        themeColors.yellow,
        24,
      );
    } else
      drawExtendedText(
        ctx,
        api,
        'processed ' +
          m.processed.length +
          ' · KV ' +
          m.kv.length +
          ' · accepted ' +
          m.accepted.length,
        960,
        970,
        31,
        themeColors.cyan,
        'center',
      );
    drawExtendedFoot(
      ctx,
      api,
      currentBeat === 2
        ? 'Replay preserves occurrence IDs; KV cells identify positions whose layer vectors are omitted'
        : currentBeat === 0
          ? 'Delivery can precede the next forward pass'
          : E(1, 2)
            ? 'The selected end is accepted but this loop stops before processing it'
            : 'Consuming slept adds its position to every layer’s K/V',
    );
  });
}
export default {
  id: 'cache-lifecycle',
  draw: drawCacheLifecycle,
  cues: [
    'cache-lifecycle-b1',
    'cache-lifecycle-voice-1',
    'cache-lifecycle-step-0-1',
    'cache-lifecycle-step-0-2',
    'cache-lifecycle-step-0-3',
    'cache-lifecycle-step-0-4',
    'cache-lifecycle-b2',
    'cache-lifecycle-voice-2',
    'cache-consume',
    'cache-end-result',
    'cache-lifecycle-step-1-1',
    'cache-lifecycle-step-1-2',
    'cache-lifecycle-step-1-3',
    'cache-lifecycle-step-1-4',
    'cache-lifecycle-step-1-5',
    'cache-lifecycle-b3',
    'cache-lifecycle-voice-3',
    'cache-lifecycle-step-2-1',
    'cache-lifecycle-step-2-2',
    'cache-lifecycle-step-2-3',
  ],
};
