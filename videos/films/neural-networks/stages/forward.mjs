import { clamp } from '../arithmetic.mjs';
import { PARAMETERS } from '../fixtures.mjs';
import { requestForward } from '../model.mjs';
import { neuralFrame } from '../construction.mjs';
import { equation, focusTarget, formatNumber, head, network, note, text } from '../defaults.mjs';
export function drawForward(ctx, scene, state, api) {
  const { C: themeColors } = api,
    f = neuralFrame(state),
    currentBeat = f.beat,
    cueProgress = f.progress,
    S = f.shown,
    resultComplete = f.completed;
  focusTarget(ctx, api, 'forward-mechanism', () => {
    head(ctx, api, 'One request [2, 5] · the same nine owners will receive gradients');
    const first = S('first-dot-result', 0),
      second = S('second-dot-result', 1),
      output = S('output-dot', 2),
      d = requestForward([2, 5]);
    const n = network(ctx, api, 'forward', PARAMETERS, {
      x: [2, 5],
      hidden: [first ? d.h[0] : undefined, second ? d.h[1] : undefined],
      output: output ? d.z2 : undefined,
    });
    focusTarget(ctx, api, 'hidden-values', () => {
      if (currentBeat < 2) {
        const row = currentBeat,
          p = cueProgress(row ? 'second-dot' : 'first-dot', row);
        [0, 1].forEach((j) => {
          const phase = Math.min(1, Math.max(0, p * 2 - j));
          n.signal(
            'node-' + j,
            'edge-' + (row * 2 + j),
            phase < 0.5 ? phase * 2 : 1,
            j ? themeColors.blue : themeColors.cyan,
          );
          n.signal(
            'edge-' + (row * 2 + j),
            'node-' + (row + 2),
            phase > 0.5 ? (phase - 0.5) * 2 : 0,
            j ? themeColors.blue : themeColors.cyan,
          );
        });
        text(
          ctx,
          api,
          [2, 5]
            .map(
              (x, j) =>
                formatNumber(ctx, api, x) +
                ' × ' +
                formatNumber(ctx, api, PARAMETERS.w1[row][j]) +
                ' = ' +
                formatNumber(ctx, api, x * PARAMETERS.w1[row][j]),
            )
            .join('     +     '),
          960,
          995,
          32,
          themeColors.yellow,
          'center',
        );
      }
    });
    focusTarget(ctx, api, 'output-score', () => {
      if (output) {
        const p = cueProgress('output-dot', 2);
        [0, 1].forEach((i) => {
          const stage = clamp(p * 3 - i);
          n.signal(
            'node-' + (i + 2),
            'edge-' + (i + 4),
            stage < 0.5 ? stage * 2 : 1,
            themeColors.blue,
          );
          n.signal(
            'edge-' + (i + 4),
            'node-4',
            stage > 0.5 ? (stage - 0.5) * 2 : 0,
            themeColors.blue,
          );
        });
        n.signal('bias-2', 'node-4', clamp(p * 3 - 2), themeColors.pink);
        equation(
          ctx,
          api,
          String.raw`0.4(0.1)+0.1(3.2)-0.5=-0.14\ \longrightarrow\sigma=0.465`,
          960,
          1000,
          36,
          themeColors.green,
        );
      }
    });
    note(ctx, api, 'Rows identify hidden units; both features participate in each dot product.');
    return;
  });
}
export default {
  id: 'forward',
  draw: drawForward,
  cues: ['first-dot', 'first-dot-result', 'second-dot', 'second-dot-result', 'output-dot'],
};
