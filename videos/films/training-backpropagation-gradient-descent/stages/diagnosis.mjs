import { cueProgress, sampleModel, updateOnce } from '../model.mjs';
export function paintDiagnosis(ctx, scene, state, api) {
  drawDiagnosis(ctx, scene, state, api);
  return;
}
export function drawDiagnosisStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintDiagnosis(ctx, scene, state, api);
}
function drawDiagnosis(ctx, scene, state, api) {
  const { C, teaching: t, components: c } = api,
    b = state.beat ?? 0,
    P = (id) => cueProgress(state, id, b),
    F = (fn) => api.focus.target(b ? 'diagnostic-curves' : 'diagnostic-state', fn);
  const T = (v, x, y, size = 32, color = C.ink) =>
    api.text(ctx, String(v), x, y, size, color, 'center');
  const card = (v, x, y, w = 730, color = C.blue, h = 110) =>
    c.card({
      label: v,
      x,
      y,
      width: w,
      height: h,
      fontSize: 31,
      fill: C.panel,
      stroke: color,
      textColor: color,
    });
  if (b === 0)
    F(() => {
      T(
        'Injected faults on explicit toy states · inspect the first mismatch',
        960,
        285,
        32,
        C.muted,
      );
      const rate = updateOnce(0.5);
      card('Correct gradient · g = [−8, −4]', 150, 390);
      if (P('diagnostic-step'))
        card('η = 0.5 → loss ' + rate.loss + ' to ' + rate.nextLoss, 1030, 390, 730, C.pink);
      card('Uncleared buffer [−8, −4]', 150, 550);
      if (P('diagnostic-buffer')) card('+ [−8, −4] → [−16, −8]', 1030, 550, 730, C.pink);
      card('Finite input −2 → injected log operation', 150, 710);
      if (P('diagnostic-state'))
        card(
          Number.isNaN(Math.log(-2)) ? 'log(−2) → NaN · first invalid operation' : 'Finite',
          1030,
          710,
          730,
          C.pink,
        );
      if (P('diagnostic-small'))
        T(
          'Saved closed ReLU gate → local contribution 0 · inspect the forward state',
          960,
          970,
          31,
          C.yellow,
        );
    });
  else
    F(() => {
      T('Synthetic loss traces · compatible evaluation conditions', 960, 285, 32, C.muted);
      const curves = [
        {
          title: 'Both remain high',
          train: [4, 3.9, 3.8, 3.8],
          valid: [4.2, 4.1, 4, 4],
          cue: 'diagnostic-high',
        },
        {
          title: 'Training falls, validation rises',
          train: [4, 2, 1, 0.5],
          valid: [4.2, 2.4, 3, 4],
          cue: 'diagnostic-gap',
        },
      ];
      curves.forEach((v, i) => {
        const x = 250 + i * 870;
        T(v.title, x + 300, 365, 31, C.ink);
        const plot = t.axes({
          x,
          y: 440,
          width: 600,
          height: 340,
          xDomain: [1, 4],
          yDomain: [0, 5],
          xTicks: [1, 2, 3, 4],
          yTicks: [0, 2, 4],
          xLabel: 'evaluation',
          yLabel: 'loss',
          fontSize: 26,
        });
        const progress = P(v.cue);
        for (const [key, color] of [
          ['train', C.blue],
          ['valid', C.green],
        ]) {
          const points = v[key].map((y, j) => ({
            x: j + 1,
            y,
          }));
          t.curve({
            plot,
            points,
            color,
            progress,
            width: 5,
          });
        }
        T('training', x + 120, 905, 29, C.blue);
        T('validation', x + 420, 905, 29, C.green);
      });
      T(
        P('diagnostic-curves')
          ? 'Clean-batch check: original affine toy with η = 0.2 gives loss ' +
              updateOnce(0.2).nextLoss
          : 'Keep data and optimizer state reproducible',
        960,
        1005,
        30,
        C.yellow,
      );
    });
}
export default {
  id: 'diagnosis',
  draw: drawDiagnosisStage,
  cues: [
    'diagnostic-state',
    'diagnostic-step',
    'diagnostic-buffer',
    'diagnostic-small',
    'diagnostic-curves',
    'diagnostic-high',
    'diagnostic-gap',
  ],
};
