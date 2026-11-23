import { pipelineFrame } from '../model.mjs';
import { equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawPipeline(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const F = api.components.fade;
  {
    const frame = pipelineFrame(state);
    optionalFocusTarget(
      ctx,
      api,
      'pipeline-object-training-values-2-4-6-held-out-value-20-27',
      () =>
        text(
          ctx,
          api,
          'Training values 2, 4, 6 · held-out value 20',
          960,
          295,
          34,
          themeColors.ink,
          'center',
        ),
    );
    text(
      ctx,
      api,
      'The same observations move when the centering origin changes',
      960,
      365,
      28,
      themeColors.muted,
      'center',
    );
    const q = api.teaching.axes({
      x: 300,
      y: 465,
      width: 850,
      height: 320,
      xDomain: [-10, 22],
      yDomain: [-0.5, 3.5],
      xTicks: [-8, 0, 8, 16],
      yTicks: [],
      xLabel: 'centered feature value',
      yLabel: '',
    });
    const zeroTop = q.point(0, 3.5),
      zeroBottom = q.point(0, -0.5);
    api.line(ctx, zeroTop.x, zeroTop.y, zeroBottom.x, zeroBottom.y, '#f4d47780', 3);
    text(ctx, api, 'current', 1215, 435, 22, themeColors.muted, 'right');
    optionalFocusTarget(ctx, api, 'pipeline-transformed-observations', () =>
      frame.rows.forEach((row, index) => {
        const y = 3 - index,
          left = q.point(-10, y),
          right = q.point(22, y),
          at = q.point(row.centered, y);
        api.line(ctx, left.x, left.y, right.x, right.y, '#43516a66', 2);
        text(
          ctx,
          api,
          `${row.heldOut ? 'held out' : 'train'} · ${row.raw}`,
          270,
          at.y + 10,
          25,
          row.heldOut ? themeColors.pink : themeColors.blue,
          'right',
        );
        api.teaching.scatter({
          plot: q,
          points: [
            {
              x: row.centered,
              y,
              color: row.heldOut ? themeColors.pink : themeColors.blue,
              radius: 12,
            },
          ],
        });
        text(
          ctx,
          api,
          Math.abs(row.centered) < 0.05 ? '0.0' : row.centered.toFixed(1),
          1215,
          at.y + 10,
          25,
          row.heldOut ? themeColors.pink : themeColors.blue,
          'right',
        );
      }),
    );
    optionalFocusTarget(ctx, api, 'pipeline-object-training-only-fitted-mean-32', () =>
      api.components.card({
        label: `Training-only fitted mean · ${frame.trainingMean}`,
        x: 1250,
        y: 455,
        width: 560,
        height: 90,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.blue,
        fontSize: 28,
      }),
    );
    optionalFocusTarget(ctx, api, 'pipeline-object-all-row-fitted-mean-33', () =>
      api.components.card({
        label: `All-row fitted mean · ${frame.allMean}`,
        x: 1250,
        y: 590,
        width: 560,
        height: 90,
        fill: themeColors.panel,
        stroke: themeColors.pink,
        textColor: themeColors.pink,
        fontSize: 28,
      }),
    );
    text(ctx, api, 'Fixed reference fits', 1530, 415, 27, themeColors.muted, 'center');
    equation(
      ctx,
      api,
      `${frame.transitioning ? 'c' : '\\mu'}=${frame.origin.toFixed(1)}`,
      1530,
      795,
      58,
      themeColors.yellow,
      'center',
    );
    text(
      ctx,
      api,
      frame.transitioning
        ? 'Transition origin · between the two fits'
        : frame.mix === 0
          ? 'Current origin · training-only mean'
          : 'Current origin · held-out included',
      1530,
      870,
      26,
      frame.mix === 0
        ? themeColors.blue
        : frame.transitioning
          ? themeColors.yellow
          : themeColors.red,
      'center',
    );
    {
    }
  }
}
export default {
  id: 'pipeline',
  draw: drawPipeline,
  cues: [
    'pipeline-beat-1-focus-1',
    'pipeline-beat-1-focus-2',
    'pipeline-beat-2-focus-1',
    'pipeline-beat-3-focus-1',
    'pipeline-beat-3-focus-2',
  ],
};
