import { FIXTURE } from '../observations.mjs';
import { contrastiveStep } from '../training.mjs';
import { spokenProgress } from '../construction.mjs';
import { drawClipEquation, drawClipText, withClipFocus } from '../defaults.mjs';
export function drawTrainingStep(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0;
  const clauseProgress = (id, beat) => spokenProgress(state, id, beat);
  {
    const q = clauseProgress('gradient-motion', 1),
      current = contrastiveStep(q);
    drawClipText(ctx, api, 'One step on six supplied vectors', 960, 280, 37);
    const plot = withClipFocus(ctx, api, 'training-step-unit-coordinate-2-unit-coordinate-3', () =>
      teaching.axes({
        x: 240,
        y: 390,
        width: 810,
        height: 380,
        equalUnits: true,
        xDomain: [-0.1, 0.12],
        yDomain: [-0.1, 0.12],
        xTicks: [-0.1, 0, 0.1],
        yTicks: [-0.1, 0, 0.1],
        xLabel: 'unit coordinate 2',
        yLabel: 'unit coordinate 3',
        fontSize: 26,
      }),
    );
    withClipFocus(ctx, api, 'training-step-feature-vectors', () => {
      for (const [side, color] of [
        ['images', themeColors.blue],
        ['texts', themeColors.yellow],
      ]) {
        const points = Array.from(
          {
            length: 40,
          },
          (_, i) => {
            const p = contrastiveStep((q * i) / 39)[side][0];
            return {
              x: p[1],
              y: p[2],
            };
          },
        );
        teaching.curve({
          plot,
          points,
          color,
          width: 4,
        });
        const initial = plot.point(FIXTURE[side][0][1], FIXTURE[side][0][2]),
          now = plot.point(current[side][0][1], current[side][0][2]);
        api.circle(ctx, initial.x, initial.y, 9, 'transparent', color, 2);
        api.circle(ctx, now.x, now.y, 9, color);
      }
    });
    drawClipText(ctx, api, 'Photo 17', 380, 350, 30, themeColors.blue);
    drawClipText(ctx, api, 'Caption A', 850, 350, 30, themeColors.yellow);
    drawClipText(ctx, api, 'Photo 17 → captions', 1450, 350, 28, themeColors.muted);
    withClipFocus(ctx, api, 'training-step-query-probabilities', () =>
      teaching.bars({
        x: 1170,
        y: 410,
        width: 560,
        height: 240,
        values: current.rowProbabilities[0],
        labels: ['vent', 'tag', 'door'],
        colors: [themeColors.green, themeColors.blue, themeColors.pink],
        max: 1,
        showValues: true,
        format: (v) => v.toFixed(4),
        fontSize: 26,
      }),
    );
    withClipFocus(ctx, api, 'training-step-gradient-update', () =>
      drawClipEquation(
        ctx,
        api,
        'F(q)=F_0-4q\\nabla_F\\mathcal L(F_0)',
        650,
        985,
        33,
        themeColors.muted,
      ),
    );
    withClipFocus(ctx, api, 'training-step-current-loss', () => {
      drawClipText(
        ctx,
        api,
        'All six vectors update together',
        650,
        900,
        27,
        themeColors.muted,
      );
      if (currentBeat >= 1)
        drawClipText(
          ctx,
          api,
          'symmetric loss ' +
            current.symmetricLoss.toFixed(5) +
            ' · I→T ' +
            current.imageToTextLoss.toFixed(5) +
            ' · T→I ' +
            current.textToImageLoss.toFixed(5),
          960,
          1050,
          28,
          themeColors.green,
        );
    });
    if (currentBeat >= 1) {
      withClipFocus(ctx, api, 'training-step-probability-matrix', () =>
        teaching.grid({
          x: 1180,
          y: 790,
          width: 540,
          height: 144,
          rows: 3,
          columns: 3,
          labels: current.rowProbabilities.map((r) => r.map((v) => v.toFixed(4))),
          fill: themeColors.panel,
          stroke: themeColors.muted,
          fontSize: 23,
          textColor: themeColors.muted,
        }),
      );
      drawClipText(ctx, api, 'All image→text probabilities', 1450, 750, 25, themeColors.muted);
      withClipFocus(ctx, api, 'training-step-column-probabilities', () =>
        drawClipText(
          ctx,
          api,
          'Caption A → photos: ' +
            current.columnProbabilities[0].map((v) => v.toFixed(4)).join(' / '),
          1450,
          985,
          23,
          themeColors.yellow,
        ),
      );
    }
  }
}
export default {
  id: 'training-step',
  draw: drawTrainingStep,
  cues: [
    'training-step-beat-1-focus-1',
    'training-step-beat-1-focus-2',
    'training-step-beat-2-focus-1',
    'training-step-beat-2-focus-2',
    'gradient-motion',
    'training-step-beat-3-focus-1',
    'training-step-beat-3-focus-2',
    'gradient-result',
  ],
};
