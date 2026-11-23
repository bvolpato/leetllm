import { denseMLP, parallelMLP } from '../arithmetic.mjs';
import { mpReference } from '../model.mjs';
import { sceneClock } from '../scene-clock.mjs';
import { vector } from '../defaults.mjs';

const dense = denseMLP(mpReference.input);
const mean = parallelMLP(mpReference.input, 'mean');

export function drawTransfer(ctx, scene, state, api) {
  const clock = sceneClock(scene, state);
  const summed = clock.progress('switch-reducer') > 0;
  const candidate = summed ? mpReference : mean;
  const checked = clock.done(summed ? 'sum-check' : 'mean-check');
  const equal = candidate.output.every((v, i) => Math.abs(v - dense[i]) < 1e-12);
  api.focus.target('reference-check', () => {
    api.text(
      ctx,
      'Same input [1, 2]   ·   same weights   ·   same two local projections',
      960,
      265,
      42,
      api.C.ink,
      'center',
    );
    for (const rank of [0, 1]) {
      const cx = 550 + rank * 820,
        color = rank ? api.C.cyan : api.C.blue;
      api.text(ctx, `GPU ${rank} partial`, cx, 368, 34, color, 'center');
      api.text(ctx, vector(candidate.partials[rank]), cx, 460, 57, color, 'center', 'mono');
    }
    api.text(
      ctx,
      (summed ? 'Sum' : 'Mean') + ' of partials + one bias',
      180,
      608,
      39,
      api.C.yellow,
    );
    api.text(ctx, 'Dense reference', 180, 731, 39, api.C.ink);
    const calculated = clock.done(summed ? 'switch-reducer' : 'try-mean');
    api.text(
      ctx,
      calculated ? '≈ ' + vector(candidate.output) : '?',
      1260,
      608,
      52,
      api.C.yellow,
      'center',
      'mono',
    );
    api.text(ctx, '≈ ' + vector(dense), 1260, 731, 52, api.C.ink, 'center', 'mono');
    api.text(ctx, 'torch.allclose(candidate, dense)', 180, 899, 41, api.C.ink, 'left', 'mono');
    api.text(
      ctx,
      checked ? (equal ? 'True' : 'False') : '?',
      1460,
      899,
      61,
      checked ? (equal ? api.C.green : api.C.pink) : api.C.muted,
      'center',
      'mono',
    );
    if (checked && !equal)
      api.text(
        ctx,
        'Which reducer would recover the dense vector?',
        960,
        995,
        37,
        api.C.yellow,
        'center',
      );
  });
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: ['inspect-partials', 'try-mean', 'mean-check', 'switch-reducer', 'sum-check'],
};
