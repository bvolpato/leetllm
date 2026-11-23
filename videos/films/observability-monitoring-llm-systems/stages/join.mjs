import { sampleModel } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
export function drawJoin(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('join', state),
    currentBeat = modelState.beat;
  const grid = (labels, x, y, width, height, z = 30) =>
    teaching.grid({
      x,
      y,
      width,
      height,
      rows: labels.length,
      columns: labels[0].length,
      labels,
      fontSize: z,
      fill: themeColors.panel,
      stroke: themeColors.blue,
      textColor: themeColors.ink,
      cellFocusTarget: (row, col) => {
        if (!row) return undefined;
        return [
          col === 0
            ? 'request-identity'
            : col === 1
              ? 'delivery-event'
              : col === 2
                ? 'delivery-event'
                : 'review-receipt',
        ];
      },
    });
  {
    const labels = [
      ['Request', 'Route', 'Output', 'Reviewed outcome'],
      ...modelState.rows.map((r) => [
        r.id,
        r.route,
        r.served ? 'served' : 'withheld',
        r.unsafe === null ? 'pending' : r.unsafe ? 'UNSAFE' : 'safe route',
      ]),
    ];
    grid(labels, 190, 320, 1540, 550, 30);
    api.focus.target('review-counter', () =>
      drawText(
        ctx,
        api,
        `Review receipts ${modelState.received} / 6 · requests remain ${modelState.rows.length} · unsafe observed ${modelState.unsafe}`,
        960,
        965,
        34,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'join',
  draw: drawJoin,
  cues: ['serving-records', 'join-reviews', 'expose-approvals'],
};
