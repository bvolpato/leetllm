import { opProgress } from '../construction.mjs';
import {
  drawConstructionFooter,
  drawConstructionGrid,
  drawConstructionRows,
  drawConstructionTitle,
} from '../defaults.mjs';
export function drawReleaseEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = opProgress(state, 'release-evidence');
  {
    drawConstructionTitle(
      ctx,
      api,
      currentBeat === 2
        ? 'Keep each release gate and metric independent'
        : currentBeat === 0
          ? 'Read down the release record'
          : 'A file can fail on the field type alone',
    );
    if (currentBeat < 2) {
      drawConstructionGrid(
        ctx,
        api,
        currentBeat === 0
          ? [
              ['Field', 'Required representation', 'Failure route'],
              ['attempt', 'positive int == trusted current', 'stale'],
              ['policy / human review', 'pass / exactly False', 'review'],
              ['watermark / manifest', 'detected / exactly True', 'hold'],
              ['asset / checked digest', 'same nonempty strings', 'hold'],
            ]
          : [
              ['Field', 'Value in the record', 'Decision'],
              ['Manifest committed', '"false" (text)', 'Hold the file'],
              ['Attempt', '2.0 (float)', 'Stale attempt'],
              ['Digest pair', 'Two matching lists', 'Hold the file'],
            ],
        170,
        380,
        1580,
        425,
        themeColors.cyan,
        27,
      );
      drawConstructionFooter(
        ctx,
        api,
        currentBeat === 0
          ? 'Each gate must pass for this file to be released'
          : 'Expected types: Boolean manifest flag, integer attempt, string digests',
      );
    } else {
      drawConstructionRows(
        ctx,
        api,
        [
          ['Pinned matched comparison', 'Model/VAE/sampler/seed/prompt/steps/guidance'],
          ['Independent measurements', 'Quality / safety / failure / p95 / accepted cost'],
          ['Rollout by eligible route', 'Shadow → 1% → 10% → gates before ramp'],
        ],
        380,
        180,
      );
      drawConstructionFooter(
        ctx,
        api,
        'A labeled illustration cannot become observed incident evidence',
      );
    }
    return;
  }
}
export default {
  id: 'release-evidence',
  draw: drawReleaseEvidence,
  cues: ['df-release-evidence-0', 'df-release-evidence-1', 'df-release-evidence-2'],
};
