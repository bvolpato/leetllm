import { event } from '../construction.mjs';
import { arrow, card, centeredText, footer, line } from '../defaults.mjs';
export function drawPredictiveWindow(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => event(state, name, beat);
  api.focus.target('predictive-window-mechanism', () => {
    const words = ['children', 'read', 'stories', 'each', 'night'],
      positions = words.map((word, i) => ({
        word,
        x: 240 + i * 350,
      })),
      skip = ev('skipgram', 0),
      pairs = ev('window-pairs', 1),
      night = ev('window-night', 1) > 0;
    centeredText(
      ctx,
      api,
      skip === 0 ? 'CBOW · neighbors predict the center' : 'Skip-gram · center predicts neighbors',
      960,
      290,
      36,
      themeColors.yellow,
    );
    positions.forEach((o, i) => {
      card(
        ctx,
        api,
        o.word,
        o.x - 125,
        430,
        250,
        i === 1 ? themeColors.yellow : i === 4 ? themeColors.muted : themeColors.cyan,
      );
      centeredText(ctx, api, 'position ' + i, o.x, 560, 26, themeColors.muted);
    });
    for (const i of [0, 2, 3]) {
      const from = skip > 0 ? positions[1] : positions[i],
        to = skip > 0 ? positions[i] : positions[1];
      const y = i === 0 ? 365 : 325;
      line(ctx, api, from.x, 430, from.x, y, themeColors.muted);
      arrow(ctx, api, from.x, y, to.x, y, themeColors.cyan);
      line(ctx, api, to.x, y, to.x, 430, themeColors.muted);
    }
    if (currentBeat > 0) {
      [0, 2, 3].forEach((i, j) => {
        if (pairs > j / 3)
          card(ctx, api, 'read → ' + words[i], 260 + j * 550, 700, 450, themeColors.cyan);
      });
      centeredText(
        ctx,
        api,
        night ? 'night: distance 3 > chosen window 2' : 'Window radius 2 around position 1',
        960,
        900,
        34,
        night ? themeColors.pink : themeColors.muted,
      );
    }
    if (currentBeat === 2)
      centeredText(
        ctx,
        api,
        'input row read · output row neighbor · cosine between input rows is a separate metric',
        960,
        630,
        28,
        themeColors.ink,
      );
    footer(
      ctx,
      api,
      'The declared toy tokens use whitespace positions; center stays first in every positive pair',
    );
  });
}
export default {
  id: 'predictive-window',
  draw: drawPredictiveWindow,
  cues: ['emb-cbow', 'emb-skipgram', 'emb-window-pairs', 'emb-window-night', 'emb-word-tables'],
};
