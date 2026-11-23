import { clamp, cue, done, lerpRow, slice14 } from '../arithmetic.mjs';
import { INPUT, MODEL, residualSpatialFrame } from '../model.mjs';
import {
  caption,
  equation,
  plane,
  plotPoint,
  pointReference,
  row,
  stateStrip,
  stateVector,
  target,
  text,
  vectorArrow,
  withTransformerLegacyFrame,
} from '../defaults.mjs';
export function paintResidual(ctx, scene, state, api, C, b, P, f) {
  if (b === 0) {
    const current = residualSpatialFrame(state),
      z = current.factor === 1 ? 0 : clamp((1 - current.factor) / 0.65),
      lo = -1.7 + 1.3 * z,
      hi = 1.8 - 1.6 * z,
      ly = -1.5 + 1.1 * z,
      hy = 2 - 1.8 * z,
      plot = plane(ctx, api, [lo, hi], [ly, hy], [[0], [0]]);
    text(
      ctx,
      api,
      C,
      'camera span ' + f(hi - lo, 2) + ' × ' + f(hy - ly, 2) + ' units',
      1420,
      560,
      27,
      C.muted,
      'center',
    );
    text(
      ctx,
      api,
      C,
      'the · output projection · coordinate 1 / 4 close-up',
      960,
      242,
      30,
      C.yellow,
      'center',
    );
    vectorArrow(ctx, api, plot, [0, 0], slice14(MODEL.A[2]), C.muted, 3);
    target(ctx, api, 'attention-update', () => {
      vectorArrow(ctx, api, plot, [0, 0], slice14(current.update), C.cyan, 7);
      text(ctx, api, C, 'attention × ' + f(current.factor, 3), 1420, 650, 33, C.cyan, 'center');
      row(ctx, api, C, f, current.update, 1080, 735, 700, C.cyan, 78, 3);
    });
    text(ctx, api, C, 'the · original input stays saved', 1420, 370, 31, C.blue, 'center');
    text(
      ctx,
      api,
      C,
      'X = [' + INPUT[2].map((v) => f(v, 2)).join(', ') + ']',
      1420,
      460,
      29,
      C.blue,
      'center',
    );
    text(ctx, api, C, 'full four-coordinate attention update', 1420, 870, 26, C.muted, 'center');
  } else if (b === 1) {
    const current = residualSpatialFrame(state),
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
      original = plotPoint(ctx, api, plot, slice14(INPUT[2]));
    text(
      ctx,
      api,
      C,
      'the · translate the update onto the original state',
      960,
      242,
      30,
      C.yellow,
      'center',
    );
    api.circle(ctx, original.x, original.y, 13, C.blue);
    text(ctx, api, C, 'X', original.x + 26, original.y + 9, 30, C.blue);
    target(ctx, api, 'residual-result', () => {
      if (current.added > 0) {
        vectorArrow(ctx, api, plot, slice14(INPUT[2]), slice14(current.current), C.cyan);
        pointReference(
          ctx,
          api,
          C,
          plot,
          slice14(current.current),
          slice14(INPUT[2]),
          done(current.added) ? 'Y' : 'state',
          C.green,
          'residual-state-reference',
        );
      }
      stateStrip(ctx, api, C, f, INPUT[2], MODEL.Y[2], current.added);
      text(
        ctx,
        api,
        C,
        done(current.added)
          ? 'contextual state Y · addition complete'
          : 'adding attention update · ' + Math.round(100 * current.added) + '%',
        1420,
        650,
        30,
        C.green,
        'center',
      );
    });
    text(
      ctx,
      api,
      C,
      'same coordinate indices · equal-unit close-up',
      1420,
      390,
      29,
      C.muted,
      'center',
    );
    equation(ctx, api, C, 'Y=X+0.35A', 1420, 500, 45, C.green);
  } else {
    text(
      ctx,
      api,
      C,
      'contextual state waits for the second addition',
      960,
      320,
      32,
      C.blue,
      'center',
    );
    stateVector(ctx, api, C, f, MODEL.Y[2], 365, C.blue, 'residual-result');
    text(
      ctx,
      api,
      C,
      'normalized view enters the feed-forward layer',
      960,
      650,
      32,
      C.yellow,
      'center',
    );
    target(ctx, api, 'ffn-input', () =>
      row(
        ctx,
        api,
        C,
        f,
        lerpRow(MODEL.Y[2], MODEL.ffnInput[2], cue(state, 'next-normalization')),
        420,
        705,
        1100,
        C.yellow,
        88,
        3,
      ),
    );
  }
  caption(
    ctx,
    api,
    C,
    'Same token and four-coordinate residual stream · projected views are labeled',
  );
}
export function drawResidualStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintResidual);
}
export default {
  id: 'residual',
  draw: drawResidualStage,
  cues: ['output-project', 'residual-add', 'next-normalization'],
};
