import { text } from '../defaults.mjs';
import { LOOP_BIGRAM } from '../model.mjs';
import { finished } from '../scene-clock.mjs';

const observations = ['a', 'a', 'a', 'b'];
const probabilities = ['a', 'b'].map(
  (letter) => observations.filter((ch) => ch === letter).length / observations.length,
);
const floor = -probabilities.reduce((sum, p) => sum + p * Math.log(p), 0);

export function drawBigramFloor(ctx, scene, state, api) {
  const { C } = api;
  api.focus.target('bigram-floor-mechanism', () => {
    if (state.beat === 2) {
      const known = finished(state, 'bigram-floor-beat-2', 2, 0.38);
      const bothRuns = finished(state, 'bigram-training-losses', 2, 0.65);
      text(ctx, api, LOOP_BIGRAM.trainPairs + ' training pairs', 960, 336, 60, C.ink, 'center');
      text(
        ctx,
        api,
        'Mean loss across the training text (nats per pair)',
        960,
        446,
        39,
        C.muted,
        'center',
      );
      const rows = [
        ['Best possible', known ? LOOP_BIGRAM.floor.toFixed(3) : '?', C.yellow],
        ['Plain Python', bothRuns ? LOOP_BIGRAM.history.at(-1).train.toFixed(3) : '·', C.cyan],
        ['PyTorch', bothRuns ? '1.019' : '·', C.pink],
      ];
      rows.forEach(([name, value, color], i) => {
        const y = 605 + 119 * i;
        text(ctx, api, name, 510, y, 48, color);
        text(ctx, api, value, 1410, y, 60, color, 'right');
      });
      return;
    }
    text(ctx, api, 'One input character. Four observed successors.', 960, 305, 48, C.ink, 'center');
    const hasShares = finished(state, 'bigram-floor-beat-1', 1, 0.2);
    const hasLoss = finished(state, 'loop-entropy-floor', 1, 0.66);
    const cue = state.cues?.['bigram-floor-beat-1'];
    const join = hasShares ? (cue ? api.ease((state.t - cue.end) / 0.8) : 1) : 0;
    const left = 360,
      width = 1200,
      slot = width / observations.length;
    observations.forEach((letter, i) => {
      const inset = 16 * (1 - join);
      const x = left + i * slot;
      const color = letter === 'a' ? C.cyan : C.pink;
      const y = 438 + join * 65;
      api.rect(ctx, x + inset, y, slot - 2 * inset, 132, color, undefined, (1 - join) * 12);
      text(ctx, api, letter, x + slot / 2, y + 91, 66, C.bg, 'center');
    });
    if (hasShares) {
      const split = left + width * probabilities[0];
      text(ctx, api, 'P(a) = 3/4', (left + split) / 2, 736, 51, C.cyan, 'center');
      text(ctx, api, 'P(b) = 1/4', (left + width + split) / 2, 736, 51, C.pink, 'center');
    }
    const line = hasLoss
      ? '−[3 ln(3/4) + ln(1/4)] / 4 ≈ ' + floor.toFixed(3) + ' nats'
      : hasShares
        ? 'Average the cost of these four observations.'
        : 'How much probability should each letter get?';
    text(ctx, api, line, 960, 930, 49, C.ink, 'center');
  });
}

export default {
  id: 'bigram-floor',
  draw: drawBigramFloor,
  cues: [
    'bigram-floor-beat-0',
    'bigram-floor-beat-1',
    'loop-entropy-floor',
    'bigram-floor-beat-2',
    'bigram-training-losses',
  ],
};
