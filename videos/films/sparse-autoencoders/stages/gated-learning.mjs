import { box, cue, foot, head, rectangle, textLabel } from '../defaults.mjs';
export function drawGatedLearning(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors, teaching: teaching } = api;
  const seen = (id) => cue(ctx, api, id) > 0;
  api.focus.target('gated-learning-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Gated SAE: one detection path and a magnitude path');
      const input = box(ctx, api, 'observed activation x', 160, 470, 440, themeColors.blue),
        gate = box(ctx, api, 'binary gate: ON', 810, 350, 450, themeColors.cyan),
        mag = box(
          ctx,
          api,
          seen('gated-magnitude') ? 'nonnegative magnitude' : 'magnitude estimate',
          810,
          630,
          450,
          themeColors.green,
        ),
        out = box(ctx, api, 'gate × magnitude', 1460, 470, 340, themeColors.yellow);
      api.connect(ctx, input, gate, {
        color: themeColors.cyan,
        gap: 20,
      });
      api.connect(ctx, input, mag, {
        color: themeColors.green,
        gap: 20,
      });
      api.connect(ctx, gate, out, {
        color: themeColors.cyan,
        gap: 20,
      });
      api.connect(ctx, mag, out, {
        color: themeColors.green,
        gap: 20,
      });
      textLabel(
        ctx,
        api,
        'L1 pressure → rectified gate pre-activation',
        960,
        855,
        31,
        themeColors.cyan,
        'center',
      );
      if (seen('gated-aux-stop'))
        textLabel(
          ctx,
          api,
          'Auxiliary reconstruction: decoder parameters STOPPED',
          960,
          950,
          32,
          themeColors.pink,
          'center',
        );
      foot(ctx, api, 'Shared directions and reconstruction gradients can still change magnitude');
    } else {
      head(ctx, api, 'JumpReLU retains full pre-activation strictly above θ');
      const plot = teaching.axes({
        x: 230,
        y: 430,
        width: 1000,
        height: 380,
        xDomain: [0, 1.5],
        yDomain: [0, 1.5],
        xTicks: [0, 0.5, 1, 1.5],
        yTicks: [0, 0.5, 1, 1.5],
        xLabel: 'pre-activation',
        yLabel: 'output',
        fontSize: 28,
      });
      teaching.curve({
        plot,
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 0.5,
            y: 0,
          },
        ],
        color: themeColors.blue,
        width: 4,
      });
      teaching.curve({
        plot,
        points: [
          {
            x: 0.5001,
            y: 0.5001,
          },
          {
            x: 1.5,
            y: 1.5,
          },
        ],
        color: themeColors.cyan,
        width: 4,
      });
      textLabel(ctx, api, 'Supplied θ=0.5', 1510, 490, 31, themeColors.yellow, 'center');
      if (seen('jump-window')) {
        const lo = plot.point(0.4, 0),
          hi = plot.point(0.6, 1.5);
        rectangle(ctx, api, lo.x, hi.y, hi.x - lo.x, lo.y - hi.y, themeColors.pink, null);
        textLabel(ctx, api, 'custom windowed STE', 1510, 690, 31, themeColors.pink, 'center');
      }
      foot(
        ctx,
        api,
        'Bandwidth trades bias and variance; compare architectures at matched conditions',
      );
    }
  });
}
export default {
  id: 'gated-learning',
  draw: drawGatedLearning,
  cues: [
    'gated-learning-b0',
    'gated-magnitude',
    'gated-aux-stop',
    'gated-learning-b1',
    'jump-threshold',
    'jump-window',
  ],
};
