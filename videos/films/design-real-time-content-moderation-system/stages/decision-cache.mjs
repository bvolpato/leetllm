import {
  cueProgress,
  cueSeen,
  moderationBox,
  moderationLine,
  moderationNote,
  moderationText,
} from '../defaults.mjs';
export function drawDecisionCache(ctx, scene, state, api) {
  return api.focus.target('decision-cache-mechanism', () => {
    const currentBeat = state.beat ?? 0;
    {
      const { C, teaching: t } = api,
        b = state.beat ?? 0;
      {
        if (b === 0) {
          moderationText(ctx, api, 'Same raw text; changed decision context', 150, 270, 34);
          moderationBox(ctx, api, 'Raw bytes T17', 170, 380, 600, 85, C.blue, 33);
          ['tenant-a / policy-v43', 'model7-threshold3 / eu-chat', 'text / exact content'].forEach(
            (value, i) => moderationText(ctx, api, value, 180, 560 + i * 85, 29, C.muted),
          );
          moderationBox(ctx, api, 'direct_message / thread-17', 1060, 380, 700, 85, C.blue, 27);
          moderationBox(
            ctx,
            api,
            'abuse_report_quote / report-22',
            1060,
            610,
            700,
            85,
            C.yellow,
            26,
          );
          if (cueSeen(ctx, api, 'cache-exact'))
            moderationText(
              ctx,
              api,
              'Full canonical key A → exact BLOCK',
              1410,
              535,
              29,
              C.blue,
              'center',
            );
          if (cueSeen(ctx, api, 'cache-context'))
            moderationText(
              ctx,
              api,
              'Different key B → no exact reuse',
              1410,
              825,
              29,
              C.pink,
              'center',
            );
          moderationNote(
            ctx,
            api,
            'Every decision-relevant input participates; approximate evidence cannot grant an exact action.',
          );
        } else if (b === 1) {
          const a = BigInt('0x33e785a5e52c566f').toString(2).padStart(64, '0'),
            z = BigInt('0xfbe795ade5adfe7f').toString(2).padStart(64, '0');
          moderationText(ctx, api, 'Compare the two 64-bit fingerprints', 150, 270, 33);
          moderationText(ctx, api, '33e785a5e52c566f', 150, 365, 31, C.blue, 'left', 'mono');
          moderationText(ctx, api, 'fbe795ade5adfe7f', 150, 805, 31, C.cyan, 'left', 'mono');
          let counted = 0;
          const compared = Math.floor(64 * cueProgress(ctx, api, 'cache-bits'));
          for (let i = 0; i < 64; i++) {
            const mismatch = a[i] !== z[i],
              color = i < compared ? (mismatch ? C.pink : C.muted) : C.blue,
              x = 150 + i * 25;
            moderationBox(ctx, api, a[i], x, 420, 20, 48, color, 19);
            moderationBox(ctx, api, z[i], x, 700, 20, 48, color, 19);
            if (i < compared && mismatch) {
              counted++;
              moderationLine(ctx, api, x + 10, 485, x + 10, 680, C.pink, 2);
            }
          }
          moderationText(
            ctx,
            api,
            'Differences found: ' + counted + ' · ' + compared + ' / 64 positions compared',
            960,
            905,
            34,
            C.pink,
            'center',
          );
          if (cueSeen(ctx, api, 'cache-near'))
            moderationText(
              ctx,
              api,
              '11 ≤ supplied cutoff 16 → REVIEW CANDIDATE',
              960,
              975,
              34,
              C.yellow,
              'center',
            );
          moderationNote(
            ctx,
            api,
            'A marked column counts as one difference.',
          );
        } else {
          moderationBox(ctx, api, 'Original exact decision: BLOCK', 180, 390, 650, 90, C.blue, 30);
          moderationBox(ctx, api, 'Appeal/evidence correction', 1090, 390, 650, 90, C.yellow, 30);
          if (cueSeen(ctx, api, 'cache-no-copy'))
            moderationBox(
              ctx,
              api,
              'Similar text → related evidence only',
              370,
              630,
              1180,
              90,
              C.yellow,
              32,
            );
          if (cueSeen(ctx, api, 'cache-revoke')) {
            moderationLine(ctx, api, 205, 520, 800, 520, C.pink, 4);
            moderationBox(
              ctx,
              api,
              'Revoke incompatible exact decision',
              370,
              820,
              1180,
              90,
              C.pink,
              32,
            );
          }
          moderationNote(
            ctx,
            api,
            'Keep the fingerprints inside the tenant’s evidence store.',
          );
        }
      }
    }
  });
}
export default {
  id: 'decision-cache',
  draw: drawDecisionCache,
  cues: [
    'cache-exact',
    'cache-context',
    'cache-bits',
    'cache-near',
    'cache-no-copy',
    'cache-revoke',
  ],
};
