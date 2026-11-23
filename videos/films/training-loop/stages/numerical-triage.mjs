import { text } from '../defaults.mjs';
import { finished, progressDuring } from '../scene-clock.mjs';

export function drawNumericalTriage(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat <= 1) {
    const controlLoss = finished(state, 'triage-nine', 0, 0.28);
    const controlGradient = finished(state, 'triage-six', 0, 0.37);
    const offset = finished(state, 'triage-offset', 0, 0.68);
    const lossKnown = finished(state, 'triage-loss', 1, 0.17);
    const gradKnown = finished(state, 'triage-gradient', 1, 0.28);
    text(ctx, api, 'w = 3', 160, 265, 46, C.ink);
    text(ctx, api, 'loss = w.square() + c', 640, 265, 45, C.ink);
    text(ctx, api, 'loss.backward()', 1740, 265, 39, C.yellow, 'right');
    const columns = [350, 995, 1535];
    ['Constant offset c', 'Forward loss', 'Stored gradient'].forEach((name, j) =>
      text(ctx, api, name, columns[j], 388, 34, C.muted, 'center'),
    );
    function lane(id, y, c, known, showGrad) {
      const trial = c === Infinity;
      api.focus.target(id, () => {
        api.line(ctx, 170, y - 71, 1750, y - 71, C.muted, 2);
        const weight = 3;
        const value = weight ** 2 + c;
        const gradient = 2 * weight;
        text(
          ctx,
          api,
          trial ? '+∞' : '0',
          columns[0],
          y + 9,
          63,
          trial ? C.yellow : C.ink,
          'center',
        );
        text(
          ctx,
          api,
          known ? (Number.isFinite(value) ? String(value) : '∞') : '?',
          columns[1],
          y + 9,
          63,
          known && trial ? C.red : C.cyan,
          'center',
        );
        text(
          ctx,
          api,
          showGrad ? '2 × ' + weight + ' = ' + gradient : '?',
          columns[2],
          y + 9,
          52,
          showGrad ? C.green : C.muted,
          'center',
        );
        if (known)
          text(
            ctx,
            api,
            'isfinite  ' + (Number.isFinite(value) ? 'True' : 'False'),
            columns[1],
            y + 64,
            29,
            trial ? C.red : C.green,
            'center',
          );
        if (showGrad) text(ctx, api, 'isfinite  True', columns[2], y + 64, 29, C.green, 'center');
      });
    }
    lane('triage-control', 508, 0, controlLoss, controlGradient);
    if (offset) lane('triage-trial', 736, Infinity, lossKnown, gradKnown);
    else
      api.focus.target('triage-trial', () =>
        text(ctx, api, 'Replay with a second offset', 350, 745, 28, C.muted, 'center'),
      );
    api.focus.target('triage-decision', () => {
      const prompt = gradKnown
        ? 'Hold the update. Inspect c where it enters the forward loss.'
        : state.beat === 1 && lossKnown
          ? 'torch.isfinite(loss).item()   →   False'
          : offset
            ? 'Would you take the step if the gradient is finite?'
            : 'Check the objective and its derivative.';
      text(ctx, api, prompt, 960, 949, 42, lossKnown ? C.red : C.ink, 'center');
    });
    return;
  }
  if (state.beat === 2) {
    api.focus.target('triage-path', () => {
      const index =
        progressDuring(state, 'triage-params', 2, 0.95, 0.99) > 0
          ? 4
          : progressDuring(state, 'triage-gradcheck', 2, 0.79, 0.86) > 0
            ? 3
            : progressDuring(state, 'triage-objective', 2, 0.2, 0.27) > 0
              ? 2
              : progressDuring(state, 'triage-logits', 2, 0.11, 0.14) > 0
                ? 1
                : 0;
      const xs = [245, 593, 941, 1289, 1637];
      const names = ['Input batch', 'Logits', 'Mean loss', 'Gradient', 'Weights'];
      api.line(ctx, xs[0], 535, xs.at(-1), 535, C.muted, 4);
      xs.forEach((x, i) => {
        api.circle(ctx, x, 535, i === index ? 18 : 10, i === index ? C.yellow : C.muted);
        text(ctx, api, names[i], x, 465, 39, i === index ? C.yellow : C.ink, 'center');
      });
      text(
        ctx,
        api,
        [
          'Before forward',
          'Before loss',
          'Targets, masks, weights, reduction',
          'After unscaling',
          'After the optimizer step',
        ][index],
        xs[index],
        650,
        31,
        C.yellow,
        'center',
      );
      text(
        ctx,
        api,
        'Stop at the first nonfinite value. Inspect the operation that produced it.',
        960,
        881,
        39,
        C.ink,
        'center',
      );
    });
    return;
  }
  api.focus.target('triage-report', () => {
    text(ctx, api, 'loss', 300, 593, 70, C.yellow, 'center');
    const paths = [
      ['loss.item()', 'Python number   ·   CUDA read may wait', 435],
      ['loss.detach()', 'Tensor on the same device   ·   history removed', 751],
    ];
    for (const [call, result, y] of paths) {
      api.arrow(ctx, 400, y === 435 ? 545 : 610, 675, y, C.muted, 4);
      text(ctx, api, call, 740, y + 14, 49, C.cyan);
      text(ctx, api, result, 740, y + 85, 34, C.ink);
    }
  });
}
export default {
  id: 'numerical-triage',
  draw: drawNumericalTriage,
  cues: [
    'triage-nine',
    'triage-six',
    'triage-control',
    'triage-offset',
    'triage-loss',
    'triage-gradient',
    'triage-stop',
    'triage-input',
    'triage-logits',
    'triage-objective',
    'triage-gradcheck',
    'triage-params',
    'triage-report',
    'triage-detach',
  ],
};
