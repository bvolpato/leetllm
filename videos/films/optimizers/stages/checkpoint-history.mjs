import { CPU_RESUME_TRACE } from '../fixtures.mjs';
import { pair } from '../arithmetic.mjs';
import { cueProgress } from '../construction.mjs';
import { drawTrainingAndMemoryTarget, drawTrainingAndMemoryText } from '../defaults.mjs';
export function drawCheckpointHistory(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    currentBeat = state.beat ?? 0;
  const phase = (id, b) => cueProgress(state, id, b);
  {
    const fixture = CPU_RESUME_TRACE;
    drawTrainingAndMemoryText(
      ctx,
      api,
      themeColors,
      'Actual deterministic CPU continuation · checkpoint after update 3',
      170,
      245,
      31,
      themeColors.muted,
    );
    if (currentBeat === 0) {
      drawTrainingAndMemoryTarget(ctx, api, 'checkpoint-copy', () => {
        const rows = [
          ['Frozen θ', pair(fixture.checkpointWeights, 5)],
          ['Signed m', pair(fixture.checkpointMean, 4)],
          ['Squared v', pair(fixture.checkpointSquare, 4)],
          ['Adam count', '3'],
          ['Scheduler rate', String(fixture.checkpointRate)],
        ];
        rows.forEach(([label, value], i) => {
          const y = 390 + i * 105;
          drawTrainingAndMemoryText(ctx, api, themeColors, label, 230, y, 32, themeColors.muted);
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            phase('checkpoint-copy', 0) === 1 ? value : '?',
            700,
            y,
            34,
            themeColors.cyan,
          );
        });
      });
      drawTrainingAndMemoryTarget(ctx, api, 'checkpoint-freeze', () => {
        const p = phase('checkpoint-freeze', 0),
          n = Math.floor(p * 3),
          last = fixture.original[Math.max(0, n - 1)];
        api.line(ctx, 1120, 430, 1660, 430, themeColors.muted, 3);
        for (let i = 0; i <= 3; i++) {
          const x = 1120 + i * 180;
          api.circle(
            ctx,
            x,
            430,
            8,
            i <= n ? themeColors.green : themeColors.bg,
            themeColors.green,
            2,
          );
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            String(i + 3),
            x,
            485,
            27,
            themeColors.muted,
            'center',
          );
        }
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Original continues: t = ' + (3 + n),
          1100,
          600,
          35,
          themeColors.green,
        );
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Live θ ≈ ' + pair(n ? last.weights : fixture.checkpointWeights, 5),
          1100,
          680,
          33,
          themeColors.green,
        );
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'The copied artifact remains at t = 3.',
          1100,
          810,
          31,
          themeColors.cyan,
        );
      });
      drawTrainingAndMemoryTarget(ctx, api, 'checkpoint-history', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Same coordinates can carry different next-update histories.',
          960,
          1040,
          32,
          themeColors.yellow,
          'center',
        ),
      );
    } else if (currentBeat === 1) {
      drawTrainingAndMemoryTarget(ctx, api, 'restore-order', () => {
        const labels = [
          'Construct optimizer and scheduler',
          'Load scheduler state',
          'Load optimizer state',
        ];
        labels.forEach((label, i) => {
          const y = 370 + i * 90;
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            String(i + 1) + '. ' + label,
            220,
            y,
            30,
            phase('restore-order', 1) > i / 3 ? themeColors.cyan : themeColors.muted,
          );
        });
      });
      drawTrainingAndMemoryTarget(ctx, api, 'resume-three', () => {
        const p = phase('resume-three', 1),
          count = Math.floor(p * 3);
        const plot = teaching.axes({
          x: 860,
          y: 355,
          width: 840,
          height: 500,
          xDomain: [3, 6],
          yDomain: [0.945, 0.98],
          xTicks: [3, 4, 5, 6],
          yTicks: [0.95, 0.96, 0.97],
          xLabel: 'continued work after saved update 3',
          yLabel: 'parameter a',
          fontSize: 23,
          color: themeColors.muted,
        });
        const start = {
          x: 3,
          y: fixture.checkpointWeights[0],
        };
        teaching.curve({
          plot,
          points: [
            start,
            ...fixture.original.map((r, i) => ({
              x: i + 4,
              y: r.weights[0],
            })),
          ],
          color: themeColors.muted,
          width: 7,
        });
        teaching.curve({
          plot,
          points: [
            start,
            ...fixture.complete.slice(0, count).map((r, i) => ({
              x: i + 4,
              y: r.weights[0],
            })),
          ],
          color: themeColors.green,
          width: 4,
        });
        if (phase('weights-only', 1) > 0)
          teaching.curve({
            plot,
            points: [
              start,
              ...fixture.weightsOnly.map((r, i) => ({
                x: i + 4,
                y: r.weights[0],
              })),
            ],
            color: themeColors.pink,
            width: 4,
          });
      });
      drawTrainingAndMemoryTarget(ctx, api, 'resume-match', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('resume-match', 1) === 1
            ? 'Complete state: bitwise match = True'
            : 'Complete-state equality = ?',
          230,
          690,
          31,
          themeColors.green,
        ),
      );
      drawTrainingAndMemoryTarget(ctx, api, 'resume-count', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('resume-count', 1) === 1 ? 'Restored Adam count = 6' : 'Restored Adam count = ?',
          230,
          790,
          31,
          themeColors.green,
        ),
      );
      drawTrainingAndMemoryTarget(ctx, api, 'weights-only', () =>
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          phase('weights-only', 1) === 1
            ? 'Weights-only: match = False · fresh count = 3'
            : 'Weights-only continuation = ?',
          960,
          1035,
          32,
          themeColors.pink,
          'center',
        ),
      );
    } else {
      drawTrainingAndMemoryTarget(ctx, api, 'resume-real', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Resume on the same next minibatch',
          200,
          350,
          36,
          themeColors.ink,
        );
        for (const [i, label] of [
          'Completed-update counter',
          'Data position',
          'Relevant RNG states',
          'AMP scaler when used',
        ].entries()) {
          const y = 470 + i * 130;
          api.line(ctx, 240, y, 700, y, themeColors.cyan, 4);
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            label,
            280,
            y - 23,
            32,
            themeColors.cyan,
          );
        }
      });
      drawTrainingAndMemoryTarget(ctx, api, 'muon-group', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Two-dimensional hidden weights',
          1070,
          360,
          31,
          themeColors.yellow,
        );
        for (let i = 0; i < 2; i++)
          for (let j = 0; j < 2; j++) {
            api.rect(ctx, 1130 + j * 120, 420 + i * 90, 100, 70, undefined, themeColors.yellow, 2);
            drawTrainingAndMemoryText(
              ctx,
              api,
              themeColors,
              String(i * 2 + j + 1),
              1180 + j * 120,
              466 + i * 90,
              30,
              themeColors.yellow,
              'center',
            );
          }
        if (phase('muon-group', 2) === 1)
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            'Muon treats this as a matrix.',
            1070,
            680,
            32,
            themeColors.yellow,
          );
      });
      drawTrainingAndMemoryTarget(ctx, api, 'other-groups', () => {
        drawTrainingAndMemoryText(
          ctx,
          api,
          themeColors,
          'Biases / embeddings / other groups',
          1070,
          805,
          30,
          themeColors.muted,
        );
        if (phase('other-groups', 2) === 1)
          drawTrainingAndMemoryText(
            ctx,
            api,
            themeColors,
            'AdamW can serve these groups.',
            1070,
            885,
            32,
            themeColors.green,
          );
      });
    }
  }
}
export default {
  id: 'checkpoint-history',
  draw: drawCheckpointHistory,
  cues: [
    'checkpoint-copy',
    'checkpoint-freeze',
    'checkpoint-history',
    'restore-order',
    'resume-three',
    'resume-match',
    'resume-count',
    'weights-only',
    'resume-real',
    'muon-group',
    'other-groups',
  ],
};
