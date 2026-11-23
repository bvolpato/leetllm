import { visibleLineSegments } from '../arithmetic.mjs';
import { directed, scaleCalculation } from '../model.mjs';
import { extensionNote, extensionText } from '../defaults.mjs';
export function drawScaleBoundary(ctx, scene, state, api) {
  return api.focus.target('scale-boundary-construction', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const labelBoxes = [],
      pendingSegments = [];
    const cueProgress = (beat, sentence) =>
        directed(state, `cp-scale-boundary-${beat}-${sentence}`, beat),
      resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
    {
      const model = scaleCalculation(),
        query = [3.1, 710],
        queryZ = query.map((v, i) => (v - model.means[i]) / model.stds[i]),
        u = cueProgress(0, 1);
      extensionText(
        ctx,
        api,
        labelBoxes,
        'Transform T1 · fitted on corpus rows',
        540,
        270,
        34,
        themeColors.cyan,
      );
      ['ID', 'raw topic', 'raw length', 'T1 topic', 'T1 length'].forEach((v, i) =>
        extensionText(ctx, api, labelBoxes, v, 160 + i * 205, 355, 25, themeColors.muted),
      );
      model.rows.forEach((row, i) =>
        [row.id, ...row.raw, ...row.standardized.map((v) => v.toFixed(3))].forEach((v, j) =>
          extensionText(
            ctx,
            api,
            labelBoxes,
            j < 3 || u === 1 ? v : '?',
            160 + j * 205,
            435 + i * 73,
            28,
            j >= 3 ? themeColors.cyan : themeColors.ink,
          ),
        ),
      );
      extensionText(
        ctx,
        api,
        labelBoxes,
        'Incoming query [' + query.join(', ') + ']',
        1460,
        365,
        31,
        themeColors.yellow,
      );
      if (cueProgress(0, 2) > 0) {
        extensionText(
          ctx,
          api,
          labelBoxes,
          'T1 μ [' + model.means.map((v) => v.toFixed(2)).join(', ') + ']',
          1460,
          475,
          27,
          themeColors.muted,
        );
        extensionText(
          ctx,
          api,
          labelBoxes,
          'T1 s [' + model.stds.map((v) => v.toFixed(2)).join(', ') + ']',
          1460,
          535,
          27,
          themeColors.muted,
        );
        extensionText(
          ctx,
          api,
          labelBoxes,
          resultComplete(0, 2)
            ? 'T1(query) [' + queryZ.map((v) => v.toFixed(3)).join(', ') + ']'
            : 'Apply T1 to both coordinates',
          1460,
          650,
          31,
          themeColors.green,
        );
      }
      if (cueProgress(0, 3) > 0)
        extensionText(
          ctx,
          api,
          labelBoxes,
          'Refit on one query: s = 0 → undefined',
          1460,
          790,
          28,
          themeColors.pink,
        );
      if (currentBeat === 1) {
        extensionText(
          ctx,
          api,
          labelBoxes,
          resultComplete(1, 3) ? 'Held-out queries: APPLY only' : 'Fit: corpus / development',
          1460,
          900,
          30,
          themeColors.yellow,
        );
        if (resultComplete(1, 4))
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Record an explicitly transductive protocol separately',
            960,
            960,
            27,
            themeColors.muted,
          );
      }
      extensionNote(
        ctx,
        api,
        labelBoxes,
        'Coordinate systems carry fitted values and a revision, just as vectors carry a model revision.',
      );
    }
    for (const { q, a, z, color, width } of pendingSegments)
      for (const points of visibleLineSegments(a, z, labelBoxes))
        api.path(ctx, points, {
          color,
          width,
          clip: q.bounds,
        });
  });
}
export default {
  id: 'scale-boundary',
  draw: drawScaleBoundary,
  cues: [
    'cp-scale-boundary-0-0',
    'cp-scale-boundary-0-1',
    'cp-scale-boundary-0-2',
    'cp-scale-boundary-0-3',
    'cp-scale-boundary-1-0',
    'cp-scale-boundary-1-1',
    'cp-scale-boundary-1-2',
    'cp-scale-boundary-1-3',
    'cp-scale-boundary-1-4',
  ],
};
