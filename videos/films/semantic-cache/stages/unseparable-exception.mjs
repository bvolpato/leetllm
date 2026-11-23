import { SHADOW_ROWS } from '../fixtures.mjs';
import { cueProgress, scaledCosine } from '../arithmetic.mjs';
import { scoreBoard } from '../score-board.mjs';

export function drawUnseparableException(ctx, scene, state, api) {
  const amount = cueProgress(state, 0, 'sc-exception-high', 0.24, 0.55);
  const vector = [0.94 + 0.0599 * amount, 0.1 - 0.09 * amount, 0];
  const score = scaledCosine([1, 0, 0], vector);
  const sweep = cueProgress(state, 1, 'sweep-cutoff', 0.06, 0.45);
  const repaired = cueProgress(state, 2, 'sc-exception-repair', 0.12, 0.38) > 0;
  const rows = SHADOW_ROWS.map((r) => (r.id === 'P5' ? { ...r, score, eligible: !repaired } : r));
  scoreBoard(ctx, api, {
    cutoff: repaired ? 0.995 : 0.995 + 0.005 * sweep,
    rows,
    vector,
    excludeRestore: repaired,
    prompt: repaired
      ? 'Evaluated retention-only route   ·   Restoration goes to a fresh policy read'
      : state.beat === 0
        ? 'Where could the cutoff keep a retention pair and exclude restoration?'
        : sweep === 1
          ? 'Every retention pair falls out before restoration does.'
          : 'Follow the four retention pairs as the line moves.',
  });
}
export default {
  id: 'unseparable-exception',
  draw: drawUnseparableException,
  cues: ['sc-exception-high', 'sweep-cutoff', 'sc-exception-repair'],
};
