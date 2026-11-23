import { chapterModel, completed } from '../construction.mjs';
import { drawChapterBox, drawChapterTarget, drawChapterText } from '../defaults.mjs';
export function drawEngramDoorbell(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('engram-doorbell', state),
    currentBeat = m.b,
    progress2 = m.p;
  const done = (cue, fallback = false) => completed(state, cue, fallback);
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-engram-doorbell-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'One queue of fetches per peer',
      960,
      275,
      35,
      themeColors.yellow,
      'center',
    );
    const final = done('de-doorbell-final', currentBeat > 0),
      flush = done('de-doorbell-flush', currentBeat > 0);
    ['Peer A', 'Peer B'].forEach((peer, i) => {
      drawChapterText(ctx, api, peer, 300, 420 + i * 245, 32, themeColors.blue);
      [0, 1, 2].forEach((j) => {
        drawChapterBox(
          ctx,
          api,
          'get ' + j,
          550 + j * 330,
          350 + i * 245,
          290,
          j === 2 ? (final ? themeColors.green : themeColors.pink) : themeColors.blue,
          100,
        );
        drawChapterText(
          ctx,
          api,
          j === 2 ? (final ? 'unaggregated final' : 'tail still queued') : 'aggregated request',
          695 + j * 330,
          510 + i * 245,
          25,
          j === 2 ? themeColors.pink : themeColors.muted,
          'center',
        );
      });
    });
    drawChapterText(
      ctx,
      api,
      flush
        ? 'Doorbell submission + asynchronous flush recorded'
        : 'Last fetch waiting for submission',
      960,
      920,
      33,
      flush ? themeColors.green : themeColors.pink,
      'center',
    );
    drawChapterText(
      ctx,
      api,
      'Compare the returned tail entry on each peer',
      960,
      1020,
      28,
      themeColors.muted,
      'center',
    );
  });
}
export default {
  id: 'engram-doorbell',
  draw: drawEngramDoorbell,
  cues: [
    'de-engram-doorbell-b0',
    'de-doorbell-final',
    'de-doorbell-flush',
    'de-engram-doorbell-b1',
  ],
};
