import { clamp, smooth } from '../arithmetic.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { drawCard, drawText } from '../defaults.mjs';
export function drawFrontier(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleOriginalModel('frontier', state);
  {
    const current = drawCard(
      ctx,
      api,
      modelState.current ? new URL(modelState.current).pathname : 'Fetch slot · waiting',
      170,
      370,
      420,
      themeColors.yellow,
      100,
      32,
    );
    drawText(ctx, api, 'FIFO queue', 1050, 285, 34, themeColors.cyan, 'center');
    const queue = api.focus.target(
      'frontier-array-from-length-4-i-s-queue-i-new-url-s-queue-i-pathname-empty',
      () =>
        teaching.grid({
          x: 650,
          y: 325,
          width: 820,
          height: 145,
          rows: 1,
          columns: 4,
          labels: [
            Array.from(
              {
                length: 4,
              },
              (_, i) => (modelState.queue[i] ? new URL(modelState.queue[i]).pathname : 'empty'),
            ),
          ],
          fill: themeColors.panel,
          stroke: themeColors.blue,
          textColor: themeColors.ink,
          fontSize: 29,
        }),
    );
    if (modelState.dequeued && !modelState.arrived) {
      const m = smooth(clamp((modelState.transition - 0.2) / 0.4));
      drawCard(
        ctx,
        api,
        new URL(modelState.transitionUrl).pathname + ' · dequeue',
        650 - 480 * m,
        485,
        270,
        themeColors.yellow,
        60,
        25,
      );
    }
    drawText(
      ctx,
      api,
      modelState.published
        ? 'Fetch complete → publish outgoing claims'
        : modelState.arrived
          ? 'URL handed to fetch outside queue'
          : 'Replay the FIFO head transition',
      170,
      1020,
      25,
      themeColors.muted,
    );
    drawText(ctx, api, 'Claimed set', 1050, 560, 34, themeColors.yellow, 'center');
    api.focus.target(
      'frontier-array-from-length-4-i-s-seen-i-new-url-s-seen-i-pathname-empty',
      () =>
        teaching.grid({
          x: 650,
          y: 590,
          width: 820,
          height: 145,
          rows: 1,
          columns: 4,
          labels: [
            Array.from(
              {
                length: 4,
              },
              (_, i) => (modelState.seen[i] ? new URL(modelState.seen[i]).pathname : 'empty'),
            ),
          ],
          fill: themeColors.panel,
          stroke: themeColors.yellow,
          textColor: themeColors.ink,
          fontSize: 29,
        }),
    );
    drawText(
      ctx,
      api,
      'Fetched order: ' + modelState.order.map((url) => new URL(url).pathname).join('  ·  '),
      960,
      870,
      34,
      themeColors.green,
      'center',
    );
    const observed = modelState.inspected;
    drawText(
      ctx,
      api,
      modelState.index === 0
        ? 'No outgoing links inspected yet'
        : `Observed: ${observed.fragments} fragment normalized · ${observed.offOrigin} off-origin excluded · ${observed.duplicates.length} duplicate links skipped`,
      960,
      950,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'frontier',
  draw: drawFrontier,
  cues: ['frontier-beat-1-focus-1', 'frontier-beat-1-focus-2', 'frontier-beat-2-focus-1'],
};
