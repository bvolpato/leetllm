import { TOP_PIXEL } from '../fixtures.mjs';
import { image, imageNoise } from '../model.mjs';
import {
  afterPhrase,
  cueProgress,
  decimal,
  drawPair,
  recoverClean,
  worksheet,
} from '../pixel-study.mjs';

const rows = [
  { level: 100, noise: [0.2, -0.1, 0.05], prediction: [0.18, -0.08, 0.02] },
  { level: 700, noise: [0.9, -0.4, 0.3], prediction: [0.72, -0.35, 0.1] },
];
const jump = worksheet(0.5, 0.9);
const a = Math.sqrt(0.5);
const b = Math.sqrt(1 - 0.5);
const velocity = image.map((clean, i) => a * imageNoise[i] - b * clean);
const mistaken = jump.input.map((x, i) => recoverClean(x, velocity[i], 0.5));
const converted = jump.input.map((x, i) => a * x - b * velocity[i]);

export function drawTrainingTargets(ctx, scene, state, api) {
  const { C } = api;
  if (state.beat === 0) {
    const p = cueProgress(state, 'loss-residuals', 0);
    const done = afterPhrase(state, 'loss-mean', 0);
    api.focus.target('loss-pairs', () => {
      api.text(ctx, 'Injected noise  →  prediction', 112, 268, 38, C.ink);
      for (const [r, row] of rows.entries()) {
        const y = 430 + 240 * r;
        api.text(ctx, `t = ${row.level}`, 112, y, 39, C.ink);
        row.noise.forEach((target, i) => {
          const x = 424 + i * 327;
          const error = target - row.prediction[i];
          api.text(
            ctx,
            `${decimal(target, 2)}  →  ${decimal(row.prediction[i], 2)}`,
            x,
            y,
            35,
            C.cyan,
          );
          if (p >= (i + 1) / 3) api.text(ctx, `(${decimal(error, 2)})²`, x, y + 80, 34, C.yellow);
        });
        const mse =
          row.noise.reduce((sum, v, i) => sum + (v - row.prediction[i]) ** 2, 0) / row.noise.length;
        api.text(ctx, done ? decimal(mse, 4) : '?', 1515, y + 35, 48, C.ink);
      }
      api.text(ctx, 'Mean square', 1515, 268, 31, C.muted);
      api.text(
        ctx,
        'Two supplied predictions · three coordinates in each row',
        112,
        945,
        33,
        C.muted,
      );
    });
    return;
  }
  const wrong = afterPhrase(state, 'target-failure', 2);
  const repair = afterPhrase(state, 'target-convert', 3);
  const result = state.beat === 1 ? jump.input : !wrong ? null : repair ? converted : mistaken;
  drawPair(ctx, api, {
    left: { title: 'Known clean image', pixels: image },
    right: {
      title: state.beat === 1 ? 'Noisy input' : repair ? 'Velocity inverse' : 'Noise inverse',
      pixels: result,
    },
    notes:
      state.beat === 1
        ? ['Velocity target', 'v = aε − b x₀', `v = ${decimal(velocity[TOP_PIXEL])}`]
        : state.beat === 3
          ? ['Read output as velocity', 'x̂₀ = a x − b v', 'ε̂ = b x + a v']
          : [
              'Read output as noise',
              '(x − b v) / a',
              `x ≈ ${decimal(jump.input[TOP_PIXEL])}  ·  v ≈ ${decimal(velocity[TOP_PIXEL])}`,
              'a = b = √0.50',
            ],
    ruler: { left: 0, right: 1.75, ticks: [0, 0.5, 1, 1.5] },
  });
}
export default {
  id: 'training-targets',
  draw: drawTrainingTargets,
  cues: ['loss-residuals', 'loss-mean', 'target-rotation', 'target-failure', 'target-convert'],
};
