import { TRACKS } from '../model.mjs';
import {
  drawOriginalCard,
  drawOriginalEquation,
  drawOriginalText,
  drawVisualFocus,
} from '../defaults.mjs';
export function drawQuery(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0;
  const progress = api.clamp(state.beatP ?? 0);
  const revealProgress = (from = 0.08, to = 0.84) => api.phase(progress, from, to);
  const snapshot = TRACKS['query'].sample({
    beat,
    beatP: progress,
  }).snapshot;
  drawOriginalText(ctx, api, 'Same query · make + soup', 150, 225, 25, themeColors.cyan);
  {
    drawOriginalText(
      ctx,
      api,
      `Query lookup · ${snapshot.term}`,
      960,
      288,
      36,
      themeColors.ink,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      snapshot.work
        ? `Ordered ID lists · ${snapshot.work.scanned} entries (${snapshot.work.entries.join(' + ')})`
        : 'Ordered document-ID lists',
      960,
      354,
      29,
      themeColors.muted,
      'center',
    );
    const firstOpacity = 1;
    const addition = beat > 1 ? 1 : revealProgress(0.005, 1.6 / 13.68);
    const unionReady = beat > 1 || (beat === 1 && progress * 13.68 >= 3.3);
    const intersectionReady = beat > 1 || (beat === 1 && progress * 13.68 >= 6.5);
    const first = drawVisualFocus(ctx, api, 'query-object-make-15', () =>
      drawOriginalCard(
        ctx,
        api,
        'query',
        `make → ${snapshot.list.join(', ')}`,
        245,
        420,
        430,
        90,
        themeColors.cyan,
        firstOpacity,
        30,
      ),
    );
    const resultOpacity = beat > 0 ? 1 : revealProgress(0.15, 0.8);
    const result = drawVisualFocus(
      ctx,
      api,
      'query-object-beat-0-candidate-snapshot-combined-join-or-union-u-16',
      () =>
        drawOriginalCard(
          ctx,
          api,
          'query',
          beat === 0
            ? `Candidate · ${snapshot.combined.join(', ')}`
            : `OR union → ${(unionReady ? snapshot.combined : snapshot.list).join(', ')}`,
          645,
          730,
          630,
          82,
          themeColors.green,
          resultOpacity,
          30,
        ),
    );
    if (beat === 0) {
      teaching.transfer({
        source: {
          shape: first,
          opacity: firstOpacity,
        },
        target: {
          shape: result,
          opacity: resultOpacity,
        },
        color: themeColors.cyan,
        gap: 12,
      });
      drawOriginalText(
        ctx,
        api,
        'd2 · useful cooking paraphrase · absent from this list',
        960,
        900,
        28,
        themeColors.pink,
        'center',
      );
    } else {
      const second = drawOriginalCard(
        ctx,
        api,
        'query',
        `soup → ${snapshot.other.join(', ')}`,
        780,
        420,
        430,
        90,
        themeColors.cyan,
        addition,
        30,
      );
      const operation = drawOriginalCard(
        ctx,
        api,
        'query',
        'Merge or intersect the ordered lists',
        645,
        590,
        630,
        82,
        themeColors.blue,
        addition,
        28,
      );
      for (const [shape, opacity] of [
        [first, 1],
        [second, addition],
      ])
        teaching.transfer({
          source: {
            shape,
            opacity,
          },
          target: {
            shape: operation,
            opacity: addition,
          },
          color: themeColors.cyan,
          gap: 12,
        });
      teaching.transfer({
        source: {
          shape: operation,
          opacity: addition,
        },
        target: {
          shape: result,
          opacity: 1,
        },
        color: themeColors.green,
        gap: 12,
      });
      if (intersectionReady)
        drawOriginalText(
          ctx,
          api,
          `AND intersection → ${snapshot.intersection.join(', ')}`,
          960,
          855,
          30,
          themeColors.yellow,
          'center',
        );
      drawVisualFocus(
        ctx,
        api,
        'query-object-d2-useful-cooking-paraphrase-absent-from-both-rout-21',
        () =>
          drawOriginalText(
            ctx,
            api,
            'd2 · useful cooking paraphrase · absent from both routes',
            960,
            905,
            28,
            themeColors.pink,
            'center',
          ),
      );
    }
    drawOriginalEquation(
      ctx,
      api,
      String.raw`W_{\mathrm{OR}}=\bigcup_{t\in Q}\mathrm{postings}(t)`,
      960,
      960,
      40,
      themeColors.yellow,
    );
  }
}
export default {
  id: 'query',
  draw: drawQuery,
  cues: ['query-make', 'query-beat-2-focus-1', 'query-beat-3-focus-1'],
};
