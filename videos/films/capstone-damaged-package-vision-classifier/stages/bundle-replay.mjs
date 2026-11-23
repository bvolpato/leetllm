import { visionServed, visionTestRows } from '../construction.mjs';
import { visionFrame } from '../model.mjs';
import { visionCard, visionNote, visionText } from '../defaults.mjs';
export function drawBundleReplay(ctx, scene, state, api) {
  const frameState = visionFrame('bundle-replay', state);
  return api.focus.target('dv-bundle-replay-mechanism', () => {
    const { C: themeColors } = api;
    const currentBeat = frameState.beat,
      resultComplete = frameState.after;
    {
      const row = visionTestRows[0],
        trace = visionServed[0];
      if (currentBeat === 0) {
        const columns = [
          Object.entries(trace).slice(0, 7),
          Object.entries(trace).slice(7, 14),
          Object.entries(trace).slice(14),
        ];
        columns.forEach((rows, c) =>
          rows.forEach(([key, v], r) => {
            const x = 150 + c * 550,
              y = 345 + r * 75;
            visionText(ctx, api, key.replaceAll('_', ' '), x, y, 24, themeColors.muted);
            visionText(ctx, api, String(v).replaceAll('_', ' '), x, y + 31, 27, themeColors.ink);
          }),
        );
        if (resultComplete('trace-fields', 0))
          visionText(
            ctx,
            api,
            'All 20 fields → exact local replay',
            960,
            932,
            34,
            themeColors.cyan,
            'center',
          );
        visionNote(
          ctx,
          api,
          'Retained input + output + original bundle recompute this complete route dictionary.',
        );
      } else if (currentBeat === 1) {
        visionCard(ctx, api, 'Retained bundle · τ .70', 150, 340, 650, 100, themeColors.blue);
        visionCard(ctx, api, 'Active bundle · τ .90', 1110, 340, 650, 100, themeColors.muted);
        visionText(
          ctx,
          api,
          'R-404-a · supplied damage .83',
          960,
          550,
          37,
          themeColors.yellow,
          'center',
        );
        visionCard(
          ctx,
          api,
          resultComplete('snapshot-replay', 1)
            ? 'Replay → priority'
            : 'Replaying original snapshot',
          150,
          670,
          650,
          110,
          resultComplete('snapshot-replay', 1) ? themeColors.cyan : themeColors.muted,
        );
        visionCard(
          ctx,
          api,
          'A new active policy cannot rewrite it',
          1110,
          670,
          650,
          110,
          themeColors.muted,
        );
        if (resultComplete('snapshot-tamper', 1))
          visionText(
            ctx,
            api,
            'Missing threshold · changed action · numeric Boolean → reject',
            960,
            912,
            31,
            themeColors.pink,
            'center',
          );
        visionNote(
          ctx,
          api,
          'Exact field membership and types matter. Replaying editable copies supplies no independent provenance.',
        );
      } else {
        const a = visionCard(
            ctx,
            api,
            'Editable local copies',
            150,
            410,
            600,
            120,
            themeColors.yellow,
          ),
          z = visionCard(
            ctx,
            api,
            'Enforced retained artifacts',
            1130,
            410,
            620,
            120,
            themeColors.cyan,
          );
        api.arrow(ctx, a.x + a.width + 40, 470, z.x - 40, 470, themeColors.muted, 4);
        ['Unique attempt event', 'Actual event timestamp', 'Artifact-resolving identity'].forEach(
          (v, i) => visionCard(ctx, api, v, 150 + i * 550, 740, 500, 100, themeColors.muted),
        );
        visionText(
          ctx,
          api,
          resultComplete('storage-boundary', 2)
            ? 'Dictionary equality does not enforce storage retention'
            : 'Separate replay arithmetic from a production evidence store',
          960,
          645,
          32,
          themeColors.ink,
          'center',
        );
        visionNote(
          ctx,
          api,
          'The fixture assumes one attempt per photo per bundle and reuses capture day as route day.',
        );
      }
    }
  });
}
export default {
  id: 'bundle-replay',
  draw: drawBundleReplay,
  cues: [
    'dv-bundle-replay-0',
    'dv-bundle-replay-operation-0',
    'dv-trace-fields',
    'dv-bundle-replay-1',
    'dv-bundle-replay-operation-1',
    'dv-snapshot-replay',
    'dv-snapshot-tamper',
    'dv-bundle-replay-2',
    'dv-bundle-replay-operation-2',
    'dv-storage-boundary',
  ],
};
