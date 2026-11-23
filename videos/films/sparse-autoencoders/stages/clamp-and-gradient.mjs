import { arrow, axes, box, cue, equation, foot, head, textLabel } from '../defaults.mjs';
export function drawClampAndGradient(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    { C: themeColors } = api;
  const done = (id) => cue(ctx, api, id) === 1;
  api.focus.target('clamp-and-gradient-construction', () => {
    if (currentBeat === 0) {
      head(ctx, api, 'Preserve the original unexplained residual');
      equation(ctx, api, String.raw`x=\hat x+e,\qquad x'=x+(c-z_f)d_f`, 960, 430, 55);
      const original = box(ctx, api, 'original residual e', 210, 650, 600, themeColors.blue),
        edit = box(ctx, api, 'edited reconstruction', 1110, 650, 600, themeColors.green);
      api.connect(ctx, original, edit, {
        color: themeColors.yellow,
        gap: 20,
      });
      foot(
        ctx,
        api,
        'Compute the residual once for this edit; recomputing it would undo the intervention',
      );
    } else if (currentBeat === 1) {
      const plot = axes(ctx, api),
        applied = done('clamp-ask'),
        z = applied ? [1, 1.5] : [1, 0.5];
      head(ctx, api, 'Encoder ReLU(x₁+2x₂) · decoder [0,1]');
      arrow(ctx, api, plot, [0, 0], [1, 0.5], themeColors.blue);
      if (applied) arrow(ctx, api, plot, [1, 0.5], z, themeColors.pink);
      textLabel(
        ctx,
        api,
        'cached z=2 · requested c=3',
        1430,
        440,
        31,
        themeColors.yellow,
        'center',
      );
      textLabel(ctx, api, 'original [1,0.5]', 1430, 570, 31, themeColors.blue, 'center');
      if (applied) textLabel(ctx, api, 'edited [1,1.5]', 1430, 680, 33, themeColors.pink, 'center');
      if (done('clamp-reencode')) {
        equation(ctx, api, String.raw`z'=1+2(1.5)=4\ne3`, 1430, 820, 39, themeColors.pink);
      }
      if (done('clamp-sum-result'))
        textLabel(ctx, api, 'sum readout: 1.5 → 2.5', 1430, 930, 30, themeColors.yellow, 'center');
      foot(
        ctx,
        api,
        'The cached decomposition edit is exact; re-encoding need not return its target',
      );
    } else {
      head(ctx, api, 'Original x=[1,0.1] · d=[1,0] · score [3,100]·x=13');
      const live = done('gradient-live'),
        stop = done('gradient-stopped');
      [
        ['live residual', 'e=x−zd', live ? 'dz contribution: +3−3=0' : 'forward value: 13'],
        [
          'stopped original residual',
          'stop_gradient(e)',
          stop ? 'feature derivative: 3' : 'forward value: 13',
        ],
      ].forEach(([title, e, result], i) => {
        const x = 140 + i * 920;
        box(ctx, api, title, x, 380, 720, i ? themeColors.green : themeColors.pink);
        equation(
          ctx,
          api,
          e.includes('_') ? String.raw`\operatorname{stopgrad}(e)` : String.raw`e=x-zd`,
          x + 360,
          620,
          43,
          i ? themeColors.green : themeColors.pink,
        );
        box(ctx, api, result, x, 760, 720, i ? themeColors.green : themeColors.pink);
      });
      foot(ctx, api, 'For multiple hooks, follow the method’s specified pass-through paths');
    }
  });
}
export default {
  id: 'clamp-and-gradient',
  draw: drawClampAndGradient,
  cues: [
    'clamp-and-gradient-b0',
    'clamp-and-gradient-b1',
    'clamp-ask',
    'clamp-reencode',
    'clamp-sum-result',
    'clamp-and-gradient-b2',
    'gradient-live',
    'gradient-stopped',
  ],
};
