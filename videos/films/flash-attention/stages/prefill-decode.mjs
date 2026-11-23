import { flashExtensionFrame } from '../model.mjs';
import {
  drawFlashExtensionFooter,
  drawFlashExtensionNum,
  drawFlashExtensionRectangle,
  drawFlashExtensionText,
} from '../defaults.mjs';
export function drawPrefillDecode(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = flashExtensionFrame('prefill-decode', state),
    currentBeat = f.beat,
    progress = f.progress;
  const paint = () => {
    const n = 12;
    for (let i = 0; i < (currentBeat === 0 ? n : 1); i++)
      for (let j = 0; j < n; j++)
        drawFlashExtensionRectangle(
          ctx,
          api,
          320 + j * 65,
          355 + i * 36,
          53,
          25,
          currentBeat > 0 || j <= i ? themeColors.cyan + '80' : themeColors.panel,
        );
    drawFlashExtensionText(
      ctx,
      api,
      currentBeat === 0 ? 'Many causal query rows' : 'One new query over valid cache history',
      960,
      290,
      37,
      themeColors.ink,
      'center',
    );
    drawFlashExtensionNum(ctx, api, '8192-token prefill', '33,558,528 valid pairs', 430);
    drawFlashExtensionNum(
      ctx,
      api,
      'One decode query',
      '8,192 valid pairs',
      650,
      themeColors.yellow,
    );
    drawFlashExtensionText(
      ctx,
      api,
      'Prefill has 4,096.5× as many valid pairs',
      960,
      900,
      34,
      themeColors.pink,
      'center',
    );
    drawFlashExtensionFooter(
      ctx,
      api,
      'Prompt latency: time to first token      Generation: time between tokens',
    );
  };
  let nested = paint;
  for (let i = 0; i < scene.beats.length; i++) {
    const previous = nested;
    nested = () => api.focus.target('prefill-decode-state-' + i, previous);
  }
  nested();
}
export default {
  id: 'prefill-decode',
  draw: drawPrefillDecode,
  cues: ['prefill-decode-beat-1', 'prefill-decode-beat-2', 'fa-one-query', 'prefill-decode-beat-3'],
};
