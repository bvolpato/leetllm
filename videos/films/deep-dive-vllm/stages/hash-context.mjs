import { vvProgress } from '../construction.mjs';
import { tokenCell } from '../defaults.mjs';

export function drawHashContext(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, b) => vvProgress(state, 'hash-' + id, b);
  const changed = p('revision', 1) > 0;
  api.focus.target('hash-record', () => {
    api.text(ctx, 'Full-block cache record', 135, 263, 42, C.ink);
    const xs = [135, 687, 1239];
    const records = [
      ['Parent', 'History through “sat”'],
      ['Exact token IDs', 'on   the   green   branch'],
      ['Execution context', 'Adapter: Finch'],
    ];
    for (const [i, [field, value]] of records.entries()) {
      api.text(ctx, field, xs[i], 375, 34, C.muted);
      tokenCell(api, value, xs[i], 410, 507, 106, i === 2 ? C.yellow : C.cyan, false, 32);
    }
    if (state.beat === 0) {
      if (p('parent', 0) > 0)
        api.text(
          ctx,
          'A different earlier history changes the parent field.',
          960,
          752,
          42,
          C.cyan,
          'center',
        );
      return;
    }
    api.text(ctx, 'Adapter manifest', 135, 634, 36, C.ink);
    tokenCell(api, 'Name   Finch', 135, 677, 508, 88, C.blue);
    tokenCell(
      api,
      'Path   ' + (changed ? 'revision-two' : 'revision-one'),
      688,
      677,
      506,
      88,
      C.yellow,
      changed,
    );
    if (state.beat === 1 && p('ask', 1) > 0)
      api.text(ctx, 'Which version records the path change?', 960, 964, 40, C.yellow, 'center');
    if (state.beat === 2) {
      if (p('name-only', 2) > 0) api.text(ctx, 'v0.28   name stays Finch', 150, 913, 34, C.blue);
      if (p('tagged', 2) > 0)
        api.text(ctx, 'v0.31   tagged adapter field includes the new path', 766, 913, 34, C.green);
    }
  });
}
export default {
  id: 'hash-context',
  draw: drawHashContext,
  cues: ['hash-parent', 'hash-revision', 'hash-ask', 'hash-name-only', 'hash-tagged'],
};
