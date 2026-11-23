import { wilson } from '../arithmetic.mjs';
import { after, decision } from '../circulation.mjs';

const xAt = (rate) => 230 + 1400 * rate;
const floor = 0.85;

function ruler(ctx, api, y) {
  const { C } = api;
  api.line(ctx, xAt(0), y, xAt(1), y, C.muted, 3);
  for (let i = 0; i <= 10; i++) {
    const x = xAt(i / 10);
    api.line(ctx, x, y - 9, x, y + 9, C.muted, 2);
    api.text(ctx, (i / 10).toFixed(1), x, y + 53, 28, C.muted, 'center');
  }
}

function interval(ctx, api, w, y, extent = 1, labels = true) {
  const { C } = api;
  const lo = xAt(w.center - extent * w.radius),
    hi = xAt(w.center + extent * w.radius);
  api.line(ctx, lo, y, hi, y, C.cyan, 8);
  api.circle(ctx, xAt(w.center), y, 9, C.cyan);
  for (const [x, value] of [
    [lo, w.lower],
    [hi, w.upper],
  ]) {
    api.line(ctx, x, y - 20, x, y + 20, C.cyan, 4);
    if (labels) {
      const nearFloor = value > floor && value - floor < 0.035;
      api.text(
        ctx,
        value.toFixed(3),
        x + (nearFloor ? 4 : 0),
        y - 34,
        32,
        C.cyan,
        nearFloor ? 'left' : 'center',
      );
    }
  }
}

function threshold(ctx, api, top, bottom) {
  const x = xAt(floor);
  api.line(ctx, x, top, x, bottom, api.C.yellow, 4);
  api.text(ctx, 'Floor 0.85', x, top - 25, 32, api.C.yellow, 'center');
}

export default {
  id: 'uncertainty',
  cues: [
    'wilson-center',
    'wilson-radius',
    'wilson-endpoints',
    'small-interval',
    'large-case',
    'large-interval',
    'lower-gate',
    'all-pass-bound',
    'bound-question',
    'bound-result',
    'regression-groups',
    'denominator',
    'hard-veto',
  ],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    const pilot = wilson(2, 3);
    focus.target('uncertainty-mechanism', () => {
      if (state.beat === 0) {
        api.text(ctx, 'Workload sample   ·   2 of 3 pass   ·   z = 1.96', 165, 280, 40, C.ink);
        if (focus.visible('wilson-center')) {
          api.math(ctx, String.raw`c=\frac{p+z^2/(2n)}{1+z^2/n}`, 510, 435, 42, C.cyan, 'center');
          api.text(ctx, 'Center   ' + pilot.center.toFixed(3), 510, 555, 35, C.ink, 'center');
        }
        if (focus.visible('wilson-radius')) {
          api.math(
            ctx,
            String.raw`r=\frac{z}{1+z^2/n}\sqrt{\frac{p(1-p)}{n}+\frac{z^2}{4n^2}}`,
            1320,
            435,
            40,
            C.cyan,
            'center',
          );
          api.text(ctx, 'Radius   ' + pilot.radius.toFixed(3), 1320, 555, 35, C.ink, 'center');
        }
        ruler(ctx, api, 807);
        if (focus.visible('wilson-center')) api.circle(ctx, xAt(pilot.center), 735, 10, C.cyan);
        if (focus.visible('wilson-endpoints'))
          interval(ctx, api, pilot, 735, focus.progress('wilson-endpoints', 0), false);
        api.text(ctx, 'p = 2/3     n = 3', 960, 952, 38, C.ink, 'center');
      } else if (state.beat === 1) {
        const expanded = wilson(27, 30);
        threshold(ctx, api, 295, 735);
        api.text(ctx, 'Pilot   ·   2 / 3 pass', 170, 367, 39, C.ink);
        if (after(state, 'small-interval')) interval(ctx, api, pilot, 464);
        if (focus.visible('large-case') || focus.visible('large-interval')) {
          api.text(ctx, 'New sample   ·   27 / 30 pass', 170, 575, 39, C.ink);
          api.circle(ctx, xAt(27 / 30), 693, 10, C.ink);
          api.text(ctx, 'Rate 0.90', xAt(27 / 30) + 22, 704, 27, C.ink);
        }
        if (after(state, 'large-interval')) interval(ctx, api, expanded, 646);
        ruler(ctx, api, 758);
        if (after(state, 'lower-gate'))
          decision(
            ctx,
            api,
            'BLOCK · lower endpoint ' + expanded.lower.toFixed(3) + ' is below 0.85',
            C.pink,
          );
      } else if (state.beat === 2 || state.beat === 3) {
        const n = 25,
          all = wilson(n, n);
        api.text(ctx, 'New sample   ·   25 / 25 pass', 165, 300, 46, C.ink);
        if (focus.visible('all-pass-bound')) {
          api.math(
            ctx,
            String.raw`L=\frac{n}{n+z^2}=\frac{25}{25+1.96^2}`,
            570,
            495,
            48,
            C.cyan,
            'center',
          );
        }
        threshold(ctx, api, 488, 760);
        ruler(ctx, api, 780);
        api.circle(ctx, xAt(1), 700, 12, C.ink);
        api.text(ctx, 'Rate 1.00', xAt(1) + 22, 709, 27, C.ink);
        if (after(state, 'bound-result')) interval(ctx, api, all, 640);
        if (after(state, 'bound-result'))
          decision(
            ctx,
            api,
            'Pass the uncertainty gate   ·   ' + all.lower.toFixed(3) + ' ≥ 0.85',
            C.green,
          );
        else if (focus.visible('bound-question'))
          decision(ctx, api, 'Does the lower endpoint clear 0.85?');
      } else {
        for (let i = 0; i < 3; i++) {
          const x = 190 + 550 * i;
          api.text(ctx, 'Task ' + (i + 1), x, 350, 43, C.ink, 'left', 'serif');
          for (let j = 0; j < 4; j++) api.circle(ctx, x + 30 + 84 * j, 492, 22, C.cyan);
          if (focus.visible('regression-groups'))
            api.line(ctx, x + 5, 553, x + 312, 553, C.yellow, 4);
        }
        api.text(ctx, '12 runs   ·   3 tasks', 960, 705, 56, C.ink, 'center');
        if (focus.visible('denominator'))
          api.text(
            ctx,
            'Count crashes and exhausted budgets in the declared denominator.',
            960,
            810,
            34,
            C.muted,
            'center',
          );
        if (focus.visible('hard-veto'))
          decision(ctx, api, 'A forbidden action still fails its own gate.', C.pink);
      }
    });
  },
};
