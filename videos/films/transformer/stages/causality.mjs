import { WORDS } from '../fixtures.mjs';
import { cue, done, event, sum } from '../arithmetic.mjs';
import { INPUT, MODEL, compute } from '../model.mjs';
import { caption, row, target, text, withTransformerLegacyFrame } from '../defaults.mjs';
export function paintCausality(ctx, scene, state, api, C, b, P, f) {
  const past = b >= 1 && cue(state, 'change-past', 0.65, 0.9) > 0;
  const changed = INPUT.map((r) => [...r]),
    p = past
      ? event(state, 1, 'change-past', 0.65, 0.9)
      : event(state, 0, 'change-future', 0.3, 0.65),
    selected = past ? 0 : 2;
  changed[selected][0] += 4 * p;
  const other = compute(changed);
  text(
    ctx,
    api,
    C,
    past ? 'change the first input' : 'change the final input',
    960,
    285,
    35,
    past ? C.pink : C.yellow,
    'center',
  );
  target(ctx, api, 'changed-input', () => {
    text(ctx, api, C, WORDS[selected] + ' input coordinate 1', 650, 420, 31, C.blue, 'center');
    row(
      ctx,
      api,
      C,
      f,
      [INPUT[selected][0], '→', changed[selected][0]],
      1110,
      365,
      540,
      past ? C.pink : C.yellow,
    );
  });
  const pulse = (p * 3) % 1;
  for (let i = 0; i < 3; i++)
    for (let j = 0; j <= i; j++) {
      const xx = 470 + j * 80,
        yy = 535 + i * 110;
      api.circle(ctx, xx, yy, 8, j === selected && i >= selected ? C.yellow : C.muted);
      if (j === selected && i >= selected && p > 0 && p < 1)
        api.circle(ctx, xx + 30 * pulse, yy, 6, C.cyan);
    }
  const compared = past
    ? event(state, 2, 'compare-past')
    : event(state, 1, 'compare-future', 0.05, 0.45);
  target(ctx, api, 'causal-comparison', () => {
    WORDS.forEach((word, i) => {
      const y = 565 + i * 110,
        delta = Math.sqrt(sum(other.Z[i].map((v, j) => (v - MODEL.Z[i][j]) ** 2)));
      text(ctx, api, C, word, 370, y + 20, 30, C.blue, 'right');
      if (done(compared)) {
        if (delta > 0)
          api.rect(ctx, 470, y - 10, (850 * delta) / 5, 45, i < selected ? C.muted : C.cyan);
        text(
          ctx,
          api,
          C,
          delta < 1e-12 ? 'exactly unchanged' : 'output change ' + f(delta, 3),
          1550,
          y + 20,
          28,
          delta < 1e-12 ? C.green : C.cyan,
          'center',
        );
      } else
        text(ctx, api, C, 'compare after your prediction', 1080, y + 20, 29, C.muted, 'center');
    });
  });
  api.line(ctx, 470, 865, 1320, 865, C.muted, 1);
  for (let i = 0; i <= 5; i++) {
    const x = 470 + 170 * i;
    api.line(ctx, x, 860, x, 870, C.muted, 1);
    text(ctx, api, C, String(i), x, 910, 25, C.muted, 'center');
  }
  caption(
    ctx,
    api,
    C,
    'Output change is the Euclidean distance between full four-coordinate block rows',
  );
}
export function drawCausalityStage(ctx, scene, state, api) {
  withTransformerLegacyFrame(ctx, scene, state, api, paintCausality);
}
export default {
  id: 'causality',
  draw: drawCausalityStage,
  cues: ['change-future', 'compare-future', 'change-past', 'compare-past'],
};
