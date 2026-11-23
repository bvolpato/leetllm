import { CI_RUN, LANGUAGE } from '../fixtures.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after, runLog } from '../page.mjs';

export function drawSemanticGates(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('source-join', () => {
    runLog(ctx, api);
    const otherRun = after(state, 'join-change');
    const checked = after(state, 'join-check');
    if (state.beat === 0) {
      text(ctx, api, 'Completed status records', 150, 496, 34, C.muted);
      LANGUAGE.forEach((record, i) => {
        const y = 625 + i * 166;
        const matches = JSON.parse(record).status === CI_RUN.status;
        code(ctx, api, record, 155, y, 55);
        if (after(state, 'join-values'))
          text(
            ctx,
            api,
            matches ? 'Agrees with this log' : 'Contradicts this log',
            1090,
            y,
            45,
            matches ? C.green : C.pink,
          );
      });
      return;
    }
    const citedRun = otherRun ? 'RUN-843' : CI_RUN.run_id;
    const match = citedRun === CI_RUN.run_id;
    text(ctx, api, 'Record to verify', 150, 521, 35, C.muted);
    text(ctx, api, 'Run named in the cited log', 1000, 521, 35, C.muted);
    code(ctx, api, CI_RUN.run_id, 150, 667, 78, C.ink);
    code(ctx, api, citedRun, 1000, 667, 78, otherRun ? C.yellow : C.ink);
    code(ctx, api, 'status: failed', 150, 773, 43);
    code(ctx, api, 'status: failed', 1000, 773, 43);
    if (checked)
      text(
        ctx,
        api,
        match ? 'Same run' : 'Request evidence for RUN-842',
        150,
        923,
        48,
        match ? C.green : C.pink,
      );
  });
}
export default {
  id: 'semantic-gates',
  draw: drawSemanticGates,
  cues: ['join-values', 'join-change', 'join-check'],
};
