import { clamp } from '../arithmetic.mjs';
import {
  drawExpandedArrow,
  drawExpandedBox,
  drawExpandedFooter,
  drawExpandedLine,
  text as drawExpandedText,
  drawExpandedTile,
} from '../defaults.mjs';
export function drawAudioClock(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cueProgress = (cue, fallback = progress) =>
    state.cues ? api.focus.progress(cue, fallback) : fallback;
  const full = cueProgress('mm-audio-clock-' + currentBeat),
    u = api.phase(full, 0.08, 0.82),
    done = (cue) => (state.cues ? cueProgress(cue, 0) >= 1 - 1e-8 : progress >= 0.95);
  api.focus.target('mm-audio-clock-construction', () => {
    if (currentBeat < 2) {
      const raw = 4000,
        compressed = 400;
      drawExpandedText(
        ctx,
        api,
        '40-second recording   ·   example frontend at 100 steps per second',
        960,
        290,
        32,
        themeColors.ink,
        'center',
      );
      const size = 36,
        x = 210,
        y = 390;
      for (let i = 0; i < 100; i++) {
        const col = i % 25,
          row = Math.floor(i / 25);
        api.rect(
          ctx,
          x + col * size,
          y + row * size,
          size - 3,
          size - 3,
          themeColors.blue,
          themeColors.panel,
          0,
        );
      }
      drawExpandedText(
        ctx,
        api,
        'One second shown: 100 steps',
        660,
        610,
        30,
        themeColors.blue,
        'center',
      );
      if (currentBeat === 0) {
        const value = Math.round(u * raw);
        api.rect(ctx, 220, 710, 1420 * u, 70, themeColors.blue, undefined, 0);
        drawExpandedText(
          ctx,
          api,
          done('mm-audio-raw')
            ? '40 × 100 = 4,000 frontend steps'
            : '40 seconds × 100 steps per second',
          960,
          850,
          35,
          themeColors.cyan,
          'center',
        );
      } else {
        for (let g = 0; g < 10; g++) {
          const gx = 1150 + (g % 2) * 260,
            gy = 380 + Math.floor(g / 2) * 72;
          drawExpandedBox(ctx, api, gx, gy, 210, 48, themeColors.cyan);
          drawExpandedText(
            ctx,
            api,
            'group ' + (g + 1),
            gx + 105,
            gy + 34,
            26,
            themeColors.cyan,
            'center',
          );
        }
        drawExpandedArrow(ctx, api, 1130, 800, 1280, 800, themeColors.yellow, u);
        if (done('mm-audio-reduced')) {
          drawExpandedText(ctx, api, '4,000 / 10 = 400', 960, 855, 38, themeColors.green, 'center');
          drawExpandedText(
            ctx,
            api,
            '101 steps → 11 padded groups',
            960,
            935,
            31,
            themeColors.yellow,
            'center',
          );
        }
      }
      drawExpandedFooter(
        ctx,
        api,
        'Encoder input work remains · temporal aggregation can lose a short alarm.',
      );
    } else {
      const x0 = 250,
        x1 = 1680,
        y = 600;
      drawExpandedLine(ctx, api, x0, y, x1, y, themeColors.muted, 4);
      for (let i = 0; i < 9; i++) {
        const x = x0 + (i * (x1 - x0)) / 8;
        drawExpandedLine(ctx, api, x, y - 12, x, y + 12, themeColors.muted, 3);
      }
      drawExpandedText(
        ctx,
        api,
        'Recording-relative word interval',
        960,
        350,
        34,
        themeColors.blue,
        'center',
      );
      api.rect(ctx, 750, 470, 270, 80, themeColors.blue, undefined, 0);
      drawExpandedText(ctx, api, 'spoken words', 885, 520, 28, themeColors.bg, 'center');
      drawExpandedArrow(ctx, api, 885, 660, 885, 790, themeColors.cyan, u);
      drawExpandedTile(
        ctx,
        api,
        'recording start + clock map',
        600,
        820,
        570,
        80,
        themeColors.cyan,
      );
      drawExpandedText(ctx, api, 'event identity?', 1480, 470, 31, themeColors.pink, 'center');
      drawExpandedText(ctx, api, 'event time?', 1480, 540, 31, themeColors.pink, 'center');
      drawExpandedFooter(
        ctx,
        api,
        'Within-recording position spacing and event-to-UTC attribution are different contracts.',
      );
    }
  });
}
export default {
  id: 'audio-clock',
  draw: drawAudioClock,
  cues: [
    'mm-audio-clock-0',
    'mm-audio-raw',
    'mm-audio-clock-1',
    'mm-audio-reduced',
    'mm-audio-clock-2',
  ],
};
