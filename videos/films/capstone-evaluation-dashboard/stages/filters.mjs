import { dashboardStarted } from '../arithmetic.mjs';
import { drawView } from '../view.mjs';

export function drawFilters(ctx, scene, state, api) {
  const filter = state.beat > 0 || dashboardStarted(state, 'choose-paraphrase', state.beatP > 0.35);
  const detail = state.beat > 0 && dashboardStarted(state, 'follow-hold', state.beatP > 0.2);
  drawView(ctx, api, { slice: filter ? 'policy_paraphrase' : null, detail });
}
export default { id: 'filters', draw: drawFilters, cues: ['choose-paraphrase', 'follow-hold'] };
