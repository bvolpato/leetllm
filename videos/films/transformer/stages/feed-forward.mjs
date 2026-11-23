import { cue, done, event, lerpRow, slice14 } from '../arithmetic.mjs';
import { INPUT, MODEL, ffnSpatialFrame } from '../model.mjs';
import {
  caption,
  equation,
  plane,
  plotPoint,
  pointReference,
  row,
  stateStrip,
  target,
  text,
  vectorArrow,
  withTransformerLegacyFrame,
} from '../defaults.mjs';
export function paintFeedForward(ctx, scene, state, api, C, b, P, f) {
  if (b < 2) {
    const expanded = b === 0 ? Math.floor(cue(state, 'ffn-expand') * 6 + 1e-9) : 6,
      p = event(state, 1, 'ffn-relu');
    text(ctx, api, C, 'the · normalized contextual input', 960, 285, 30, C.yellow, 'center');
    row(ctx, api, C, f, MODEL.ffnInput[2], 500, 320, 920, C.yellow, 80, 3);
    equation(ctx, api, C, '[n_1,n_2,n_3,n_4,n_1-n_2,n_3-n_4]', 960, 505, 40, C.cyan);
    target(ctx, api, 'hidden-preactivation', () => {
      if (b === 0)
        row(
          ctx,
          api,
          C,
          f,
          MODEL.pre[2].map((v, i) => (i < expanded ? v : null)),
          240,
          600,
          1440,
          C.cyan,
          88,
          3,
        );
    });
    target(ctx, api, 'hidden-activation', () => {
      if (b === 1) {
        const values = lerpRow(MODEL.pre[2], MODEL.H[2], p);
        values.forEach((v, i) => {
          const x = 335 + i * 250,
            zero = 730,
            end = zero - v * 90;
          api.line(ctx, x - 80, zero, x + 80, zero, C.muted, 2);
          if (Math.abs(v) > 0.0001)
            api.rect(
              ctx,
              x - 28,
              Math.min(zero, end),
              56,
              Math.abs(end - zero),
              v < 0 ? C.pink : C.green,
            );
          text(ctx, api, C, f(v, 3), x, 910, 29, v < 0 ? C.pink : C.green, 'center');
        });
      }
    });
    caption(
      ctx,
      api,
      C,
      b === 0
        ? 'Four inputs expand into six actual preactivation values'
        : p === 1
          ? 'ReLU(z) = max(0,z) · negative bars reach zero, positive bars remain'
          : 'Which bars will still stand after ReLU?',
    );
  } else {
    const current = ffnSpatialFrame(state),
      plot = plane(
        ctx,
        api,
        [-0.3, 0.5],
        [0.7, 1.5],
        [
          [-0.2, 0, 0.2, 0.4],
          [0.8, 1, 1.2, 1.4],
        ],
      ),
      x = plotPoint(ctx, api, plot, slice14(INPUT[2]));
    text(
      ctx,
      api,
      C,
      'the · second addition · coordinate 1 / 4 close-up',
      960,
      242,
      30,
      C.yellow,
      'center',
    );
    vectorArrow(ctx, api, plot, slice14(INPUT[2]), slice14(MODEL.Y[2]), C.blue, 3);
    api.circle(ctx, x.x, x.y, 8, C.blue);
    text(ctx, api, C, 'X', x.x + 26, x.y + 9, 27, C.blue);
    pointReference(
      ctx,
      api,
      C,
      plot,
      slice14(MODEL.Y[2]),
      slice14(INPUT[2]),
      'Y',
      C.blue,
      'retained-state-reference',
    );
    const j = Math.min(3, Math.floor(current.projected * 4)),
      extra = MODEL.H[2][4 + (j % 2)];
    target(ctx, api, 'ffn-update', () => {
      equation(
        ctx,
        api,
        C,
        'f_' + (j + 1) + '=0.2(' + f(MODEL.H[2][j], 3) + ')+0.05(' + f(extra, 3) + ')',
        1420,
        390,
        35,
        C.cyan,
      );
      text(
        ctx,
        api,
        C,
        'full update [' +
          MODEL.F[2]
            .map((v, k) => (k < Math.floor(current.projected * 4 + 1e-9) ? f(v, 3) : '?'))
            .join(', ') +
          ']',
        1420,
        490,
        29,
        C.cyan,
        'center',
      );
    });
    target(ctx, api, 'block-output', () => {
      if (current.added > 0) {
        vectorArrow(ctx, api, plot, slice14(MODEL.Y[2]), slice14(current.current), C.green);
        pointReference(
          ctx,
          api,
          C,
          plot,
          slice14(current.current),
          slice14(MODEL.Y[2]),
          done(current.added) ? 'Z' : 'state',
          C.green,
          'block-state-reference',
        );
      }
      stateStrip(ctx, api, C, f, MODEL.Y[2], MODEL.Z[2], current.added);
      text(
        ctx,
        api,
        C,
        done(current.added)
          ? 'block output Z · addition complete'
          : 'adding feed-forward update · ' + Math.round(100 * current.added) + '%',
        1420,
        650,
        30,
        C.green,
        'center',
      );
    });
    caption(
      ctx,
      api,
      C,
      'Same equal-unit close-up · coordinate 1 stays fixed while coordinate 4 rises',
    );
  }
}
export function drawFeedForwardStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintFeedForward);
}
export default {
  id: 'feed-forward',
  draw: drawFeedForwardStage,
  cues: ['ffn-expand', 'ffn-relu', 'ffn-project', 'ffn-add'],
};
