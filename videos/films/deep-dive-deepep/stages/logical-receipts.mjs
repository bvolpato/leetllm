import { chapterModel, completed } from '../construction.mjs';
import { drawChapterEquation, drawChapterTarget, drawChapterText } from '../defaults.mjs';
export function drawLogicalReceipts(ctx, scene, state, api) {
  const { C: themeColors } = api,
    m = chapterModel('logical-receipts', state),
    currentBeat = m.b,
    progress2 = m.p;
  const done = (cue, fallback = false) => completed(state, cue, fallback);
  const progress = Math.max(0, Math.min(1, (progress2 - 0.07) / 0.65));
  drawChapterTarget(ctx, api, 'de-logical-receipts-mechanism', () => {
    drawChapterText(
      ctx,
      api,
      'Same payload and interval · two observation boundaries',
      960,
      275,
      35,
      themeColors.yellow,
      'center',
    );
    const x = 220,
      w = 1460;
    api.rect(ctx, x, 400, w, 110, themeColors.panel, themeColors.muted, 3);
    api.rect(ctx, x, 400, w / 2, 110, themeColors.blue, undefined, 0);
    api.rect(ctx, x + w / 2, 400, w / 2, 110, themeColors.pink, undefined, 0);
    drawChapterText(ctx, api, '50 MiB local', 585, 465, 32, themeColors.ink, 'center');
    drawChapterText(ctx, api, '50 MiB remote', 1315, 465, 32, themeColors.ink, 'center');
    drawChapterText(
      ctx,
      api,
      'Dispatch counts both halves. Only the remote rows cross the network.',
      960,
      580,
      29,
      themeColors.muted,
      'center',
    );
    if (currentBeat) {
      drawChapterText(
        ctx,
        api,
        done('de-byte-conversion') ? '1 MiB = 1,048,576 bytes' : 'Convert the payload unit',
        540,
        710,
        32,
        themeColors.cyan,
        'center',
      );
      drawChapterText(
        ctx,
        api,
        done('de-time-conversion') ? '1 ms = .001 s' : 'Convert the interval unit',
        1400,
        710,
        32,
        themeColors.cyan,
        'center',
      );
      drawChapterTarget(ctx, api, 'de-logical-rate-results', () => {
        drawChapterEquation(
          ctx,
          api,
          String.raw`\frac{100\times1,048,576}{0.001\times10^9}` +
            (done('de-rate-completion') ? '=104.8576' : '=?'),
          540,
          850,
          38,
        );
        drawChapterEquation(
          ctx,
          api,
          String.raw`\frac{50\times1,048,576}{0.001\times10^9}` +
            (done('de-rate-completion') ? '=52.4288' : ';=?'),
          1400,
          850,
          38,
        );
      });
      drawChapterText(
        ctx,
        api,
        'Payload rates in decimal GB/s over the same millisecond',
        960,
        1000,
        29,
        themeColors.muted,
        'center',
      );
    }
  });
}
export default {
  id: 'logical-receipts',
  draw: drawLogicalReceipts,
  cues: [
    'de-logical-receipts-b0',
    'de-logical-receipts-b1',
    'de-byte-conversion',
    'de-time-conversion',
    'de-rate-completion',
  ],
};
