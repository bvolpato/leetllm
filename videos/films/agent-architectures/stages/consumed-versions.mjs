import { dependencyState } from '../protocols.mjs';
import {
  drawBox,
  drawCenteredText,
  drawDependencyGraph,
  drawFocusTarget,
  drawFooter,
} from '../defaults.mjs';
export function drawConsumedVersions(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1;
  const paintMechanism = () => {
    const refresh = resultComplete('version-health'),
      removed = currentBeat === 1 && resultComplete('version-effect'),
      recorded = currentBeat === 1 && (resultComplete('version-recorded') || removed),
      now = 1100,
      receipts = {
        ci: {
          revision: 'c1842',
          until: 1200,
          version: 1,
        },
        diff: {
          revision: 'c1842',
          until: 1200,
          version: 1,
        },
        health: {
          revision: 'c1842',
          until: refresh ? 1250 : 1100,
          version: refresh ? 2 : 1,
        },
        decision: {
          revision: 'c1842',
          until: 1200,
          version: 1,
          consumed: {
            ci: 1,
            diff: 1,
            health: 1,
          },
        },
      },
      check = dependencyState(receipts, 'c1842', now);
    drawCenteredText(
      ctx,
      api,
      'Requested c1842 \xB7 now ' + now + ' · validity is exclusive',
      960,
      275,
      33,
      themeColors.yellow,
    );
    drawDependencyGraph(
      ctx,
      api,
      check.valid,
      {
        health: 'v' + receipts.health.version,
        decision: 'used health v' + receipts.decision.consumed.health,
      },
      check.ready[0],
      removed,
    );
    {
      if (!recorded)
        drawCenteredText(
          ctx,
          api,
          refresh
            ? 'New health v2 cannot revive decision made from v1'
            : 'Decision records exactly which parent versions it consumed',
          960,
          935,
          30,
          refresh ? themeColors.pink : themeColors.cyan,
        );
      if (recorded) {
        drawBox(
          ctx,
          api,
          'External proposal ledger: RB2041',
          1170,
          785,
          620,
          120,
          themeColors.yellow,
        );
        if (removed)
          drawCenteredText(ctx, api, 'effect node removed', 1590, 550, 27, themeColors.muted);
        drawCenteredText(ctx, api, 'Existing proposal persists', 1575, 950, 26, themeColors.yellow);
      }
    }
    drawFooter(ctx, api, 'Version, own timestamp and all consumed dependencies must remain valid');
  };
  drawFocusTarget(ctx, api, 'aa-consumed-versions-mechanism', paintMechanism);
}
export default {
  id: 'consumed-versions',
  draw: drawConsumedVersions,
  cues: [
    'aa-consumed-versions-0',
    'version-health',
    'version-invalid',
    'aa-consumed-versions-1',
    'version-recorded',
    'version-effect',
  ],
};
