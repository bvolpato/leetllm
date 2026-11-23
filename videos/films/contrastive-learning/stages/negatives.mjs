import { evaluate } from '../arithmetic.mjs';
import { negativePoolSnapshot } from '../model.mjs';
import { originalText } from '../defaults.mjs';
export function drawNegatives(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  evaluate();
  const colors = [themeColors.green, themeColors.pink, themeColors.blue];
  {
    const d = negativePoolSnapshot(currentBeat, progress),
      hard = d.hard;
    originalText(
      ctx,
      api,
      hard ? 'Add the sleeping-dog competitor' : 'Start with an easy competitor',
      960,
      300,
      38,
      themeColors.ink,
      'center',
    );
    if (currentBeat === 0 && d.arrival === 0)
      originalText(
        ctx,
        api,
        'Predict: how will the positive share change?',
        960,
        365,
        29,
        themeColors.yellow,
        'center',
      );
    if (d.arrival > 0 && d.arrival < 1)
      components.card({
        label: 'incoming: a dog sleeps',
        x: 650 + 350 * (1 - d.arrival),
        y: 350,
        width: 620,
        height: 45,
        fontSize: 26,
        padding: 8,
        fill: themeColors.panel,
        stroke: themeColors.pink,
        textColor: themeColors.pink,
      });
    api.focus.target('candidate-pool-probabilities', () =>
      teaching.bars({
        values: d.probs,
        labels: hard
          ? ['positive', 'hard negative', 'easy negative']
          : ['positive', 'easy negative'],
        x: 420,
        y: 460,
        width: 1080,
        height: 330,
        max: 1,
        colors: hard ? colors : [themeColors.green, themeColors.blue],
        showValues: true,
        format: (v) => v.toFixed(3),
        fontSize: 30,
        gap: 150,
      }),
    );
    api.focus.target('candidate-pool-loss', () =>
      originalText(
        ctx,
        api,
        `loss: ${d.loss.toFixed(3)}`,
        960,
        950,
        40,
        themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'negatives',
  draw: drawNegatives,
  cues: [
    'negatives-candidate-pool-probabilities-b1-1',
    'negatives-candidate-pool-probabilities-b2-1',
    'negatives-candidate-pool-probabilities-b3-1',
  ],
};
