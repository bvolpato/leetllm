import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawFooter, drawTag, drawText } from '../defaults.mjs';
export function drawProviderInterruption(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-provider-interruption-${i}-${j}`;
    if (state.cues && !Object.hasOwn(state.cues, key))
      throw Error('Unknown voice narration cue: ' + key);
    return state.cues?.[key];
  };
  const cueVisible = (i, j) => {
    const c = cue(i, j);
    return c ? c.phase !== 'before' : currentBeat > i || (currentBeat === i && beatProgress > 0.02);
  };
  const cueComplete = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after' || c.progress >= 1
      : currentBeat > i || (currentBeat === i && beatProgress > 0.98);
  };
  const withStageFocus = (name, paint) =>
    api.focus.target(`va-provider-interruption-${name}`, paint);
  {
    withStageFocus('sent-played', () => {
      drawText(
        ctx,
        api,
        'Gemini Live · inspected preview contract',
        150,
        290,
        30,
        themeColors.blue,
      );
      drawText(ctx, api, 'sent to client', 150, 350, 27, themeColors.yellow);
      api.rect(ctx, 150, 380, 1140, 60, themeColors.yellow, undefined, 8);
      drawText(ctx, api, 'confirmed by sink', 150, 505, 27, themeColors.green);
      api.rect(ctx, 150, 535, 480, 60, themeColors.green, undefined, 8);
      drawText(ctx, api, 'buffered / unplayed may remain remote', 820, 570, 28, themeColors.yellow);
    });
    withStageFocus('truncate', () => {
      drawText(ctx, api, 'OpenAI WebSocket · application request', 150, 690, 30, themeColors.cyan);
      drawBox(ctx, api, 150, 730, 1020, 180, themeColors.cyan);
      if (cueVisible(1, 2)) {
        drawText(ctx, api, 'item_id: assistant-item-1', 175, 775, 27, themeColors.cyan);
        drawText(ctx, api, 'content_index: 0', 175, 825, 27, themeColors.cyan);
        drawText(ctx, api, 'audio_end_ms: confirmed duration', 175, 875, 27, themeColors.cyan);
      }
    });
    withStageFocus('result', () => {
      drawText(ctx, api, 'acknowledgement', 1260, 735, 29, themeColors.green);
      if (cueComplete(2, 1)) {
        drawTag(ctx, api, 'item truncated', 1240, 775, 470, themeColors.green);
        drawTag(ctx, api, 'past actual end → error', 1240, 855, 470, themeColors.pink);
      }
    });
    withStageFocus('auto-transport', () => {
      if (cueVisible(1, 1))
        drawText(
          ctx,
          api,
          'WebRTC / SIP: server truncation',
          1700,
          290,
          24,
          themeColors.blue,
          'right',
        );
    });
    withStageFocus('input-guidance', () => {
      if (cueVisible(2, 3))
        drawText(
          ctx,
          api,
          'Input transcript: asynchronous guidance',
          150,
          645,
          26,
          themeColors.cyan,
        );
    });
    withStageFocus('credentials', () => {
      if (cueVisible(3, 0))
        drawText(
          ctx,
          api,
          'Long-lived keys: trusted server',
          1700,
          645,
          25,
          themeColors.blue,
          'right',
        );
    });
    withStageFocus('call-policy', () => {
      if (cueVisible(3, 1))
        drawText(
          ctx,
          api,
          'Session + recording / retention policy',
          1700,
          690,
          24,
          themeColors.yellow,
          'right',
        );
    });
    drawFooter(
      ctx,
      api,
      'Provider history is distinct from this worksheet’s whole-word alignment.',
    );
  }
}
export default {
  id: 'provider-interruption',
  draw: drawProviderInterruption,
  cues: [
    'va-provider-interruption-0-0',
    'va-provider-interruption-0-1',
    'va-provider-interruption-0-2',
    'va-provider-interruption-0-3',
    'va-provider-interruption-1-0',
    'va-provider-interruption-1-1',
    'va-provider-interruption-1-2',
    'va-provider-interruption-2-0',
    'va-provider-interruption-2-1',
    'va-provider-interruption-2-2',
    'va-provider-interruption-2-3',
    'va-provider-interruption-3-0',
    'va-provider-interruption-3-1',
    'va-provider-interruption-3-2',
  ],
};
