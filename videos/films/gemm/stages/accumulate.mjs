import { drawPanel } from '../panel.mjs';
import { finished, progress } from '../workbench.mjs';

export function drawAccumulate(ctx, scene, state, api) {
  const updated = finished(state, 1, 'last-crossing');
  const named = finished(state, 1, 'locate-cell');
  let note = 'Which of the four sums will change?';
  if (state.beat > 0) note = 'Follow the last pair';
  if (named) note = 'C[1,0] · 1 + 2 × 3 = ?';
  if (updated) note = 'All 3 positions accumulated · store C';
  drawPanel(ctx, api, 2, updated ? 3 : 2, progress(state, 1, 'last-crossing'), note, named ? [1, 0] : undefined);
}
export default { id: 'accumulate', draw: drawAccumulate, cues: ['last-inputs', 'locate-cell', 'last-crossing'] };
