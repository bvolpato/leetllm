import { bound } from '../arithmetic.mjs';
import { VERBS } from '../fixtures.mjs';
import { contextState } from '../model.mjs';
import { highlight, row, target, text } from '../defaults.mjs';
export function drawContext(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = bound(state.beatP ?? 0),
    cues = state.cues;
  const colors = [themeColors.blue, themeColors.green, themeColors.pink, themeColors.yellow];
  const distribution = (entries, x, y, width, height = 250) =>
    teaching.bars({
      values: entries.map((v) => v.probability),
      labels: entries.map((v) => v.token),
      x,
      y,
      width,
      height,
      max: 1,
      colors: colors.slice(0, entries.length),
      gap: 75,
      fontSize: 31,
      showValues: true,
      format: (n) => n.toFixed(3),
    });
  text(
    ctx,
    api,
    'H1 · supplied scalar embeddings and shared output weights',
    960,
    205,
    23,
    themeColors.muted,
    'center',
  );
  {
    const v = contextState(currentBeat, progress, cues);
    row(ctx, api, ['The', v.adjective, 'cat'], 310, {
      left: 330,
      width: 330,
      gap: 55,
    });
    const emphasis = cues?.['context-hungry']?.active
      ? 1
      : currentBeat === 1 && progress > 0.1 && progress < 0.3
        ? 1
        : 0;
    target(ctx, api, 'context-adjective', () =>
      highlight(ctx, api, 670, 425, 580, 75, -2, v.h, emphasis, themeColors.yellow, () =>
        text(ctx, api, 'Embedding h = ' + v.h, 960, 475, 39, themeColors.cyan, 'center'),
      ),
    );
    target(ctx, api, 'context-head', () => {
      const labels = VERBS.map((w, i) => `${w}: ${v.weights[i]} × ${v.h} = ${v.logits[i]}`);
      labels.forEach((label, i) =>
        highlight(
          ctx,
          api,
          250 + i * 520,
          540,
          380,
          65,
          [0, 2, -2][i],
          v.logits[i],
          emphasis,
          themeColors.yellow,
          () =>
            text(
              ctx,
              api,
              v.known ? label : VERBS[i] + ': weight ' + v.weights[i],
              440 + i * 520,
              585,
              30,
              colors[i],
              'center',
            ),
        ),
      );
    });
    target(ctx, api, 'context-distribution', () => {
      if (v.known)
        distribution(
          VERBS.map((token, i) => ({
            token,
            probability: v.probabilities[i],
          })),
          330,
          650,
          1260,
          220,
        );
      else text(ctx, api, 'Probabilities pending', 960, 780, 38, themeColors.muted, 'center');
    });
    text(
      ctx,
      api,
      'Supplied adjective embeddings · one shared three-output head',
      960,
      1010,
      31,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'context',
  draw: drawContext,
  cues: ['context-head', 'context-hungry'],
};
