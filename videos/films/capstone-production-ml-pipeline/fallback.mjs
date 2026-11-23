import { sampleModel } from './construction.mjs';
export function drawFallback(ctx, scene, state, api) {
  {
    const { C, components: c, teaching: t } = api,
      b = state.beat ?? 0,
      p = state.beatP ?? 0,
      id = scene.id;
  }
  const { C, components: c, teaching: t } = api,
    s = sampleModel(scene.id, state);
  const card = (v, x, y, w = 430, color = C.cyan, h = 110) =>
    c.card({
      label: v,
      x,
      y,
      width: w,
      height: h,
      fontSize: 29,
      padding: 14,
      fill: C.panel,
      stroke: color,
      textColor: color,
    });
  const a = api.focus.target('input-bundle', () =>
      card('Data + model + policy', 160, 450, 590, C.blue),
    ),
    b = api.focus.target('release-recovery', () =>
      card('Bound gate + recovery target', 1120, 450, 640, C.green),
    );
  t.transfer({
    source: {
      shape: a,
      opacity: 1,
    },
    target: {
      shape: b,
      opacity: 1,
    },
    color: C.cyan,
    progress: s.p,
    particle: {
      radius: 9,
      fill: C.yellow,
    },
  });
}
