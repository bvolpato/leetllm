import { fp16 } from '../arithmetic.mjs';
import { completed, operation, partProgress } from '../construction.mjs';
import { text, valueBox, movingValue } from '../defaults.mjs';
function drawControllerExtension(ctx, scene, state, api) {
  const beat = state.beat ?? 0;
  if (beat < 3) return false;
  const { C } = api;
  const target = `controller-extension-${beat + 1}`;
  api.focus.target(target, () => {
    if (beat === 3) {
      text(
        ctx,
        api,
        'Follow the forward value and the backward derivative separately',
        960,
        280,
        36,
        C.yellow,
        'center',
      );
      const square = operation(state, 'finite-square');
      const loss = operation(state, 'finite-loss');
      const gradient = operation(state, 'finite-gradient');
      valueBox(ctx, api, 'Supplied w = 2', 170, 400, 400, C.blue);
      valueBox(
        ctx,
        api,
        completed(state, 'finite-square') ? 'w² = 4' : 'Squaring w…',
        760,
        400,
        400,
        C.blue,
      );
      valueBox(ctx, api, 'Independent constant: Inf', 1350, 400, 400, C.pink, 27);
      api.arrow(ctx, 590, 445, 740, 445, C.blue, 3);
      movingValue(ctx, api, [590, 445], [740, 445], square, C.yellow);
      api.arrow(ctx, 960, 510, 960, 610, C.pink, 3);
      api.arrow(ctx, 1550, 510, 1170, 610, C.pink, 3);
      movingValue(ctx, api, [1550, 510], [1170, 610], loss, C.pink);
      valueBox(
        ctx,
        api,
        completed(state, 'finite-loss') ? 'Loss = 4 + Inf = Inf' : 'Forward addition pending',
        620,
        620,
        680,
        completed(state, 'finite-loss') ? C.pink : C.muted,
        34,
      );
      api.line(ctx, 960, 710, 960, 760, C.green, 3);
      api.arrow(ctx, 960, 760, 370, 760, C.green, 4);
      api.arrow(ctx, 370, 760, 370, 510, C.green, 4);
      movingValue(ctx, api, [960, 760], [370, 760], partProgress(gradient, 0, 2), C.green);
      movingValue(ctx, api, [370, 760], [370, 510], partProgress(gradient, 1, 2), C.green);
      text(
        ctx,
        api,
        'Backward: d(w²)/dw = 2w; independent constant contributes 0',
        1030,
        795,
        29,
        C.cyan,
        'center',
      );
      valueBox(
        ctx,
        api,
        completed(state, 'finite-gradient')
          ? 'Gradient = 2 × 2 = 4 · finite'
          : 'Backward gradient pending',
        620,
        850,
        900,
        completed(state, 'finite-gradient') ? C.green : C.muted,
        31,
      );
      text(
        ctx,
        api,
        completed(state, 'finite-scaler')
          ? 'Gradient-only scaler can allow the step; validate the loss separately'
          : 'Loss and gradient checks remain separate',
        960,
        1015,
        29,
        C.yellow,
        'center',
      );
    } else {
      text(
        ctx,
        api,
        'Independent optimizer decisions, then one shared scale update',
        960,
        280,
        36,
        C.yellow,
        'center',
      );
      const a = operation(state, 'optimizer-a');
      const b = operation(state, 'optimizer-b');
      for (const [i, name, gradient, amount, ready] of [
        [0, 'A', 'g = 1 · supplied SGD η = 0.1', a, completed(state, 'optimizer-a')],
        [1, 'B', 'g = Inf · independent finite check', b, completed(state, 'optimizer-b')],
      ]) {
        const y = 375 + i * 230;
        valueBox(ctx, api, `Optimizer ${name} · weight 1`, 180, y, 500, C.blue, 30);
        text(ctx, api, gradient, 950, y + 40, 28, C.cyan, 'center');
        api.arrow(ctx, 710, y + 95, 1240, y + 95, C.muted, 3);
        movingValue(ctx, api, [710, y + 95], [1240, y + 95], amount, C.yellow);
        valueBox(
          ctx,
          api,
          ready ? (i ? 'SKIP · weight remains 1' : '1 − 0.1 × 1 = 0.9') : 'Decision pending',
          1260,
          y,
          500,
          ready ? (i ? C.pink : C.green) : C.muted,
          30,
        );
      }
      const scale = operation(state, 'optimizer-shared-scale');
      const decisions = completed(state, 'optimizer-a') && completed(state, 'optimizer-b');
      if (decisions) {
        api.arrow(ctx, 960, 825, 960, 875, C.yellow, 3);
        movingValue(ctx, api, [960, 825], [960, 875], scale, C.yellow);
      }
      valueBox(
        ctx,
        api,
        completed(state, 'optimizer-shared-scale')
          ? 'One shared update: scale 256 → 128'
          : decisions
            ? 'Both decisions finished · shared scale update pending'
            : 'Shared scale stays 256 until both decisions finish',
        380,
        890,
        1160,
        completed(state, 'optimizer-shared-scale') ? C.yellow : C.muted,
        30,
      );
      text(
        ctx,
        api,
        'Atomic joint stepping requires its own algorithm policy',
        960,
        1040,
        28,
        C.muted,
        'center',
      );
    }
  });
  return true;
}
export function drawController(ctx, scene, state, api) {
  if (drawControllerExtension(ctx, scene, state, api)) return;
  const { C } = api;
  const beat = state.beat ?? 0;
  const gradient = 300,
    scale = 256,
    reducedScale = 64;
  const scaled = gradient * scale;
  const cast = fp16(scaled);
  const flight = beat === 0 ? operation(state, 'scale-spike') : 1;
  const castReady = beat > 0 || completed(state, 'controller-b1-2');
  const skipped = beat > 1 || (beat === 1 && completed(state, 'controller-b2-1'));
  const backedOff = beat > 1 || (beat === 1 && completed(state, 'backoff-scale'));
  const wrong = beat === 2 && completed(state, 'controller-b3-1');
  const x = (v) => 270 + (v / 80000) * 1380;
  const cap = 65504;
  const rail = (y) => api.line(ctx, x(0), y, x(80000), y, C.muted, 3);

  text(ctx, api, 'Gradient   ' + gradient, 180, 267, 43, C.ink);
  text(ctx, api, 'This window   ×' + scale, 650, 267, 43, C.ink);
  api.focus.target('overflow-boundary', () => {
    const bottom = backedOff && beat === 1 ? 665 : 525;
    api.line(ctx, x(cap), 370, x(cap), bottom, C.pink, 4);
    text(ctx, api, 'FP16 maximum   65,504', x(cap), 343, 31, C.pink, 'center');
  });
  rail(482);
  api.focus.target('scaled-value', () => {
    const end = x(gradient + (scaled - gradient) * flight);
    if (flight > 0) api.line(ctx, x(gradient), 482, end, 482, C.yellow, 7);
    api.circle(ctx, end, 482, 13, C.yellow);
    if (flight === 1)
      text(ctx, api, scaled.toLocaleString('en-US'), end, 443, 38, C.yellow, 'center');
  });
  api.focus.target('cast-result', () => {
    text(
      ctx,
      api,
      'FP16 store   ' + (castReady ? (Number.isFinite(cast) ? cast : '∞') : '?'),
      1190,
      552,
      39,
      castReady ? C.pink : C.muted,
      'right',
    );
  });
  if (beat === 1) {
    api.focus.target('next-scale', () => {
      if (backedOff) {
        rail(650);
        const retried = fp16(gradient * reducedScale);
        api.line(ctx, x(gradient), 650, x(retried), 650, C.cyan, 7);
        api.circle(ctx, x(retried), 650, 13, C.cyan);
        text(ctx, api, 'Same gradient at scale ' + reducedScale, 270, 611, 30, C.cyan);
        text(
          ctx,
          api,
          'FP16 store   ' + retried.toLocaleString('en-US'),
          x(retried),
          713,
          33,
          C.cyan,
          'center',
        );
      } else {
        text(ctx, api, 'Next window', 270, 650, 31, C.muted);
      }
    });
  }
  if (beat === 0) return;
  api.focus.target('skip-decision', () => {
    const message =
      beat === 2
        ? 'Suppose Adam reads the infinite gradient'
        : skipped
          ? 'Optimizer step skipped'
          : 'Check this optimizer’s gradients';
    text(ctx, api, message, 960, 810, 39, beat === 2 ? C.pink : C.ink, 'center');
  });
  const moments = [
    ['Weight', '1.00'],
    ['Adam m', wrong ? '∞' : '0.20'],
    ['Adam v', wrong ? '∞' : '0.04'],
  ];
  api.focus.target('preserved-state', () => {
    moments.forEach(([label, value], i) => {
      const x = 450 + i * 510;
      api.focus.target(['weight', 'wrong-moment', 'wrong-variance'][i], () => {
        text(ctx, api, label, x, 894, 33, C.muted, 'center');
        text(ctx, api, value, x, 982, 58, wrong && i > 0 ? C.pink : C.ink, 'center');
      });
    });
  });
}
export default {
  id: 'controller',
  draw: drawController,
  cues: [
    'scale-spike',
    'controller-b1-1',
    'controller-b1-2',
    'controller-b2-1',
    'controller-b2-2',
    'backoff-scale',
    'controller-b3-1',
    'controller-extension-4',
    'finite-square',
    'finite-loss',
    'finite-gradient',
    'finite-scaler',
    'controller-extension-5',
    'optimizer-a',
    'optimizer-b',
    'optimizer-shared-scale',
  ],
};
