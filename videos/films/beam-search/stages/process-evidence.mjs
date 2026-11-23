import { stablePolicy } from '../arithmetic.mjs';
import { policyCueProgress } from '../construction.mjs';
import { drawCaption, drawPolicyCard, drawPolicyText } from '../defaults.mjs';
export function drawProcessEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('process-evidence', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'process-evidence'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'process-evidence',
      beat = state.beat ?? 0;
    {
      const names = [
          ['create', 'deploy', 'revoke'],
          ['revoke', 'create', 'deploy'],
        ],
        values = [
          [0.95, 0.92, 0.98],
          [beat >= 2 ? 0.05 + 0.94 * progress : 0.05, 0.9, 0.92],
        ];
      drawPolicyText(
        ctx,
        api,
        'Same plans · supplied outcome and process scores',
        960,
        300,
        33,
        C.muted,
        'center',
      );
      names.forEach((steps, row) => {
        const y = 415 + row * 235,
          minimum = Math.min(...values[row]);
        drawPolicyText(ctx, api, `Plan ${row ? 'B' : 'A'}`, 160, y + 40, 32, colors[row]);
        steps.forEach((s, col) => {
          const x = 420 + col * 350;
          drawPolicyCard(
            ctx,
            api,
            'process-evidence',
            s,
            x,
            y - 5,
            275,
            70,
            row === 1 && col === 0 ? C.pink : colors[row],
            31,
          );
          target(() =>
            drawPolicyText(
              ctx,
              api,
              values[row][col].toFixed(2),
              x + 137,
              y + 133,
              38,
              row === 1 && col === 0 ? C.pink : colors[row],
              'center',
            ),
          );
        });
        drawPolicyText(
          ctx,
          api,
          `min ${minimum.toFixed(2)}`,
          1670,
          y + 47,
          35,
          minimum > 0.9 ? C.green : C.pink,
          'center',
        );
        drawPolicyText(
          ctx,
          api,
          `ORM ${row ? '.72' : '.96'}`,
          1670,
          y + 123,
          29,
          C.muted,
          'center',
        );
      });
      drawCaption(
        ctx,
        api,
        beat >= 2
          ? progress === 1
            ? 'B’s wrong first-step score is now .99; A still wins .92 versus .90.'
            : 'Raise B’s wrong first-step score toward .99. Compare the minimum as it changes.'
          : 'A final outcome score and a minimum over process scores answer different selection questions.',
      );
    }
    return;
  }
  return;
}
export default {
  id: 'process-evidence',
  draw: drawProcessEvidence,
  cues: ['process-evidence-build-0', 'process-evidence-build-1', 'process-evidence-build-2'],
};
