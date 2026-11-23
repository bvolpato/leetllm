import { stablePolicy, thoughtTraversal } from '../arithmetic.mjs';
import { mctsBackupFrame, policyCueProgress } from '../construction.mjs';
import {
  drawCaption,
  drawLine,
  drawPolicyCard,
  drawPolicyEquation,
  drawPolicyText,
  drawRectangle,
} from '../defaults.mjs';
export function drawThoughtSearch(ctx, scene, state, api) {
  const { C: themeColors } = api,
    beat = state.beat ?? 0;
  const progress = policyCueProgress('thought-search', state),
    currentBeat = Math.min(beat, scene.beats.length - 1);
  const target = (paint) =>
    api.focus ? api.focus.target(`${'thought-search'}-state-${currentBeat}`, paint) : paint();
  const colors = [themeColors.blue, themeColors.pink, themeColors.cyan, themeColors.yellow];
  const policy = stablePolicy();
  {
    const { C, teaching, components } = api;
    const id = 'thought-search',
      beat = state.beat ?? 0;
    {
      if (beat < 2) {
        const coordinates = [
          {
            x: 960,
            y: 370,
          },
          {
            x: 420,
            y: 565,
          },
          {
            x: 1440,
            y: 565,
          },
          {
            x: 240,
            y: 785,
          },
          {
            x: 650,
            y: 785,
          },
          {
            x: 1250,
            y: 785,
          },
          {
            x: 1660,
            y: 785,
          },
        ];
        const labels = [
          'state',
          'create first',
          'revoke first',
          'deploy',
          'revoke early',
          'create late',
          'deploy late',
        ];
        const traversal = thoughtTraversal(
            beat === 0 ? 'breadth' : 'depth',
            Math.min(7, 1 + Math.floor(progress * 7)),
          ),
          current = traversal.current;
        drawPolicyText(
          ctx,
          api,
          beat === 0 ? 'Breadth-first frontier' : 'Depth-first stack and backtracking',
          960,
          285,
          34,
          C.ink,
          'center',
        );
        coordinates.slice(1).forEach((point, i) => {
          const parent = coordinates[Math.floor(i / 2)];
          drawLine(ctx, api, parent.x, parent.y + 45, point.x, point.y - 45, C.panel, 5);
        });
        target(() =>
          coordinates.forEach((point, i) => {
            drawPolicyCard(
              ctx,
              api,
              'thought-search',
              labels[i],
              point.x - 150,
              point.y - 40,
              300,
              80,
              i === current ? C.yellow : C.muted,
              28,
            );
          }),
        );
        drawPolicyText(
          ctx,
          api,
          `${beat === 0 ? 'Queue' : 'Stack, next first'}: ${traversal.frontier.length ? traversal.frontier.map((i) => labels[i]).join('  |  ') : 'empty'}`,
          960,
          910,
          27,
          C.yellow,
          'center',
        );
        drawCaption(
          ctx,
          api,
          'The original Tree of Thoughts explored BFS/DFS with self-evaluation; the evaluator can be wrong.',
        );
      } else {
        const frame = mctsBackupFrame(state),
          parent = frame.parent;
        drawPolicyText(
          ctx,
          api,
          frame.phase === 'selection'
            ? 'Select B from the supplied prior statistics'
            : frame.phase === 'backed-up'
              ? 'The same rollout is backed up to child and parent'
              : 'Backup in progress · follow one supplied reward',
          960,
          285,
          32,
          C.ink,
          'center',
        );
        drawPolicyText(ctx, api, 'Supplied rollout reward +0.20', 960, 340, 29, C.yellow, 'center');
        target(() => {
          drawRectangle(
            ctx,
            api,
            650,
            380,
            620,
            160,
            C.panel,
            frame.parentUpdated ? C.green : C.muted,
            12,
          );
          drawPolicyText(
            ctx,
            api,
            `Parent · visits ${parent.visits} · mean ${parent.mean.toFixed(3)}`,
            960,
            435,
            31,
            frame.parentUpdated ? C.green : C.ink,
            'center',
          );
          drawPolicyText(
            ctx,
            api,
            `total reward ${parent.rewardSum.toFixed(2)}`,
            960,
            495,
            29,
            C.muted,
            'center',
          );
          frame.nodes.forEach((node, i) => {
            const x = 475 + i * 950,
              color = colors[i],
              updated = node.id === 'B' && frame.childUpdated;
            api.arrow(ctx, i ? 1160 : 760, 556, x, 600, color, 3);
            drawRectangle(ctx, api, x - 265, 620, 530, 170, C.panel, updated ? C.green : color, 12);
            drawPolicyText(
              ctx,
              api,
              `${node.id} · visits ${node.visits}`,
              x,
              675,
              35,
              updated ? C.green : color,
              'center',
            );
            drawPolicyText(
              ctx,
              api,
              updated ? 'mean 7/15 ≈ 0.467' : `mean ${node.mean.toFixed(3)}`,
              x,
              725,
              31,
              updated ? C.green : color,
              'center',
            );
            drawPolicyText(
              ctx,
              api,
              `total reward ${node.rewardSum.toFixed(2)}`,
              x,
              770,
              27,
              C.muted,
              'center',
            );
            if (node.selectionScore !== null)
              drawPolicyEquation(
                ctx,
                api,
                `${node.mean.toFixed(3)}+\\sqrt{\\frac{\\log ${parent.visits}}{${node.visits}}}\\approx${node.selectionScore.toFixed(3)}`,
                x,
                870,
                33,
                color,
                'center',
              );
            else
              drawPolicyText(
                ctx,
                api,
                'Selection waits for the parent update',
                x,
                870,
                27,
                C.muted,
                'center',
              );
          });
          if (frame.phase === 'reward-to-child') {
            const amount = Math.min(1, frame.progress / 0.4),
              points = [
                {
                  x: 1760,
                  y: 900,
                },
                {
                  x: 1760,
                  y: 700,
                },
                {
                  x: 1710,
                  y: 700,
                },
              ];
            components.particle({
              points,
              progress: amount,
              radius: 10,
              fill: C.yellow,
            });
          } else if (frame.phase === 'reward-to-parent') {
            const amount = (frame.progress - 0.4) / 0.45;
            components.particle({
              points: [
                {
                  x: 1425,
                  y: 600,
                },
                {
                  x: 1160,
                  y: 556,
                },
              ],
              progress: amount,
              radius: 10,
              fill: C.yellow,
            });
          }
        });
        drawPolicyText(
          ctx,
          api,
          frame.parentUpdated
            ? 'B: 2 → 3 visits · parent: 10 → 11 · both reward totals add the same 0.20'
            : frame.childUpdated
              ? 'B received +0.20; the ancestor update is still pending.'
              : 'Prior totals: A = 3.20 / 8 · B = 1.20 / 2 · parent = 4.40 / 10',
          960,
          935,
          27,
          C.yellow,
          'center',
        );
        drawCaption(
          ctx,
          api,
          'Supplied search bookkeeping · means are computed rewards, with no evaluator-quality claim.',
        );
      }
    }
    return;
  }
  return;
}
export default {
  id: 'thought-search',
  draw: drawThoughtSearch,
  cues: ['thought-search-build-0', 'thought-search-build-1', 'thought-search-build-2'],
};
