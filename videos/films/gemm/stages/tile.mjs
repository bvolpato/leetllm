import { drawPanel } from '../panel.mjs';
import { finished, progress } from '../workbench.mjs';

export function drawTile(ctx, scene, state, api) {
  const next = state.beat >= 2;
  const k = next ? 1 : 0;
  const cue = next ? 'second-crossing' : 'first-crossing';
  const beat = next ? 2 : 1;
  const arrived = finished(state, beat, cue);
  const routes = progress(state, beat, cue);
  const count = k + Number(arrived);
  const note = count === 2 ? 'First panel complete · keep all four sums' : `${count} of 3 inner positions accumulated`;
  drawPanel(ctx, api, k, count, routes, note);
}
export default { id: 'tile', draw: drawTile, cues: ['load-panel', 'first-crossing', 'second-crossing'] };
