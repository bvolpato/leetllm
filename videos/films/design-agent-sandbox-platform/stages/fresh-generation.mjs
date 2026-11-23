import { clamp, motion, sandboxPages } from '../arithmetic.mjs';
import { drawFooter, drawPage, drawRectangle, drawText } from '../defaults.mjs';
export function drawFreshGeneration(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-fresh-generation-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-fresh-generation-' + name);
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
  api.focus.target('sp-fresh-generation-mechanism', () => {
    const written = currentBeat > 0 || resultComplete('writes', 0),
      cancelled = currentBeat > 0 || resultComplete('cancel', 0),
      notices = currentBeat > 0 || resultComplete('notices', 0),
      closed = currentBeat === 2 && resultComplete('close', 2),
      disposed = currentBeat === 2 && resultComplete('dispose', 2),
      count = currentBeat > 1 || (currentBeat === 1 && resultComplete('count', 1)),
      m = sandboxPages(
        [4, 8, 12],
        written && !disposed
          ? [
              {
                clone: 'A',
                index: 0,
                value: 99,
              },
              {
                clone: 'A',
                index: 2,
                value: 41,
              },
            ]
          : [],
      );
    drawText(
      ctx,
      api,
      'New supplied case · each modeled entry 4 KiB',
      180,
      280,
      30,
      themeColors.yellow,
    );
    m.base.forEach((v, i) =>
      drawPage(ctx, api, v, 280 + i * 210, 350, themeColors.blue, 'base ' + i),
    );
    ['A', 'B'].forEach((name, j) => {
      const y = 565 + j * 170;
      drawText(
        ctx,
        api,
        name + (name === 'A' ? ' / g4' : ' unchanged'),
        180,
        y + 70,
        30,
        j ? themeColors.pink : themeColors.green,
      );
      m[name.toLowerCase()].forEach((v, i) => {
        const own = i in m.copies[name];
        drawPage(
          ctx,
          api,
          v,
          600 + i * 240,
          y,
          own ? themeColors.green : themeColors.blue,
          own ? 'private' : 'base ref',
        );
      });
    });
    drawRectangle(ctx, api, 1430, 350, 320, 300, disposed ? themeColors.green : themeColors.yellow);
    drawText(
      ctx,
      api,
      disposed
        ? 'DISPOSED'
        : currentBeat > 1 || (currentBeat === 1 && resultComplete('held', 1))
          ? 'RETIRED'
          : cancelled
            ? 'CANCELLED'
            : 'RUNNING',
      1460,
      415,
      29,
      disposed ? themeColors.green : themeColors.yellow,
    );
    if (notices) {
      drawText(
        ctx,
        api,
        'notice g5',
        1460,
        495,
        28,
        currentBeat > 1 || (currentBeat === 1 && resultComplete('wrong', 1))
          ? themeColors.pink
          : themeColors.muted,
      );
      drawText(
        ctx,
        api,
        'notice g4',
        1460,
        560,
        28,
        currentBeat > 1 || (currentBeat === 1 && resultComplete('held', 1))
          ? themeColors.green
          : themeColors.muted,
      );
    }
    drawText(
      ctx,
      api,
      'remaining refs: ' + (closed ? 0 : 1),
      1445,
      710,
      26,
      closed ? themeColors.green : themeColors.yellow,
    );
    if (count && !disposed)
      drawText(
        ctx,
        api,
        m.totalPages + ' pages × 4 KiB = ' + m.kib + ' KiB',
        180,
        935,
        34,
        themeColors.green,
      );
    else if (disposed && resultComplete('base', 2))
      drawText(
        ctx,
        api,
        m.totalPages + ' base pages × 4 KiB = ' + m.kib + ' KiB; new scratch empty',
        180,
        935,
        33,
        themeColors.green,
      );
    else
      drawText(
        ctx,
        api,
        disposed
          ? 'Private entries removed; final count pending'
          : 'Predict page count and whether capacity can return',
        180,
        935,
        31,
        themeColors.yellow,
      );
    if (currentBeat === 1)
      drawText(
        ctx,
        api,
        resultComplete('held', 1) ? 'Capacity HELD' : 'Verify generation and references',
        1080,
        935,
        31,
        themeColors.yellow,
      );
    if (currentBeat === 2)
      drawText(
        ctx,
        api,
        disposed
          ? 'A writable resources disposed'
          : closed
            ? 'Last reference closed'
            : 'Await last reference closure',
        1110,
        935,
        27,
        disposed ? themeColors.green : themeColors.yellow,
      );
    drawFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Question held before the result. B’s base entries remain unchanged.'
        : currentBeat === 1
          ? resultComplete('held', 1)
            ? 'Matching execution retirement cannot close a remaining integration reference.'
            : 'Inspect current owner, execution notice and remaining references.'
          : 'Resource ownership and final-reference checks govern each disposal.',
    );
  });
}
export default {
  id: 'fresh-generation',
  draw: drawFreshGeneration,
  cues: [
    'sp-fresh-generation-0',
    'sp-fresh-generation-writes',
    'sp-fresh-generation-cancel',
    'sp-fresh-generation-notices',
    'sp-fresh-generation-1',
    'sp-fresh-generation-wrong',
    'sp-fresh-generation-held',
    'sp-fresh-generation-count',
    'sp-fresh-generation-2',
    'sp-fresh-generation-close',
    'sp-fresh-generation-dispose',
    'sp-fresh-generation-base',
  ],
};
