import { systemExtensionFrame } from '../construction.mjs';
import { chapterCard, chapterText, dot, footer, header, line } from '../defaults.mjs';
export function drawAclFreshness(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = systemExtensionFrame('acl-freshness', state),
    currentBeat = modelState.beat,
    progress = modelState.op;
  return api.focus.target('sd-acl-freshness-mechanism', () => {
    header(ctx, api, 'Snapshot clock and revocation clock');
    const x = (t) => 240 + t * 24;
    line(ctx, api, x(0), 480, x(60), 480, themeColors.muted, 4);
    dot(ctx, api, x(20), 480, themeColors.blue);
    chapterText(ctx, api, 'snapshot age 20 s', x(20), 420, 30, themeColors.blue, 'center');
    dot(ctx, api, x(1), 660, themeColors.pink);
    chapterText(ctx, api, 'revocation 1 s ago', x(1) + 230, 670, 29, themeColors.pink);
    line(ctx, api, x(60), 430, x(60), 735, themeColors.yellow, 4);
    chapterText(ctx, api, 'age budget 60 s', x(60), 795, 28, themeColors.yellow, 'right');
    if (modelState.resultReady || currentBeat === 2) {
      chapterCard(ctx, api, 'Freshness: PASS', 240, 850, 610, themeColors.green, 78);
      chapterCard(ctx, api, 'Current finance grant: DENIED', 1030, 850, 680, themeColors.pink, 78);
    } else
      chapterText(
        ctx,
        api,
        'A usable snapshot can still predate a revoked grant',
        960,
        875,
        34,
        themeColors.yellow,
        'center',
      );
    footer(
      ctx,
      api,
      currentBeat === 0
        ? 'Tombstone excludes a deleted version before slower physical compaction'
        : 'Filtered chunks remain inside the trusted index boundary',
    );
  });
}
export default {
  id: 'acl-freshness',
  draw: drawAclFreshness,
  cues: [
    'sd-acl-freshness-0-operation',
    'sd-acl-freshness-0-result',
    'sd-acl-freshness-1-operation',
    'sd-acl-freshness-1-result',
    'sd-acl-freshness-2-operation',
    'sd-acl-freshness-2-result',
  ],
};
