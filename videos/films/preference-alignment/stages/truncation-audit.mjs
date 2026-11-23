import { prefBound } from '../arithmetic.mjs';
import { cell, constructionText, focusTarget, heading, line } from '../defaults.mjs';
export function drawTruncationAudit(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue truncation-audit/' + id);
    return cue
      ? cue.phase === 'before'
        ? 0
        : cue.phase === 'after'
          ? 1
          : prefBound(cue.progress)
      : currentBeat < beat
        ? 0
        : currentBeat > beat
          ? 1
          : prefBound((progress - 0.12) / 0.76);
  };
  const resultComplete = (id, beat = currentBeat) => cueProgress(id, beat) >= 1 - 1e-8;
  const construction = () => {
    const tokensA = ['P', 'P', 'P', 'P', 'P', 'P', 'cite', 'P7', 'and', 'then', 'escalate', 'EOS'],
      tokensB = ['P', 'P', 'P', 'P', 'P', 'P', 'cite', 'P7', 'and', 'then', 'grant', 'EOS'],
      cut = resultComplete('pa-truncate-cut', 1);
    heading(ctx, api, 'TRL 1.17    ·    Keep the first 8 tokens');
    if (currentBeat === 2) {
      const dropped = resultComplete('pa-truncate-drop', 2);
      constructionText(
        ctx,
        api,
        'A prompt alone fills all 8 retained positions',
        170,
        370,
        32,
        themeColors.blue,
      );
      for (let i = 0; i < 8; i++)
        cell(ctx, api, 'P' + i, 170 + i * 195, 450, 175, 85, themeColors.blue, 32);
      constructionText(
        ctx,
        api,
        dropped ? '0 reply tokens    ·    Drop this pair' : 'The prompt fills the window',
        170,
        725,
        39,
        dropped ? themeColors.pink : themeColors.yellow,
      );
      constructionText(
        ctx,
        api,
        'A custom collator needs a scored next-token target in each reply.',
        170,
        910,
        29,
        themeColors.muted,
      );
    } else {
      for (const [r, ids] of [tokensA, tokensB].entries()) {
        const y = 420 + r * 215;
        constructionText(
          ctx,
          api,
          r === 0 ? 'chosen' : 'rejected',
          170,
          y + 40,
          28,
          r === 0 ? themeColors.green : themeColors.pink,
        );
        for (let i = 0; i < ids.length; i++) {
          const x = 355 + i * 115;
          if (!cut || i < 8) {
            cell(
              ctx,
              api,
              ids[i],
              x,
              y,
              105,
              76,
              i < 6 ? themeColors.muted : i === 10 ? themeColors.yellow : themeColors.blue,
              i < 6 ? 29 : 25,
            );
            constructionText(ctx, api, i, x + 52, y + 120, 23, themeColors.muted, 'center');
          }
        }
      }
      line(ctx, api, 355 + 8 * 115 - 6, 355, 355 + 8 * 115 - 6, 820, themeColors.yellow, 4);
      constructionText(ctx, api, 'cut at position 8', 1300, 880, 28, themeColors.yellow);
      constructionText(
        ctx,
        api,
        cut
          ? 'Scored tokens in each reply    ·    cite  P7'
          : 'Which reply tokens are on the left of the cut?',
        170,
        960,
        31,
        cut ? themeColors.pink : themeColors.muted,
      );
    }
    return;
  };
  focusTarget(ctx, api, 'truncation-audit-construction', construction);
}
export default {
  id: 'truncation-audit',
  draw: drawTruncationAudit,
  cues: [
    'truncation-audit-b0',
    'pa-truncate-cut',
    'truncation-audit-b1',
    'pa-truncate-drop',
    'truncation-audit-b2',
  ],
};
