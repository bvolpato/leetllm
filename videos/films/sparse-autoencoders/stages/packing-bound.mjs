import {
  L,
  arrow,
  axes,
  box,
  cue,
  equation,
  foot,
  head,
  rectangle,
  textLabel,
} from '../defaults.mjs';
export function drawPackingBound(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors, teaching: teaching } = api;
  const seen = (id) => cue(ctx, api, id) > 0;
  api.focus.target('packing-bound-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Orthogonal capacity and approximate finite-point geometry differ');
      const plot = axes(ctx, api);
      arrow(ctx, api, plot, [0, 0], [2, 0], themeColors.blue);
      arrow(ctx, api, plot, [0, 0], [0, 1.5], themeColors.cyan);
      textLabel(
        ctx,
        api,
        'D=2: at most two mutually orthogonal directions',
        1360,
        430,
        29,
        themeColors.blue,
        'center',
      );
      if (seen('jl-projection')) {
        equation(ctx, api, String.raw`d=O(\epsilon^{-2}\log N)`, 1360, 620, 42);
        textLabel(
          ctx,
          api,
          'finite N points · suitable random map',
          1360,
          760,
          29,
          themeColors.cyan,
          'center',
        );
        textLabel(
          ctx,
          api,
          'pairwise squared distances within 1±ε',
          1360,
          845,
          28,
          themeColors.yellow,
          'center',
        );
      }
      foot(ctx, api, 'A distance-preserving map does not certify learned feature recovery');
    } else if (currentBeat === 1) {
      head(ctx, api, 'Independent ±1/√D coordinates · random-construction bound');
      equation(ctx, api, String.raw`P(\mathrm{failure})\le M(M-1)e^{-D\epsilon^2/2}`, 960, 425, 50);
      const plot = teaching.axes({
        x: 240,
        y: 600,
        width: 1050,
        height: 270,
        xDomain: [0, 12],
        yDomain: [0, 2],
        xTicks: [0, 4, 8, 12],
        yTicks: [0, 1, 2],
        xLabel: 'D ε² / 2',
        yLabel: 'bound',
        fontSize: 28,
      });
      teaching.curve({
        plot,
        points: Array.from(
          {
            length: 121,
          },
          (_, i) => ({
            x: i / 10,
            y: 6 * Math.exp(-i / 10),
          }),
        ).filter((v) => v.y <= 2),
        color: themeColors.cyan,
        width: 4,
      });
      textLabel(ctx, api, 'Illustration: M=3', 1510, 680, 30, themeColors.blue, 'center');
      if (seen('random-bound'))
        textLabel(
          ctx,
          api,
          'A bound above 1 is uninformative',
          1510,
          810,
          29,
          themeColors.pink,
          'center',
        );
      foot(ctx, api, 'Many low-overlap directions do not give an exact model capacity claim');
    } else {
      head(ctx, api, 'One inactive probe · twelve active unit coefficients');
      const count = seen('coherence-accumulate') ? 12 : 0;
      for (let i = 0; i < 12; i++) {
        const x = 180 + i * 135;
        rectangle(ctx, api, x, 410, 105, 100, themeColors.blue);
        textLabel(ctx, api, i < count ? '1' : '?', x + 52, 473, 34, themeColors.blue, 'center');
        if (i < count) L(ctx, api, x + 52, 525, 960, 700, themeColors.muted, 2);
      }
      const interference = count * 0.1;
      textLabel(
        ctx,
        api,
        'Supplied aligned overlaps: each +0.1; μ=0.1',
        960,
        345,
        30,
        themeColors.cyan,
        'center',
      );
      box(
        ctx,
        api,
        'inactive probe receives ' + interference.toFixed(1),
        600,
        720,
        720,
        themeColors.pink,
      );
      equation(ctx, api, String.raw`|d_j^\top x|\le\mu\sum_{i\in A}|z_i|`, 960, 925, 43);
      if (seen('coherence-threshold'))
        textLabel(
          ctx,
          api,
          '1.2 > threshold 1 → false activation is possible',
          960,
          1000,
          31,
          themeColors.pink,
          'center',
        );
    }
  });
}
export default {
  id: 'packing-bound',
  draw: drawPackingBound,
  cues: [
    'packing-bound-b0',
    'jl-projection',
    'packing-bound-b1',
    'random-bound',
    'packing-bound-b2',
    'coherence-accumulate',
    'coherence-threshold',
  ],
};
