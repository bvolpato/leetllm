import { pages, registry } from '../fixtures.mjs';
import { adjudicate } from '../model.mjs';

export function drawSourceLineage(ctx, scene, state, api) {
  const { C, focus } = api;
  const beat = state.beat;
  const manual = pages[5];
  const copies =
    1 +
    Math.floor(
      2 * focus.progress('repeated-reports', beat > 0 ? 1 : api.phase(state.beatP, 0.15, 0.65)),
    );
  const bulletin =
    beat > 2 ||
    focus.progress('second-source', beat === 2 ? api.phase(state.beatP, 0.07, 0.27) : 0) > 0;
  const restore = beat >= 1 && !bulletin;
  const other = restore ? 'export-note/p2' : bulletin ? 'bulletin-v13/p2' : null;
  const reports = [...Array(copies).fill(manual.id), ...(other ? [other] : [])];
  const { ids, verdict } = adjudicate(reports);
  const reveal = restore
    ? focus.progress('compare-scope', api.phase(state.beatP, 0.12, 0.45)) >= 1
    : beat >= 3 && focus.progress('computed-conflict', api.phase(state.beatP, 0, 0.4)) >= 1;

  api.text(
    ctx,
    'Claim   /   The legacy-token exception expires on ' + manual.value + '.',
    130,
    275,
    42,
    C.ink,
  );
  focus.target('citations', () => {
    api.text(ctx, 'Child reports', 135, 394, 32, C.muted);
    for (let i = 0; i < reports.length; i++) {
      const y = 488 + i * 89;
      const dest = i < copies ? 535 : 739;
      api.text(ctx, 'Read ' + (i + 1), 140, y, 35, C.cyan);
      api.line(ctx, 297, y - 12, 493, dest, C.cyan, 3);
    }
  });
  focus.target('applicable-sources', () => {
    api.text(ctx, 'Source identity', 548, 394, 32, C.muted);
    api.text(ctx, 'Applies to', 1020, 394, 32, C.muted);
    api.text(ctx, 'Expiry', 1480, 394, 32, C.muted);
    [manual.id, ...(other ? [other] : [])].forEach((id, i) => {
      const y = 535 + i * 204,
        row = registry[id];
      const color = restore && i && reveal ? C.muted : C.blue;
      api.circle(ctx, 500, y, 9, color);
      api.text(ctx, id, 548, y + 12, 37, color);
      api.text(ctx, row.scope, 1020, y + 12, 37, color);
      api.text(ctx, row.expiry, 1480, y + 12, 40, color);
    });
  });
  focus.target('source-verdict', () => {
    let result =
      reports.length +
      (reports.length === 1 ? ' report' : ' reports') +
      '  /  ' +
      ids.length +
      ' applicable source';
    if (restore)
      result = reveal
        ? 'Billing exports have a different scope.  One applicable source.'
        : 'Does this record apply to legacy tokens?';
    if (bulletin) {
      result = 'Both cover legacy tokens. Can we certify September 30?';
      if (beat >= 3)
        result = reveal
          ? 'Source check: ' + verdict + '  ·  find which policy governs the run'
          : 'Comparison pending  ·  check both expiry dates';
    }
    api.text(ctx, result, 960, 928, 39, bulletin && reveal ? C.pink : C.yellow, 'center');
  });
}
export default {
  id: 'source-lineage',
  draw: drawSourceLineage,
  cues: [
    'repeated-reports',
    'unique-source',
    'compare-scope',
    'second-source',
    'computed-conflict',
  ],
};
