import { prefBound } from '../arithmetic.mjs';
import { caption, cell, constructionText, focusTarget, heading, line } from '../defaults.mjs';
export function drawOnlineRefresh(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = prefBound(state.beatP ?? 0);
  const cueProgress = (id, beat = currentBeat) => {
    const cue = state.cues?.[id];
    if (state.cues && !Object.hasOwn(state.cues, id))
      throw Error('Undeclared cue online-refresh/' + id);
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
    heading(ctx, api, 'The old comparison archive stays fixed while current-policy data grows');
    cell(ctx, api, 'P7 · C1: A > B', 170, 405, 590, 90, themeColors.blue, 34);
    constructionText(ctx, api, 'stored texts and label retained', 170, 570, 29, themeColors.muted);
    if (currentBeat > 0 || resultComplete('pa-refresh-edge', 0))
      cell(ctx, api, 'Pair Cnew: A2 > C2 · reviewed', 170, 610, 590, 70, themeColors.green, 27);
    if (currentBeat === 0) {
      cell(ctx, api, 'current πθ', 1080, 405, 600, 90, themeColors.cyan, 34);
      constructionText(ctx, api, 'new response IDs A2 and C2', 1080, 570, 31, themeColors.cyan);
      if (resultComplete('pa-refresh-edge', 0)) {
        api.arrow(ctx, 1080, 630, 760, 645, themeColors.green, 4);
      }
    } else if (currentBeat === 1) {
      constructionText(ctx, api, 'Current-policy sample path', 170, 715, 32, themeColors.cyan);
      constructionText(ctx, api, 'Reference-mixture sample path', 170, 850, 32, themeColors.yellow);
      line(ctx, api, 800, 705, 1660, 705, themeColors.cyan, 6);
      line(ctx, api, 800, 840, 1230, 840, themeColors.cyan, 6);
      line(ctx, api, 1230, 840, 1660, 840, themeColors.blue, 6);
      constructionText(ctx, api, 'πθ', 1100, 655, 31, themeColors.cyan);
      constructionText(
        ctx,
        api,
        'declared mixture weight and reference revision',
        900,
        930,
        27,
        themeColors.yellow,
      );
    } else {
      constructionText(
        ctx,
        api,
        'A biased judge can label the fabricated exception incorrectly.',
        170,
        720,
        33,
        themeColors.pink,
      );
      cell(ctx, api, 'Biased judge: C2 > A2', 1080, 405, 600, 90, themeColors.pink, 31);
      line(ctx, api, 1120, 520, 1640, 520, themeColors.pink, 4);
      constructionText(
        ctx,
        api,
        'Independent policy evidence must inspect C2’s claimed exception.',
        170,
        920,
        31,
        themeColors.green,
      );
    }
    caption(
      ctx,
      api,
      'Online comparison collection need not fit a critic; sampling and reference rules still belong to the method.',
    );
    return;
  };
  focusTarget(ctx, api, 'online-refresh-construction', construction);
}
export default {
  id: 'online-refresh',
  draw: drawOnlineRefresh,
  cues: [
    'online-refresh-b0',
    'pa-refresh-edge',
    'online-refresh-b1',
    'pa-refresh-mixture',
    'online-refresh-b2',
  ],
};
