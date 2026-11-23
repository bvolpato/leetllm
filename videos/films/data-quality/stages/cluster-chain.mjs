import {
  drawConstructionEquation,
  drawConstructionLine,
  drawConstructionNote,
  drawConstructionP,
  drawConstructionText,
} from '../defaults.mjs';
export function drawClusterChain(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => drawConstructionP(ctx, api, id) === 1,
    v = drawConstructionP(ctx, api, `${'cluster-chain'}-voice-${currentBeat + 1}`);
  api.focus.target('cluster-chain-construction', () => {
    if (currentBeat < 2) {
      drawConstructionText(
        ctx,
        api,
        'Same shingler · review threshold J ≥ 0.60',
        160,
        300,
        34,
        themeColors.cyan,
      );
      const words = [
        ['A', 'build has failed', ['build has', 'has failed']],
        ['B', 'build has failed again', ['build has', 'has failed', 'failed again']],
        ['C', 'has failed again', ['has failed', 'failed again']],
      ];
      words.forEach(([id, text, parts], i) => {
        const x = 185 + i * 560;
        drawConstructionText(
          ctx,
          api,
          id,
          x + 230,
          405,
          42,
          [themeColors.cyan, themeColors.blue, themeColors.yellow][i],
          'center',
        );
        drawConstructionText(ctx, api, text, x + 230, 470, 29, themeColors.ink, 'center');
        parts.forEach((part, j) =>
          drawConstructionText(
            ctx,
            api,
            part,
            x + 230,
            570 + j * 70,
            28,
            themeColors.muted,
            'center',
            true,
          ),
        );
      });
      if (done('cluster-links') || currentBeat > 0) {
        drawConstructionLine(ctx, api, 430, 790, 990, 790, themeColors.green, 5);
        drawConstructionLine(ctx, api, 990, 790, 1550, 790, themeColors.green, 5);
        drawConstructionText(ctx, api, '2/3', 700, 840, 32, themeColors.green, 'center');
        drawConstructionText(ctx, api, '2/3', 1270, 840, 32, themeColors.green, 'center');
        drawConstructionText(
          ctx,
          api,
          'A ↔ C: 1/3 · no pair match',
          960,
          920,
          35,
          themeColors.pink,
          'center',
        );
      }
      if (currentBeat === 1 && drawConstructionP(ctx, api, 'cluster-component') > 0) {
        api.rect(ctx, 150, 360, 1620, 500, 'transparent', themeColors.yellow, 3);
        if (done('cluster-component')) {
          drawConstructionText(
            ctx,
            api,
            'C excluded by cluster retention',
            1535,
            348,
            25,
            themeColors.pink,
            'center',
          );
          drawConstructionText(
            ctx,
            api,
            'Keeping A can remove nonmatching C',
            960,
            990,
            30,
            themeColors.yellow,
            'center',
          );
        }
      }
    } else {
      const n = Math.max(2, Math.round(2 + 9998 * v)),
        pairs = (n * (n - 1)) / 2;
      drawConstructionText(
        ctx,
        api,
        'All-pairs candidate work grows before any set comparison',
        160,
        300,
        33,
        themeColors.cyan,
      );
      drawConstructionText(
        ctx,
        api,
        'N = ' + n.toLocaleString('en'),
        960,
        480,
        60,
        themeColors.blue,
        'center',
      );
      drawConstructionEquation(ctx, api, '\\binom N2=\\frac{N(N-1)}2', 960, 650, 65);
      drawConstructionText(
        ctx,
        api,
        pairs.toLocaleString('en') + ' pairs',
        960,
        795,
        58,
        themeColors.yellow,
        'center',
      );
      drawConstructionText(
        ctx,
        api,
        'Retention policy changes the training distribution.',
        960,
        925,
        33,
        themeColors.ink,
        'center',
      );
      drawConstructionNote(
        ctx,
        api,
        'FineWeb: scoped per-crawl result · Dolma: Bloom false-positive tradeoff · evaluate the corpus policy.',
      );
    }
  });
}
export default {
  id: 'cluster-chain',
  draw: drawClusterChain,
  cues: [
    'cluster-chain-b1',
    'cluster-chain-voice-1',
    'cluster-links',
    'cluster-chain-b2',
    'cluster-chain-voice-2',
    'cluster-component',
    'cluster-chain-b3',
    'cluster-chain-voice-3',
  ],
};
