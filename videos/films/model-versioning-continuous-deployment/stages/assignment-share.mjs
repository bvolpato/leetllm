import { clamp, requestExposure } from '../arithmetic.mjs';
import { STABLE } from '../model.mjs';
import { chapterText, footer, formatDecimal, pill, rectangle } from '../defaults.mjs';
export function drawAssignmentShare(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    cue = (k) => state.cues?.['mv-assignment-share-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => !!cue(k) && cue(k).phase !== 'before';
  api.focus.target('assignment-share-mechanism', () => {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'Atomic first assignment is retained across turns',
        960,
        300,
        36,
        themeColors.yellow,
      );
      const saved = B('save');
      ['first turn', 'next turn', 'after alias widening'].forEach((v, i) => {
        pill(ctx, api, v, 370 + i * 590, 455, 510, themeColors.blue);
        rectangle(ctx, api, 140 + i * 590, 575, 460, 230, themeColors.panel, themeColors.cyan);
        chapterText(ctx, api, 'thread-0', 370 + i * 590, 655, 31, themeColors.ink);
        if (saved || i === 0)
          chapterText(
            ctx,
            api,
            'STABLE ' + STABLE.slice(0, 8),
            370 + i * 590,
            745,
            28,
            themeColors.blue,
          );
      });
      footer(ctx, api, 'SHA-256 bucket · durable shared first-write · defined expiry');
    } else {
      const counts = [20, ...Array(9).fill(1)],
        ex = requestExposure(counts, 0),
        aborted = currentBeat === 2 && B('abort');
      chapterText(ctx, api, 'Same 10 conversation identities', 960, 290, 36, themeColors.yellow);
      counts.forEach((n, i) => {
        const x = 235 + i * 160,
          col = i === 0 ? (aborted ? themeColors.pink : themeColors.cyan) : themeColors.blue;
        api.circle(ctx, x, 430, 35, col);
        chapterText(ctx, api, 'C' + (i + 1), x, 440, 26, themeColors.panel);
        if (currentBeat > 1 || B('requests')) {
          for (let j = 0; j < n; j++)
            rectangle(ctx, api, x - 40 + (j % 2) * 43, 515 + Math.floor(j / 2) * 31, 30, 21, col);
        }
      });
      if ((currentBeat === 1 && resultComplete('ten')) || currentBeat > 1)
        chapterText(ctx, api, '1 / 10 conversations = 10%', 560, 905, 34, themeColors.cyan);
      if ((currentBeat === 1 && resultComplete('share')) || currentBeat > 1)
        chapterText(
          ctx,
          api,
          '20 / 29 requests = ' + formatDecimal(ctx, api, 100 * ex.requestShare, 1) + '%',
          1380,
          905,
          34,
          themeColors.cyan,
        );
      if (aborted)
        chapterText(
          ctx,
          api,
          B('incompatible')
            ? 'Failed assignment held for compatible recovery'
            : 'C1 candidate assignment invalidated',
          960,
          985,
          33,
          themeColors.pink,
        );
      footer(
        ctx,
        api,
        currentBeat === 2
          ? 'Failed assignments may be overridden; old state still needs compatibility review'
          : 'Authored request counts · threshold applies to new conversations',
      );
    }
  });
}
export default {
  id: 'assignment-share',
  draw: drawAssignmentShare,
  cues: [
    'mv-assignment-share-save',
    'mv-assignment-share-ten',
    'mv-assignment-share-requests',
    'mv-assignment-share-share',
    'mv-assignment-share-abort',
    'mv-assignment-share-incompatible',
  ],
};
