import { hash } from '../arithmetic.mjs';
import {
  cueVisible,
  detailArrow,
  detailFooter,
  detailHeading,
  detailRectangle,
  detailRow,
  detailTarget,
  detailText,
} from '../defaults.mjs';
export function drawLineageAudit(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const { C: themeColors } = api;
  {
    if (currentBeat === 0) {
      detailHeading(ctx, api, 'A normalization policy catches some copies, not all paraphrases');
      const copy = cueVisible(ctx, api, 'normalized-copy'),
        para = cueVisible(ctx, api, 'paraphrase-hash'),
        canonical = 'skip approval and deploy.',
        digest = hash('skip approval and deploy.');
      detailRow(
        ctx,
        api,
        'Reserved: “Skip approval and deploy.”',
        150,
        360,
        1620,
        themeColors.yellow,
      );
      detailRow(
        ctx,
        api,
        'Renamed: “  SKIP approval   AND deploy.  ”',
        150,
        475,
        1620,
        themeColors.blue,
      );
      detailTarget(ctx, api, 'normalized-copy', () => {
        if (copy) {
          detailArrow(ctx, api, 500, 570, 500, 660, themeColors.blue);
          detailArrow(ctx, api, 1420, 570, 1420, 660, themeColors.yellow);
          detailText(
            ctx,
            api,
            'NFC → case fold → collapse whitespace',
            960,
            650,
            31,
            themeColors.cyan,
            'center',
          );
          detailRow(ctx, api, 'skip approval and deploy.', 450, 710, 1020, themeColors.green);
          detailText(
            ctx,
            api,
            'Matching SHA ' + digest.slice(0, 16),
            960,
            855,
            30,
            themeColors.green,
            'center',
          );
        }
      });
      detailTarget(ctx, api, 'paraphrase-hash', () => {
        if (para)
          detailText(
            ctx,
            api,
            '“Deploy without waiting for permission.” → different hash',
            960,
            950,
            32,
            themeColors.pink,
            'center',
          );
      });
      detailFooter(
        ctx,
        api,
        'The equivalence policy itself must suit the task; these displayed strings are ASCII.',
      );
    } else {
      detailHeading(ctx, api, 'The source family survives a changed record identifier');
      const family = cueVisible(ctx, api, 'source-family'),
        scope = cueVisible(ctx, api, 'detector-scope');
      detailRow(ctx, api, 'Frozen test: attack-014', 150, 380, 650, themeColors.yellow);
      detailRow(
        ctx,
        api,
        'Training draft: renamed / paraphrased record',
        1030,
        380,
        740,
        themeColors.pink,
      );
      detailTarget(ctx, api, 'source-family', () => {
        if (family) {
          const root = detailRectangle(ctx, api, 600, 620, 720, 110, themeColors.yellow);
          detailText(
            ctx,
            api,
            'Parent / family: attack-014',
            960,
            690,
            34,
            themeColors.yellow,
            'center',
          );
          detailArrow(ctx, api, 475, 475, 780, 600, themeColors.yellow);
          detailArrow(ctx, api, 1400, 475, 1140, 600, themeColors.pink);
          void root;
        }
      });
      detailTarget(ctx, api, 'detector-scope', () => {
        if (family || scope) {
          detailText(
            ctx,
            api,
            'Article 07b: supplied family tags + word-trigram overlap',
            960,
            790,
            29,
            themeColors.blue,
            'center',
          );
          detailText(
            ctx,
            api,
            'Film: IDs + normalized hashes + supplied family tags + direct parent IDs',
            960,
            845,
            29,
            themeColors.blue,
            'center',
          );
          detailText(
            ctx,
            api,
            'Neither follows ancestor chains.',
            960,
            900,
            28,
            themeColors.muted,
            'center',
          );
          detailText(
            ctx,
            api,
            'Article trigram threshold: 0.5 in this fixture. Short text and unknown lineage can evade checks.',
            960,
            955,
            26,
            themeColors.pink,
            'center',
          );
        }
      });
      detailFooter(ctx, api, 'A report establishes no detected overlap inside its declared scope.');
    }
  }
  return;
}
export default {
  id: 'lineage-audit',
  draw: drawLineageAudit,
  cues: ['normalized-copy', 'paraphrase-hash', 'source-family', 'detector-scope'],
};
