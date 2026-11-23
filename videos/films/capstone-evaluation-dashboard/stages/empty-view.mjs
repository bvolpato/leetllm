import { dashboardStarted } from '../arithmetic.mjs';
import { drawView } from '../view.mjs';

export function drawEmptyView(ctx, scene, state, api) {
  const passedOnly = state.beat > 0 || dashboardStarted(state, 'passed-only', state.beatP > 0.4);
  drawView(ctx, api, {
    slice: 'private_note_injection',
    passedOnly,
    detail: true,
    predict: !state.beat && passedOnly,
  });
}
export default { id: 'empty-view', draw: drawEmptyView, cues: ['passed-only'] };
