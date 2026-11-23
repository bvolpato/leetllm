import { voiceWorksheet } from '../arithmetic.mjs';
import { drawBox, drawFooter, drawLine, drawText } from '../defaults.mjs';
export function drawMediaOwners(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = state.beatP ?? 0,
    m = voiceWorksheet();
  const cue = (i, j) => {
    const key = `va-media-owners-${i}-${j}`;
    if (state.cues && !Object.hasOwn(state.cues, key))
      throw Error('Unknown voice narration cue: ' + key);
    return state.cues?.[key];
  };
  const cueProgress = (i, j) => {
    const c = cue(i, j);
    return c
      ? c.phase === 'after'
        ? 1
        : c.phase === 'before'
          ? 0
          : c.progress
      : currentBeat > i
        ? 1
        : currentBeat < i
          ? 0
          : beatProgress;
  };
  const cueVisible = (i, j) => {
    const c = cue(i, j);
    return c ? c.phase !== 'before' : currentBeat > i || (currentBeat === i && beatProgress > 0.02);
  };
  const withStageFocus = (name, paint) => api.focus.target(`va-media-owners-${name}`, paint);
  {
    const owners = [
      ['client', 150, 450, themeColors.blue],
      ['media worker', 690, 450, themeColors.cyan],
      ['inference path', 1230, 450, themeColors.yellow],
    ];
    withStageFocus('owners', () => {
      owners.forEach(([s, x, y, c], i) => {
        const paint = () => {
          drawBox(ctx, api, x, y, 450, 190, c);
          drawText(ctx, api, s, x + 25, y + 45, 32, c);
          if (i === 2) {
            drawText(ctx, api, 'recognition + language model', x + 25, y + 90, 24);
            drawText(ctx, api, 'tools + synthesis', x + 25, y + 140, 26);
          }
        };
        if (i === 2) withStageFocus('inference-owner', paint);
        else paint();
      });
      drawText(ctx, api, 'microphone + speaker', 175, 555, 27);
      drawText(ctx, api, 'packet clock + buffer', 715, 555, 27);
    });
    withStageFocus('hot-audio', () => {
      const q = cueProgress(0, 2);
      for (let i = 0; i < 4; i++) {
        const x = 195 + i * 85 + q * 1050;
        drawBox(ctx, api, x, 350, 60, 44, themeColors.cyan, themeColors.cyan);
        drawText(ctx, api, 'F' + (i + 1), x + 30, 382, 24, themeColors.bg, 'center');
      }
      drawText(ctx, api, 'call Alex / reply 1', 150, 300, 29, themeColors.blue);
    });
    withStageFocus('local-mute', () => {
      drawText(ctx, api, 'Local onset control', 175, 680, 28, themeColors.pink);
      if (cueVisible(1, 1)) {
        drawLine(ctx, api, 180, 705, 520, 705, themeColors.pink, 5);
        drawText(ctx, api, 'speech onset → local mute', 175, 755, 28, themeColors.pink);
      }
    });
    withStageFocus('playout-ledger', () => {
      drawText(ctx, api, 'Audio-sink ledger', 800, 760, 31, themeColors.green);
      drawBox(ctx, api, 800, 795, 850, 105, themeColors.green);
      drawText(ctx, api, 'call Alex · reply 1 · confirmed cursor', 825, 858, 28, themeColors.green);
    });
    drawFooter(
      ctx,
      api,
      'A fast inference worker cannot recover a playback deadline already missed.',
    );
  }
}
export default {
  id: 'media-owners',
  draw: drawMediaOwners,
  cues: [
    'va-media-owners-0-0',
    'va-media-owners-0-1',
    'va-media-owners-0-2',
    'va-media-owners-0-3',
    'va-media-owners-1-0',
    'va-media-owners-1-1',
    'va-media-owners-1-2',
    'va-media-owners-1-3',
  ],
};
