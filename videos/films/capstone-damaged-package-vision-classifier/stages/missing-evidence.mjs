import { visionFrame } from '../model.mjs';
import { visionMetrics, visionNote, visionTable, visionText } from '../defaults.mjs';
export function drawMissingEvidence(ctx, scene, state, api) {
  const frameState = visionFrame('missing-evidence', state);
  return api.focus.target('dv-missing-evidence-mechanism', () => {
    const { C: themeColors } = api;
    const resultComplete = frameState.after;
    {
      visionText(
        ctx,
        api,
        'Change evidence availability · keep every route fixed',
        960,
        290,
        37,
        themeColors.ink,
        'center',
      );
      const countReady = !frameState.late || resultComplete('late-observed-metrics', 0),
        verdict = resultComplete('late-completeness', 1),
        restored = resultComplete('late-restored-metrics', 1);
      const rows = [['Case', 'Original action', 'Available', 'In report']];
      for (const o of frameState.outcomes) {
        const action = frameState.servedActions[o.case_id],
          joined = frameState.joined.some((r) => r.case_id === o.case_id);
        rows.push([
          o.case_id,
          action === 'priority_damage_review' ? 'Priority' : 'Normal',
          'day ' + o.available_day,
          countReady ? (joined ? 'yes' : 'not yet') : 'pending',
        ]);
      }
      if (frameState.empty) rows.push(['No outcomes', 'Routes retained', '—', '0 / 4']);
      visionTable(ctx, api, rows, 200, 390, 1500, 88);
      visionText(
        ctx,
        api,
        countReady
          ? 'Cutoff day ' +
              frameState.cutoff +
              ' · ' +
              frameState.joined.length +
              ' / ' +
              frameState.expected +
              ' eligible outcomes'
          : 'Cutoff day ' + frameState.cutoff + ' · joining eligible outcomes',
        960,
        790,
        32,
        frameState.empty || (verdict && !restored) ? themeColors.pink : themeColors.ink,
        'center',
      );
      visionMetrics(ctx, api, frameState, frameState.showMetrics, 845);
      visionNote(
        ctx,
        api,
        frameState.empty
          ? 'No outcomes → unknown metrics → HOLD. Missing evidence cannot be relabeled as success.'
          : restored
            ? 'The same damaged normal case returns. Observation completeness changed; model behavior did not.'
            : verdict
              ? 'Incomplete evidence → HOLD, even when observed recall is numerically larger.'
              : frameState.late
                ? 'Delayed availability is recorded; the completeness decision is pending.'
                : 'Baseline: complete original day-twelve evidence. Every served route is retained.',
      );
    }
  });
}
export default {
  id: 'missing-evidence',
  draw: drawMissingEvidence,
  cues: [
    'dv-missing-evidence-0',
    'dv-missing-evidence-operation-0',
    'dv-late-case-change',
    'dv-late-observed-metrics',
    'dv-missing-evidence-1',
    'dv-missing-evidence-operation-1',
    'dv-late-completeness',
    'dv-late-restored-metrics',
    'dv-missing-evidence-2',
    'dv-missing-evidence-operation-2',
    'dv-empty-metrics',
  ],
};
