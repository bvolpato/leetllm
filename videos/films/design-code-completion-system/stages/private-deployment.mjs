import { completionCue } from '../construction.mjs';
import {
  completionBox,
  completionFooter,
  completionHeading,
  completionText,
} from '../defaults.mjs';
export function drawPrivateDeployment(ctx, scene, state, api) {
  api.focus.target('cc-private-deployment-mechanism', () => {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0,
      progress = Math.max(0, Math.min(1, state.beatP ?? 0)),
      done = (id) => completionCue(state, id) >= 1;
    {
      completionHeading(
        ctx,
        api,
        done('cc-offline-local') || currentBeat > 0
          ? 'Offline: context and inference remain inside the local boundary'
          : 'A private endpoint still needs its surrounding controls',
      );
      api.rect(ctx, 190, 370, 1540, 520, undefined, themeColors.blue, 2, 10);
      ['Editor / identity', 'Context / policy', 'Model / inference'].forEach((v, i) => {
        completionBox(
          ctx,
          api,
          v,
          270 + i * 500,
          500,
          420,
          110,
          [themeColors.yellow, themeColors.cyan, themeColors.green][i],
        );
        if (i < 2) api.arrow(ctx, 710 + i * 500, 555, 750 + i * 500, 555, themeColors.muted, 3);
      });
      completionText(
        ctx,
        api,
        'Repository access · logs · network · supply chain · license',
        960,
        790,
        32,
        themeColors.ink,
        'center',
      );
      completionFooter(
        ctx,
        api,
        'Policy also governs telemetry, caches, batches, recovery and training exports',
      );
    }
    return true;
  });
}
export default {
  id: 'private-deployment',
  draw: drawPrivateDeployment,
  cues: ['cc-private-deployment-0', 'cc-offline-local', 'cc-private-deployment-1'],
};
