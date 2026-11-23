import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawFooter, drawSampleWave, drawText } from '../defaults.mjs';
export function drawAudioRepresentation(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-audio-representation-${i}-${j}`;
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
    api.focus.target(`va-audio-representation-${name}`, paint);
  {
    withStageFocus('waveform', () => {
      drawText(ctx, api, '2-second waveform', 150, 300, 31, themeColors.blue);
      drawSampleWave(ctx, api, 150, 385, 1500, themeColors.blue, 0.9);
    });
    withStageFocus('semantic-positions', () => {
      drawText(ctx, api, 'AudioPaLM w2v-BERT variant', 150, 505, 31, themeColors.cyan);
      if (cueVisible(0, 3)) {
        for (let i = 0; i < 50; i++)
          drawBox(ctx, api, 150 + i * 30, 550, 22, 45, themeColors.cyan, themeColors.panel);
        if (cueComplete(0, 3))
          drawText(
            ctx,
            api,
            '2 seconds × 25 positions / second = 50',
            960,
            680,
            35,
            themeColors.cyan,
            'center',
          );
      }
    });
    withStageFocus('codec', () => {
      if (cueVisible(1, 0)) {
        drawText(
          ctx,
          api,
          'Separate acoustic codec sequence · schematic, rate not specified',
          150,
          775,
          28,
          themeColors.yellow,
        );
        for (let i = 0; i < 25; i++)
          drawBox(
            ctx,
            api,
            150 + i * 60,
            820,
            47,
            48,
            i % 2 ? themeColors.green : themeColors.yellow,
          );
        drawText(ctx, api, 'decode → waveform playback', 960, 925, 31, themeColors.green, 'center');
      }
    });
    drawFooter(
      ctx,
      api,
      'Historical model representation · not PCM packet size or current API billing.',
    );
  }
}
export default {
  id: 'audio-representation',
  draw: drawAudioRepresentation,
  cues: [
    'va-audio-representation-0-0',
    'va-audio-representation-0-1',
    'va-audio-representation-0-2',
    'va-audio-representation-0-3',
    'va-audio-representation-1-0',
    'va-audio-representation-1-1',
    'va-audio-representation-1-2',
  ],
};
