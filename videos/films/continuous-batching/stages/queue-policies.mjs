import { serialCompletion } from '../model.mjs';
import {
  cueProgress,
  drawBatchingUpgradeFoot,
  drawBatchingUpgradeTable,
  drawBatchingUpgradeText,
} from '../defaults.mjs';
export function drawQueuePolicies(ctx, scene, state, api) {
  api.focus.target(scene.id + '-mechanism', () => {
    const currentBeat = state.beat ?? 0,
      progress2 = state.beatP ?? 0;
    const { C: themeColors } = api;
    {
      if (currentBeat === 0) {
        const jobs = [
          {
            id: 'long',
            steps: 50,
          },
          {
            id: 'quick',
            steps: 5,
          },
          {
            id: 'medium',
            steps: 20,
          },
        ];
        [false, true].forEach((short, row) => {
          const s = serialCompletion(jobs, short),
            y = 390 + row * 275;
          drawBatchingUpgradeText(
            ctx,
            api,
            short ? 'Oracle shortest first' : 'Arrival order',
            150,
            y - 50,
            30,
            short ? themeColors.green : themeColors.blue,
          );
          const elapsed = 75 * (short
            ? cueProgress(state, 'queue-sjf', 0.42, 0.64)
            : cueProgress(state, 'queue-fcfs', 0.12, 0.25));
          s.rows.forEach((r) => {
            const x = 390 + r.start * 16,
              width = Math.max(0, Math.min(r.steps, elapsed - r.start)) * 16;
            if (width > 0)
              api.rect(
                ctx,
                x,
                y,
                width,
                100,
                [themeColors.blue, themeColors.cyan, themeColors.yellow][
                  jobs.findIndex((j) => j.id === r.id)
                ],
                undefined,
                0,
              );
            if (elapsed >= r.finish) {
              drawBatchingUpgradeText(
                ctx,
                api,
                r.id,
                x + r.steps * 8,
                y + 65,
                r.steps < 10 ? 22 : 30,
                themeColors.bg,
                'center',
              );
            }
            if (elapsed >= r.finish)
              drawBatchingUpgradeText(
                ctx,
                api,
                String(r.finish),
                390 + r.finish * 16,
                y + 150,
                27,
                themeColors.muted,
                'center',
              );
          });
          if (elapsed >= 75)
            drawBatchingUpgradeText(
              ctx,
              api,
              'Mean completion ' + s.mean,
              960,
              y + 210,
              30,
              short ? themeColors.green : themeColors.yellow,
              'center',
            );
        });
        drawBatchingUpgradeText(
          ctx,
          api,
          'Completion time (abstract steps)',
          960,
          950,
          28,
          themeColors.muted,
          'center',
        );
      } else if (currentBeat === 1) {
        drawBatchingUpgradeTable(
          ctx,
          api,
          [
            ['Queue choice', 'Completion evidence', 'Unresolved cost'],
            ['Estimated shortest', 'mean may improve', 'long job wait can grow'],
            ['FCFS head', 'stable arrival order', 'fitting work may wait'],
            ['Open-ended request', 'cap sets an upper bound', 'final length usually unknown'],
          ],
          140,
          325,
          1640,
          120,
        );
        drawBatchingUpgradeText(
          ctx,
          api,
          'Track maximum and p99 wait by request class',
          960,
          920,
          37,
          themeColors.yellow,
          'center',
        );
      } else {
        drawBatchingUpgradeTable(
          ctx,
          api,
          [
            ['Convention', 'Urgent', 'Background', 'Comparison'],
            ['This CPU fixture', 'priority 10', 'priority 0', 'larger first'],
            ['Cited vLLM queue', 'priority 0', 'priority 10', 'smaller first'],
          ],
          190,
          360,
          1540,
          145,
        );
        drawBatchingUpgradeText(
          ctx,
          api,
          'Translate the policy; priority cannot create pages or work slots',
          960,
          920,
          34,
          themeColors.yellow,
          'center',
        );
      }
      drawBatchingUpgradeFoot(
        ctx,
        api,
        'Known serial lengths isolate ordering; GPU step duration depends on the actual co-batch',
      );
    }
    return;
  });
}
export default {
  id: 'queue-policies',
  draw: drawQueuePolicies,
  cues: ['queue-policies-b1', 'queue-fcfs', 'queue-sjf', 'queue-policies-b2', 'queue-policies-b3'],
};
