import { ids } from '../fixtures.mjs';
import { drawGovernanceExpansionFooter, drawGovernanceExpansionText } from '../defaults.mjs';
function paintGovernanceMechanism(ctx, scene, state, api) {
  const baseIds = new Set(ids),
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  if (baseIds.has('dated-obligations') && currentBeat < 3) return false;
  const { C: themeColors, components: components } = api,
    q = api.phase(progress, 0.08, 0.65);
  const focusId = baseIds.has('dated-obligations')
    ? `${'dated-obligations'}-extension-${currentBeat + 1}`
    : 'dated-obligations-mechanism';
  // Every new cue points at the actual mechanism's bounding geometry.
  return api.focus.target(focusId, () => {
    {
      const start = Date.parse('2025-01-01'),
        end = Date.parse('2029-01-01'),
        X = (d) => 360 + ((Date.parse(d) - start) / (end - start)) * 1300;
      const rails = [
        ['GPAI', '2025-08-02', themeColors.green],
        ['General Article50', '2026-08-02', themeColors.blue],
        ['Old-system50(2) only', '2026-12-02', themeColors.cyan],
        ['AnnexIII high-risk', '2027-12-02', themeColors.pink],
        ['AnnexI product route', '2028-08-02', themeColors.yellow],
      ];
      rails.forEach(([name, date, col], i) => {
        const y = 360 + i * 120,
          active =
            currentBeat === 0
              ? i >= 3
              : currentBeat === 1
                ? i === 1
                : currentBeat === 2
                  ? i === 2
                  : i === 0;
        components.fade(active ? 1 : 0.35, () => {
          drawGovernanceExpansionText(ctx, api, name, 180, y + 8, 27, col);
          api.line(ctx, 510, y, 1740, y, themeColors.muted, 2);
          api.circle(ctx, X(date), y, 12, col);
          drawGovernanceExpansionText(ctx, api, date, X(date), y - 33, 25, col, 'center');
        });
      });
      if (currentBeat === 3) {
        const y = 360;
        api.line(ctx, X('2025-08-02'), y + 35, X('2027-08-02'), y + 35, themeColors.green, 5);
        drawGovernanceExpansionText(
          ctx,
          api,
          'Models on the market before 2025-08-02 transition on 2027-08-02',
          960,
          970,
          29,
          themeColors.green,
          'center',
        );
      } else
        drawGovernanceExpansionText(
          ctx,
          api,
          currentBeat === 0
            ? 'Annex III listed use and Annex I product rules have separate dates'
            : currentBeat === 1
              ? 'Interaction notice  ·  Output marking  ·  Deployer disclosure'
              : 'Existing systems: extra time for Article 50(2) marking and detection',
          960,
          970,
          29,
          themeColors.yellow,
          'center',
        );
      drawGovernanceExpansionFooter(
        ctx,
        api,
        'Reviewed2026-11-06 · record market date, actual obligation, material changes and legal signoff',
      );
    }
    return true;
  });
}

export function drawDatedObligations(ctx, scene, state, api) {
  return api.focus.target('gov-' + scene.id + '-mechanism', () => {
    paintGovernanceMechanism(ctx, scene, state, api);
  });
}
export default {
  id: 'dated-obligations',
  draw: drawDatedObligations,
  cues: [
    'dated-obligations-b1',
    'dated-obligations-b2',
    'dated-obligations-b3',
    'dated-obligations-b4',
  ],
};
