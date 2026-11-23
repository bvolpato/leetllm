import { EVIDENCE } from '../fixtures.mjs';
import {
  drawEvidenceUpgradeBox,
  drawEvidenceUpgradeFoot,
  drawEvidenceUpgradeLine,
  drawEvidenceUpgradeProgress,
  drawEvidenceUpgradeTable,
  drawEvidenceUpgradeText,
} from '../defaults.mjs';
export function drawStrictClaimContract(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    beatProgress = api.clamp(state.beatP ?? 0, 0, 1),
    q = api.phase(beatProgress, 0.06, 0.88),
    done = (id) => drawEvidenceUpgradeProgress(ctx, api, id) >= 1;
  {
    if (currentBeat === 0) {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Supplied old-version probe · exact source and field values retained',
        960,
        255,
        31,
        themeColors.ink,
        'center',
      );
      const stops = done('metadata-stops');
      [
        ['1 Resolve source', EVIDENCE.sourceId, themeColors.green],
        ['2 Match version', 'claim v0 ≠ admitted v1', themeColors.pink],
        ['3 Compare field', 'ETA value 14:30; not reached', themeColors.muted],
      ].forEach(([name, value, color], i) => {
        const x = 150 + i * 560;
        drawEvidenceUpgradeBox(
          ctx,
          api,
          themeColors,
          components,
          name,
          x,
          400,
          500,
          100,
          color,
          31,
        );
        drawEvidenceUpgradeText(ctx, api, themeColors, value, x + 250, 580, 26, color, 'center');
        if (i < 2)
          drawEvidenceUpgradeLine(
            ctx,
            api,
            themeColors,
            x + 515,
            450,
            x + 545,
            450,
            themeColors.muted,
            3,
          );
      });
      const travel = api.lerp(400, 960, drawEvidenceUpgradeProgress(ctx, api, 'metadata-stops'));
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'claim eta',
        travel - 90,
        725,
        180,
        75,
        stops ? themeColors.pink : themeColors.blue,
        28,
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        stops
          ? 'STOP at version: do not compare the matching-looking field'
          : 'Resolve the cited source, then its exact admitted version',
        960,
        900,
        30,
        themeColors.yellow,
        'center',
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Read-only copied facts preserve this fixture; trusted admission is a separate requirement',
        960,
        970,
        27,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      drawEvidenceUpgradeTable(
        ctx,
        api,
        themeColors,
        components,
        ['Recorded field', 'Claim value', 'Equality result'],
        [
          ['status investigating', 'status resolved', 'contradicted'],
          ['failover completed', 'failover finished', 'not supported'],
        ],
        150,
        340,
        1620,
        145,
        28,
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Exclusive canonical statuses conflict; a paraphrase exposes false rejection',
        960,
        845,
        30,
        themeColors.yellow,
        'center',
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Duplicate IDs / duplicate fields → reject · empty list → abstain',
        960,
        930,
        29,
        themeColors.pink,
        'center',
      );
    } else {
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'A valid typed value can carry unsafe free text',
        960,
        255,
        32,
        themeColors.ink,
        'center',
      );
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'field service · value embedding-api',
        170,
        360,
        720,
        110,
        themeColors.green,
      );
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'text: Service embedding-api. Fully recovered.',
        170,
        540,
        1530,
        110,
        themeColors.pink,
        30,
      );
      drawEvidenceUpgradeLine(ctx, api, themeColors, 920, 415, 1080, 415, themeColors.green);
      drawEvidenceUpgradeBox(
        ctx,
        api,
        themeColors,
        components,
        'New sentence:\nService: embedding-api.',
        1100,
        330,
        610,
        165,
        themeColors.green,
        30,
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Discard text; render only verified field/value',
        960,
        795,
        34,
        themeColors.yellow,
        'center',
      );
      drawEvidenceUpgradeText(
        ctx,
        api,
        themeColors,
        'Status omitted here → measure completeness separately',
        960,
        925,
        29,
        themeColors.muted,
        'center',
      );
    }
    drawEvidenceUpgradeFoot(
      ctx,
      api,
      themeColors,
      'Typed equality is a bounded grammar; re-extract and verify any model rewrite',
    );
  }
}
export default {
  id: 'strict-claim-contract',
  draw: drawStrictClaimContract,
  cues: [
    'strict-claim-contract-b1',
    'metadata-stops',
    'strict-claim-contract-b2',
    'strict-claim-contract-b3',
  ],
};
