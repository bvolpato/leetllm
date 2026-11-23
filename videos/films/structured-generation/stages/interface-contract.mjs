import { CI_RUN } from '../fixtures.mjs';
import { constructionCode as code, constructionText as text } from '../defaults.mjs';
import { after, runLog } from '../page.mjs';

const twoFields = JSON.stringify({ run_id: CI_RUN.run_id, status: CI_RUN.status });

export function drawInterfaceContract(ctx, scene, state, api) {
  const { C, focus } = api;
  focus.target('reply-contract', () => {
    runLog(ctx, api);
    if (state.beat === 2) {
      text(ctx, api, 'Structured response', 150, 505, 36, C.cyan);
      code(ctx, api, twoFields, 150, 592, 44);
      text(ctx, api, 'The host reads a record', 150, 671, 35, C.muted);
      text(ctx, api, 'Tool request', 150, 788, 36, C.cyan);
      code(ctx, api, 'get_run_status("RUN-842")', 150, 876, 44);
      if (after(state, 'interface-lookup')) {
        api.arrow(ctx, 890, 860, 1040, 860, C.yellow, 4);
        text(ctx, api, 'Host returns CI snapshot', 1090, 876, 42, C.yellow);
      }
      return;
    }
    const missing = state.beat === 1;
    const removed = after(state, 'interface-trim');
    const raw = missing
      ? '{"foo":"bar"}'
      : removed
        ? twoFields
        : 'Sure! ' + twoFields;
    text(ctx, api, 'Reply bytes', 150, 498, 36, C.muted);
    code(ctx, api, raw, 150, 616, 46);
    if (!missing && !removed) api.line(ctx, 152, 644, 295, 644, C.pink, 5);
    if (removed || missing) {
      text(ctx, api, 'JSON parser', 150, 760, 34, C.muted);
      text(ctx, api, 'Object', 150, 854, 54, C.green);
      text(ctx, api, 'Required fields', 805, 760, 34, C.muted);
      const payload = JSON.parse(raw);
      const hasFields = payload.run_id === CI_RUN.run_id && typeof payload.status === 'string';
      text(
        ctx,
        api,
        missing && !after(state, 'interface-fields')
          ? '?'
          : hasFields
            ? 'Run ID and status present'
            : 'Run ID and status missing',
        805,
        854,
        49,
        hasFields ? C.green : missing && !after(state, 'interface-fields') ? C.ink : C.pink,
      );
    }
  });
}
export default {
  id: 'interface-contract',
  draw: drawInterfaceContract,
  cues: ['interface-trim', 'interface-fields', 'interface-lookup'],
};
