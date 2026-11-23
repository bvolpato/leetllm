import { classificationTrace, cueProgress, sampleModel } from '../model.mjs';
export function paintNextLoss(ctx, scene, state, api) {
  drawClassification(ctx, state, api);
  return;
}
export function drawNextLossStage(ctx, scene, state, api) {
  const { C, components: c, teaching: t } = api,
    b = state.beat ?? 0,
    s = sampleModel(scene.id, state);
  return paintNextLoss(ctx, scene, state, api);
}
function drawClassification(ctx, state, api) {
  const { C, components: c } = api,
    trace = classificationTrace(),
    given = cueProgress(state, 'classification-probabilities') > 0,
    result = cueProgress(state, 'classification-result') === 1,
    logits = cueProgress(state, 'classification-logits') > 0,
    probability = cueProgress(state, 'classification-softmax') > 0,
    general = cueProgress(state, 'classification-gradient') > 0;
  const T = (v, x, y, size = 32, color = C.ink) =>
    api.text(ctx, String(v), x, y, size, color, 'center');
  T('Constructed three-class example · one example · no mean scaling', 960, 285, 32, C.muted);
  api.focus.target('classification-gradient', () => {
    for (let i = 0; i < 3; i++) {
      const x = 210 + i * 575,
        color = [C.blue, C.yellow, C.pink][i];
      c.card({
        label: 'Class ' + (i + 1),
        x,
        y: 380,
        width: 420,
        height: 90,
        fontSize: 34,
        fill: C.panel,
        stroke: color,
        textColor: color,
      });
      if (logits)
        given
          ? T('logit ' + trace.logits[i].toFixed(3), x + 210, 545, 31, color)
          : api.math(ctx, 'z_' + (i + 1), x + 210, 545, 40, color, 'center');
      if (probability) {
        api.arrow(ctx, x + 210, 585, x + 210, 630, color, 3);
        given
          ? T('p = ' + trace.probabilities[i].toFixed(1), x + 210, 700, 40, color)
          : api.math(ctx, 'p_' + (i + 1), x + 210, 700, 42, color, 'center');
      }
      if (general) {
        given
          ? T('target = ' + trace.target[i], x + 210, 800, 32, C.muted)
          : api.math(ctx, 't_' + (i + 1), x + 210, 800, 39, C.muted, 'center');
        if (result) T('gradient = ' + trace.gradient[i].toFixed(1), x + 210, 935, 40, color);
        else
          api.math(
            ctx,
            'g_' + (i + 1) + '=p_' + (i + 1) + '-t_' + (i + 1),
            x + 210,
            935,
            38,
            color,
            'center',
          );
      }
    }
    T(
      given
        ? 'Softmax of these log probabilities gives [0.2, 0.3, 0.5]'
        : probability
          ? 'Exponentiate each logit and normalize by the sum'
          : 'Raw logits enter the same backward engine',
      960,
      1010,
      28,
      C.muted,
    );
  });
}
export default {
  id: 'next-loss',
  draw: drawNextLossStage,
  cues: [
    'classification-gradient',
    'classification-probabilities',
    'classification-result',
    'classification-logits',
    'classification-softmax',
  ],
};
