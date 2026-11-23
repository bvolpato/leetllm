import { fitSteps, training } from '../fixtures.mjs';
import { mix, phase, progress, smooth } from '../construction.mjs';
import { learningConstruction } from '../model.mjs';
import { M, T, chip, mark } from '../defaults.mjs';
export function drawBatchGradient(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    collect = progress(state, 'collect-batch', 1),
    avg = progress(state, 'average-batch', 1),
    update = progress(state, 'first-update', 2),
    count =
      currentBeat === 0
        ? 0
        : currentBeat > 1
          ? 8
          : training.filter((_, i) => phase(collect, i / 8, (i + 0.7) / 8) === 1).length;
  T(ctx, api, 'At zero weights: p = 0.5 for every training row', 960, 265, 33, api.C.muted);
  if (currentBeat < 2) {
    ['case / label', 'intercept', 'ambiguity', 'support'].forEach((v, i) =>
      T(ctx, api, v, [280, 660, 1040, 1420][i], 335, 30, i ? api.C.cyan : api.C.muted),
    );
    mark(api, 'batch-ledger', () =>
      training.forEach(([a, s, y], i) => {
        const yy = 390 + i * 51,
          entry = phase(collect, i / 8, (i + 0.7) / 8);
        ctx.save();
        ctx.globalAlpha *= entry === 1 ? 0.45 : 1;
        T(ctx, api, 'R' + (i + 1) + ' / ' + y, 280, yy, 29, y ? api.C.pink : api.C.blue);
        [1, a, s].forEach((v, j) => {
          const x = 660 + j * 380;
          T(
            ctx,
            api,
            currentBeat === 0 ? '?' : entry > 0 ? ((0.5 - y) * v).toFixed(2) : '?',
            x + mix(120, 0, smooth(entry)),
            yy,
            31,
            entry > 0 ? (y ? api.C.pink : api.C.blue) : api.C.muted,
          );
        });
        ctx.restore();
      }),
    );
    const sum = learningConstruction(mix(0.06, 0.62, count / 8)).sum;
    mark(api, 'batch-totals', () => {
      T(ctx, api, count + ' / 8 collected', 280, 875, 31, api.C.yellow);
      sum.forEach((v, i) =>
        T(ctx, api, 'sum ' + v.toFixed(2), 660 + i * 380, 875, 33, api.C.yellow),
      );
    });
    mark(api, 'batch-mean', () =>
      M(
        ctx,
        api,
        avg === 1 ? '\\nabla L=[0,-0.34375,-0.375]' : '\\nabla L=\\,\\text{mean pending}',
        1060,
        965,
        42,
        avg === 1 ? api.C.green : api.C.muted,
      ),
    );
  } else {
    M(ctx, api, '\\nabla L=[0,-0.34375,-0.375]', 960, 390, 54, api.C.cyan);
    mark(api, 'first-coefficient-update', () => {
      M(ctx, api, 'w_{new}=w-0.2\\nabla L', 960, 545, 52, api.C.yellow);
      ['intercept', 'ambiguity', 'support'].forEach((name, i) => {
        const x = 350 + i * 480;
        T(ctx, api, name, x + 160, 675, 33, api.C.muted);
        chip(
          ctx,
          api,
          (fitSteps[1][i] * smooth(update)).toFixed(5),
          x,
          725,
          320,
          130,
          api.C.green,
          43,
        );
      });
    });
    T(ctx, api, 'One update after the completed batch', 960, 965, 35, api.C.muted);
  }
}
export default {
  id: 'batch-gradient',
  draw: drawBatchGradient,
  cues: ['batch-columns', 'collect-batch', 'average-batch', 'first-update'],
};
