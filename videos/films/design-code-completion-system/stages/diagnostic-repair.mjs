import { completionFooter, completionHeading, completionText } from '../defaults.mjs';
export function drawDiagnosticRepair(ctx, scene, state, api) {
  api.focus.target('cc-diagnostic-repair-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0));
    {
      completionHeading(ctx, api, 'Repair the earliest observed failed boundary');
      const rows =
        currentBeat === 0
          ? [
              ['Late v41 reply', 'current snapshot v42', 'discard, then request current'],
              ['Slow graph. lookup', 'receiver type already known', 'use local semantic result'],
              ['Conflict below caret', 'suffix omitted', 'preserve the actual suffix'],
            ]
          : [
              ['Low hit rate', 'prefix / adapter / policy', 'compare exact compatible state'],
              ['Latency spike', 'queue / prefill / decode / debounce', 'change one measured phase'],
              [
                'Acceptance rises',
                'shown population / retained text',
                'retain the original denominators',
              ],
            ];
      rows.forEach(([a, v, r], i) => {
        completionText(ctx, api, a, 180, 430 + i * 210, 28, themeColors.pink);
        completionText(ctx, api, v, 820, 430 + i * 210, 26, themeColors.cyan, 'center');
        completionText(ctx, api, r, 1470, 430 + i * 210, 26, themeColors.green, 'center');
        api.arrow(ctx, 470, 420 + i * 210, 550, 420 + i * 210, themeColors.muted, 3);
      });
      completionFooter(
        ctx,
        api,
        'Fixed replay and original edit identity make the causal comparison interpretable',
      );
    }
    return true;
  });
}
export default {
  id: 'diagnostic-repair',
  draw: drawDiagnosticRepair,
  cues: ['cc-diagnostic-repair-0', 'cc-diagnostic-repair-1'],
};
