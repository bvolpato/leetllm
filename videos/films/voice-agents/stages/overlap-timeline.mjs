import { trace } from '../fixtures.mjs';
import { drawLegacyText, drawTimelineSpan } from '../defaults.mjs';
export function drawOverlapTimeline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1);
  const phaseForBeat = (i, a = 0.07, z = 0.9) =>
    currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(beatProgress, a, z);
  {
    const scale = 2.5,
      origin = 575,
      rows = [
        ['speech end → commit', 365, 0, 60, themeColors.blue],
        ['streaming recognition tail', 455, 0, 100, themeColors.cyan],
        ['first model clause', 545, 60, 240, themeColors.yellow],
        ['first synthesis chunk', 635, 210, 345, themeColors.green],
        ['playout buffer', 725, 345, 380, themeColors.pink],
      ];
    const stageIds = ['commit', 'recognition', 'generation', 'synthesis', 'buffer'];
    rows.forEach(([label, y, start, end, color], i) =>
      api.focus.target('overlap-' + stageIds[i], () => {
        drawLegacyText(ctx, api, label, 150, y + 32, 27, color, 'left');
        const progress = api.focus.progress(
          'overlap-' + stageIds[i] + '-spoken',
          phaseForBeat(Math.min(i, 2)),
        );
        drawTimelineSpan(ctx, api, y, start, end, color, scale, origin, progress);
        drawLegacyText(ctx, api, start + '–' + end + ' ms', 1760, y + 32, 25, color, 'right');
      }),
    );
    api.line(ctx, origin + 380 * scale, 345, origin + 380 * scale, 790, themeColors.yellow, 3);
    const bound = (id, start, y, label, color) =>
      api.focus.target(id, () => {
        const a = origin + start * scale,
          z = origin + trace.firstAudio * scale;
        api.line(ctx, a, y, z, y, color, 4);
        [a, z].forEach((at) => api.line(ctx, at, y - 10, at, y + 10, color, 3));
        drawLegacyText(ctx, api, label, (a + z) / 2, y + 44, 29, color);
      });
    api.focus.reveal('overlap-total-spoken', () =>
      bound(
        'overlap-critical-path',
        trace.speechEnd,
        825,
        'speech end 0 → first audio 380 ms',
        themeColors.cyan,
      ),
    );
    api.focus.reveal('overlap-wait-spoken', () =>
      bound(
        'overlap-commit-wait',
        trace.commit,
        930,
        'commit 60 → first audio 380 = 320 ms',
        themeColors.yellow,
      ),
    );
    api.focus.reveal('overlap-sequential-spoken', () =>
      drawLegacyText(ctx, api, 'Sequential sum: 510 ms', 1720, 305, 27, themeColors.muted, 'right'),
    );
  }
}
export default {
  id: 'overlap-timeline',
  draw: drawOverlapTimeline,
  cues: [
    'overlap-commit-spoken',
    'overlap-recognition-spoken',
    'overlap-generation-spoken',
    'overlap-synthesis-spoken',
    'overlap-buffer-spoken',
    'overlap-sequential-spoken',
    'overlap-total-spoken',
    'overlap-wait-spoken',
  ],
};
