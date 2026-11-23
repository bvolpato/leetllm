import { MAY_POLICY } from '../fixtures.mjs';
import { TRACKS, boostCue, establishedProgress } from '../construction.mjs';
import { focusScope, legacyText, recordCard } from '../defaults.mjs';
export function drawRelease(ctx, scene, state, api) {
  const { C: themeColors, components } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const once = (firstBeat = 0, from = 0.08, to = 0.82) =>
    establishedProgress(state, firstBeat, from, to);
  const snapshot = TRACKS['release'].sample({
      beat,
      beatP: progress,
    }).snapshot,
    completed = (id, b = beat) => boostCue(state, id, b) === 1;
  {
    legacyText(
      ctx,
      api,
      `May selected-policy cost · ${snapshot.cost}`,
      960,
      300,
      35,
      themeColors.yellow,
      'center',
    );
    focusScope(ctx, api, 'release-simulation-64', () =>
      snapshot.slices.forEach((slice, index) => {
        const y = 460 + index * 170;
        const coverage = slice.positives ? slice.caught / slice.positives : 0;
        const cueId = index === 0 ? 'release-priority' : 'release-large';
        const shown = completed(cueId, 0) ? 1 : 0;
        const track = focusScope(ctx, api, `release-slice-${index}`, () =>
          recordCard(
            ctx,
            api,
            'release',
            shown
              ? `${slice.name} · ${slice.caught} of ${slice.positives} misses caught`
              : `${slice.name} · result pending`,
            400,
            y,
            1120,
            82,
            themeColors.blue,
            1,
            27,
          ),
        );
        focusScope(ctx, api, `release-slice-${index}`, () =>
          recordCard(
            ctx,
            api,
            'release',
            '',
            400,
            y + 100,
            Math.max(20, 1120 * coverage),
            18,
            themeColors.green,
            shown,
            24,
          ),
        );
        if (beat > 0)
          components.fade(once(1, 0.08, 0.4), () =>
            legacyText(
              ctx,
              api,
              `Support ${slice.positives} · minimum ${MAY_POLICY.minimumSlicePositives}`,
              960,
              y + 150,
              25,
              themeColors.muted,
              'center',
            ),
          );
        void track;
      }),
    );
    const gates = [
      'time-valid features',
      'frozen rounds + threshold',
      'slice evidence',
      'serving + rollback',
    ];
    if (beat === 2)
      gates.forEach((label, index) =>
        recordCard(
          ctx,
          api,
          'release',
          label,
          180 + index * 410,
          830,
          370,
          70,
          themeColors.blue,
          once(2, index * 0.12, 0.82),
          24,
        ),
      );
    {
    }
  }
}
export default {
  id: 'release',
  draw: drawRelease,
  cues: ['release-priority', 'release-large', 'release-beat-2-focus-1', 'release-beat-3-focus-1'],
};
