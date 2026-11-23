import { clamp, motion, sandboxPages } from '../arithmetic.mjs';
import { drawFooter, drawPage, drawRectangle, drawText } from '../defaults.mjs';
export function drawArticlePageRun(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-article-page-run-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-article-page-run-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-article-page-run-mechanism', () => {
    const write = currentBeat > 1 || (currentBeat === 1 && resultComplete('write', 1)),
      second = currentBeat === 2 && resultComplete('second', 2),
      replace = currentBeat === 2 && resultComplete('replace', 2),
      writes = [
        ...(write
          ? [
              {
                clone: 'A',
                index: 1,
                value: replace ? 77 : 99,
              },
            ]
          : []),
        ...(second
          ? [
              {
                clone: 'B',
                index: 1,
                value: 55,
              },
            ]
          : []),
      ],
      m = sandboxPages([10, 20, 30], writes);
    drawText(
      ctx,
      api,
      currentBeat === 2
        ? 'Supplied follow-up: B writes 55, then A replaces 99 with 77'
        : 'Actual article dictionary model · each entry modeled as 4 KiB',
      170,
      280,
      29,
      themeColors.yellow,
    );
    m.base.forEach((v, i) =>
      drawPage(ctx, api, v, 330 + i * 220, 375, themeColors.blue, 'base ' + i),
    );
    ['A', 'B'].forEach((name, j) => {
      const y = 620 + j * 180;
      drawText(
        ctx,
        api,
        'Clone ' + name,
        190,
        y + 70,
        32,
        j ? themeColors.pink : themeColors.green,
      );
      const values = m[name.toLowerCase()];
      values.forEach((v, i) => {
        const privateEntry = i in m.copies[name],
          x = 580 + i * 350;
        drawRectangle(
          ctx,
          api,
          x,
          y,
          280,
          110,
          privateEntry ? (j ? themeColors.pink : themeColors.green) : themeColors.blue,
        );
        drawText(ctx, api, 'index ' + i, x + 20, y + 30, 23, themeColors.muted);
        drawText(
          ctx,
          api,
          (privateEntry ? 'private ' : 'base ') + v,
          x + 20,
          y + 80,
          30,
          privateEntry ? (j ? themeColors.pink : themeColors.green) : themeColors.blue,
        );
      });
    });
    if ((currentBeat === 1 && resultComplete('count', 1)) || currentBeat === 2)
      drawText(
        ctx,
        api,
        m.totalPages + ' modeled pages × 4 KiB = ' + m.kib + ' KiB',
        1110,
        290,
        34,
        themeColors.green,
      );
    drawFooter(
      ctx,
      api,
      replace
        ? 'A index1 replaces its existing entry; B owns a different private entry.'
        : 'Shared immutable tuple counts once; each clone’s private entries count separately.',
    );
  });
}
export default {
  id: 'article-page-run',
  draw: drawArticlePageRun,
  cues: [
    'sp-article-page-run-0',
    'sp-article-page-run-base',
    'sp-article-page-run-1',
    'sp-article-page-run-write',
    'sp-article-page-run-count',
    'sp-article-page-run-2',
    'sp-article-page-run-second',
    'sp-article-page-run-replace',
  ],
};
