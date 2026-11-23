import { spoken } from '../cue.mjs';
import { line, rectangle, text } from '../defaults.mjs';

const models = [
  { n: 70e9, d: 1.4e12, description: '70B on 1.4T' },
  { n: 30e9, d: 4e12, description: '30B on 4T' },
];
const training = (m) => 6 * m.n * m.d;
const premium = training(models[1]) - training(models[0]);
const saving = 2 * (models[0].n - models[1].n);
const crossing = premium / saving / 1e12;

export function drawBill(ctx, api, demand, markCrossing = false, modelCount = models.length) {
  const { C } = api;
  api.focus.target('lifetime-bill', () => {
    text(
      ctx,
      api,
      'Assume both models meet the task-quality target',
      960,
      256,
      37,
      C.muted,
      'center',
    );
    text(
      ctx,
      api,
      'Processed inference tokens   ' + demand.toFixed(2) + 'T',
      960,
      364,
      55,
      C.ink,
      'center',
    );
    const x = 495,
      scale = 105;
    for (const [i, model] of models.slice(0, modelCount).entries()) {
      const y = 475 + 190 * i;
      const train = training(model) / 1e23,
        serve = (2 * model.n * demand * 1e12) / 1e23;
      text(ctx, api, model.description, x - 36, y + 57, 39, C.ink, 'right');
      rectangle(ctx, api, x, y, train * scale, 88, C.blue, C.blue);
      text(ctx, api, train.toFixed(2), x + (train * scale) / 2, y + 58, 35, C.bg, 'center');
      if (serve > 0) {
        rectangle(ctx, api, x + train * scale, y, serve * scale, 88, C.cyan, C.cyan);
        if (serve * scale > 95)
          text(
            ctx,
            api,
            serve.toFixed(2),
            x + (train + serve / 2) * scale,
            y + 58,
            32,
            C.bg,
            'center',
          );
      }
      text(
        ctx,
        api,
        (train + serve).toFixed(2),
        x + (train + serve) * scale + 28,
        y + 59,
        43,
        C.ink,
      );
    }
    if (markCrossing) {
      const xTotal = x + (training(models[0]) / 1e23 + (2 * models[0].n * crossing) / 1e11) * scale;
      line(ctx, api, xTotal, 567, xTotal, 661, C.yellow, 4);
    }
    text(ctx, api, 'Training  6ND', 620, 850, 37, C.blue);
    text(ctx, api, 'Serving  2NQ', 1020, 850, 37, C.cyan);
    text(
      ctx,
      api,
      'Dense-projection arithmetic, in units of 10²³ FLOPs',
      960,
      915,
      33,
      C.muted,
      'center',
    );
  });
}

export function drawLifetimeEquation(ctx, scene, state, api) {
  const { C } = api;
  const p = (id) => api.ease(spoken(scene, state, id).progress);
  const atCrossing = spoken(scene, state, 'life-match').phase === 'after';
  const last = spoken(scene, state, 'life-three');
  const demand =
    p('life-one') + (crossing - 1) * p('life-match') + (3 - crossing) * p('life-three');
  drawBill(ctx, api, demand, atCrossing && last.phase === 'before');
  let note = 'One processed token costs about 2N FLOPs';
  if ((state.beat ?? 0) >= 1) {
    note =
      spoken(scene, state, 'life-premium').phase === 'after'
        ? 'Training premium   ' +
          (premium / 1e23).toFixed(2) +
          ' × 10²³ FLOPs     /     Serving saving   ' +
          saving / 1e9 +
          'B FLOPs per token'
        : 'Extra training work   (' +
          models
            .map((m) => (training(m) / 1e23).toFixed(2))
            .reverse()
            .join(' − ') +
          ') × 10²³ FLOPs';
  }
  if (atCrossing && last.phase === 'before')
    note = 'Break-even demand   ' + crossing.toFixed(2) + ' trillion processed tokens';
  if (last.phase === 'after') note = 'At 3T tokens the 30B model uses fewer lifetime FLOPs';
  text(ctx, api, note, 960, 1001, 34, C.yellow, 'center');
}

export default {
  id: 'lifetime-equation',
  draw: drawLifetimeEquation,
  cues: ['life-bill', 'life-one', 'life-premium', 'life-crossing', 'life-match', 'life-three'],
};
