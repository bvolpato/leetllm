import { bound } from '../arithmetic.mjs';
import { conditionalDistribution, transferState } from '../model.mjs';
import { card, heading, row, target, text } from '../defaults.mjs';
export function drawTransfer(ctx, scene, state, api) {
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
  text(ctx, api, 'S1 · supplied conditional rows', 960, 205, 23, themeColors.muted, 'center');
  {
    const v = transferState(currentBeat, progress, cues);
    if (currentBeat < 2) {
      heading(ctx, api, 'Recorded sentence: The dog slept');
      const inputs = ['start', 'The', 'dog', 'slept'],
        targets = ['The', 'dog', 'slept', 'end'];
      inputs.forEach((word, i) =>
        card(
          ctx,
          api,
          word,
          310 + 340 * i,
          395,
          280,
          100,
          i === 2 ? themeColors.yellow : themeColors.cyan,
        ),
      );
      target(ctx, api, 'transfer-target-row', () =>
        targets.forEach((word, i) =>
          card(ctx, api, v.revealed ? word : '?', 310 + 340 * i, 670, 280, 100, themeColors.green),
        ),
      );
      target(ctx, api, 'transfer-prefix', () => {
        const right = 1270;
        if (v.prefixKnown) {
          api.line(ctx, 310, 340, right, 340, themeColors.cyan, 5);
          api.line(ctx, 310, 340, 310, 360, themeColors.cyan, 4);
          api.line(ctx, right, 340, right, 360, themeColors.cyan, 4);
        }
        text(
          ctx,
          api,
          v.prefixKnown ? 'Read start + The + dog' : 'Which words may this position read?',
          960,
          310,
          33,
          themeColors.cyan,
          'center',
        );
      });
      api.arrow(ctx, 1130, 535, 1130, 635, themeColors.yellow, 5);
      target(ctx, api, 'transfer-loss', () =>
        text(
          ctx,
          api,
          v.lossKnown
            ? 'Observed slept · p = 0.30 · −log(p) ≈ ' + v.loss.toFixed(3) + ' nats'
            : 'Observed-target loss: pending',
          960,
          950,
          36,
          themeColors.yellow,
          'center',
        ),
      );
    } else {
      heading(ctx, api, 'Same prefix, a generated choice');
      text(ctx, api, 'Recorded observation', 460, 350, 35, themeColors.green, 'center');
      card(ctx, api, 'The dog slept', 170, 425, 580, 110, themeColors.green, 45);
      target(ctx, api, 'transfer-generated', () => {
        text(ctx, api, 'Greedy output', 1390, 350, 35, themeColors.pink, 'center');
        row(ctx, api, ['The', 'dog'], 425, {
          left: 1070,
          width: 190,
          gap: 20,
          color: themeColors.pink,
          fontSize: 42,
        });
        if (v.generated > 0)
          card(ctx, api, 'ate', 1490, 625 - 200 * v.generated, 190, 100, themeColors.pink, 43);
        if (v.stopped)
          text(ctx, api, 'end selected · stopped', 1390, 625, 34, themeColors.yellow, 'center');
        else if (v.generated >= 1)
          text(ctx, api, 'Predict after The dog ate', 1390, 625, 30, themeColors.muted, 'center');
        if (v.generated >= 1)
          distribution(conditionalDistribution('The dog ate'), 1110, 710, 560, 170);
      });
      distribution(conditionalDistribution('The dog'), 250, 710, 650, 170);
      text(ctx, api, 'P(next | The dog)', 575, 1015, 31, themeColors.ink, 'center');
      if (v.generated >= 1)
        text(ctx, api, 'Record: slept · output: ate', 1390, 1015, 31, themeColors.green, 'center');
    }
  }
}
export default {
  id: 'transfer',
  draw: drawTransfer,
  cues: [
    'transfer-targets',
    'transfer-context',
    'transfer-loss',
    'transfer-generate',
    'transfer-end',
  ],
};
