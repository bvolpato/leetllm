import { CONTEXT_WORDS } from '../fixtures.mjs';
import { contextCountTrace } from '../construction.mjs';
import { focusTarget, text } from '../defaults.mjs';
export function drawNeighbors(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    const current = contextCountTrace(currentBeat, progress),
      event = current.event,
      n = current.words.length,
      w = 175,
      start = 960 - ((n - 1) * w) / 2;
    text(
      ctx,
      api,
      'Sentence ' + (event.sentenceIndex + 1) + ' of 4 · count clues within four positions of bank',
      960,
      270,
      31,
      themeColors.muted,
      'center',
    );
    current.words.forEach((word, i) => {
      const color =
        i === event.center
          ? themeColors.yellow
          : i === event.token
            ? themeColors.cyan
            : themeColors.muted;
      components.card({
        label: word,
        x: start + i * w - 80,
        y: 340,
        width: 160,
        height: 84,
        fill: themeColors.panel,
        stroke: color,
        textColor: color,
        fontSize: 29,
        padding: 8,
        radius: 10,
      });
    });
    const at = {
        x: start + event.token * w,
        y: 424,
      },
      end = {
        x: 358.75 + event.column * 407.5,
        y: 875 - ((current.counts[event.column] + 1) * 265) / 3,
      };
    if (current.flight > 0) {
      const x = at.x + (end.x - at.x) * current.flight,
        y = at.y + (end.y - at.y) * current.flight;
      components.card({
        label: event.word,
        x: x - 70,
        y: y - 35,
        width: 140,
        height: 70,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.cyan,
        fontSize: 27,
        padding: 6,
        radius: 8,
      });
    }
    focusTarget(ctx, api, 'neighbors-object-distribution-neighbors-4', () =>
      teaching.bars({
        values: current.counts,
        labels: CONTEXT_WORDS,
        x: 230,
        y: 610,
        width: 1480,
        height: 265,
        max: 3,
        colors: [themeColors.cyan, themeColors.blue, themeColors.green, themeColors.yellow],
        fontSize: 31,
        showValues: true,
        progress: 1,
        gap: 150,
      }),
    );
    text(
      ctx,
      api,
      current.completed + ' of 6 observed word–bank pairs',
      960,
      1030,
      32,
      themeColors.ink,
      'center',
    );
  }
}
export default {
  id: 'neighbors',
  draw: drawNeighbors,
  cues: ['neighbors-built-count-0', 'neighbors-built-count-1', 'neighbors-built-count-2'],
};
