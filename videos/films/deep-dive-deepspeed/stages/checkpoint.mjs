import { gradients, trajectory } from '../arithmetic.mjs';
import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalText } from '../defaults.mjs';
export function drawCheckpoint(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api,
    modelState = sampleModel('checkpoint', state),
    currentBeat = modelState.b;
  {
    if (currentBeat === 0) {
      drawOriginalText(
        ctx,
        api,
        `Build optimizer history · completed updates ${modelState.completed} / 5`,
        960,
        285,
        39,
        themeColors.yellow,
        'center',
      );
      api.focus.target(
        'checkpoint-gradients-map-g-i-i-s-completed-trajectory-i-1-0-tofixed-5-pending',
        () =>
          teaching.grid({
            x: 200,
            y: 430,
            width: 1500,
            height: 150,
            rows: 1,
            columns: 5,
            labels: [
              gradients.map((g, i) =>
                i < modelState.completed ? trajectory[i + 1][0].toFixed(5) : 'pending',
              ),
            ],
            fontSize: 33,
            fill: themeColors.panel,
            stroke: themeColors.muted,
            textColor: themeColors.ink,
            highlights: Array.from(
              {
                length: modelState.completed,
              },
              (_, column) => ({
                row: 0,
                column,
                fill: themeColors.panel,
                stroke: themeColors.cyan,
              }),
            ),
          }),
      );
      gradients.forEach((g, i) =>
        drawOriginalText(
          ctx,
          api,
          `gradient ${g}`,
          350 + i * 300,
          670,
          29,
          themeColors.blue,
          'center',
        ),
      );
      drawOriginalText(
        ctx,
        api,
        `Current w = ${modelState.current[0].toFixed(8)}`,
        960,
        800,
        40,
        themeColors.green,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        `Current m = ${modelState.current[1].toFixed(6)} · v = ${modelState.current[2].toFixed(6)}`,
        960,
        920,
        35,
        themeColors.cyan,
        'center',
      );
      return;
    }
    const progress = api.focus.progress(
        'checkpoint-apply-next',
        currentBeat > 1 ? 1 : modelState.q,
      ),
      updated = progress === 1;
    const full = updated ? modelState.full : modelState.saved,
      reset = updated ? modelState.weightsOnly : [modelState.saved[0], 0, 0];
    drawOriginalText(
      ctx,
      api,
      'Same saved weight · two explicitly different resume states',
      960,
      285,
      36,
      themeColors.yellow,
      'center',
    );
    api.focus.target('checkpoint-full-branch', () => {
      drawOriginalCard(
        ctx,
        api,
        'Complete restore · weight + moments + step',
        150,
        390,
        730,
        themeColors.blue,
        100,
      );
      drawOriginalText(
        ctx,
        api,
        'w = ' + full[0].toFixed(8),
        515,
        570,
        33,
        themeColors.blue,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        'm = ' + full[1].toFixed(6) + ' · v = ' + full[2].toFixed(6),
        515,
        650,
        27,
        themeColors.blue,
        'center',
      );
    });
    api.focus.target('checkpoint-reset-branch', () => {
      drawOriginalCard(
        ctx,
        api,
        'Weights-only restore · moments start at zero',
        1040,
        390,
        730,
        themeColors.pink,
        100,
      );
      drawOriginalText(
        ctx,
        api,
        'w = ' + reset[0].toFixed(8),
        1405,
        570,
        33,
        themeColors.pink,
        'center',
      );
      drawOriginalText(
        ctx,
        api,
        'm = ' + reset[1].toFixed(6) + ' · v = ' + reset[2].toFixed(6),
        1405,
        650,
        27,
        themeColors.pink,
        'center',
      );
    });
    const axisX = (value) => 330 + ((value - 0.965) / 0.007) * 1260;
    api.line(ctx, 330, 700, 1590, 700, themeColors.muted, 2);
    [0.965, 0.9685, 0.972].forEach((value) => {
      const x = axisX(value);
      api.line(ctx, x, 693, x, 707, themeColors.muted, 2);
      drawOriginalText(ctx, api, value.toFixed(4), x, 735, 23, themeColors.muted, 'center');
    });
    api.circle(ctx, axisX(full[0]), 685, 7, themeColors.blue);
    api.circle(ctx, axisX(reset[0]), 715, 7, themeColors.pink);
    api.focus.target('checkpoint-shared-gradient-step', () => {
      drawOriginalCard(
        ctx,
        api,
        'Both branches: next gradient 0.4 · step 6',
        460,
        750,
        1000,
        themeColors.yellow,
        90,
      );
      api.rect(ctx, 460, 846, 1000 * progress, 6, themeColors.yellow);
    });
    drawOriginalText(
      ctx,
      api,
      updated ? 'After the next Adam update' : 'Restored states · next update pending',
      960,
      885,
      27,
      themeColors.muted,
      'center',
    );
    api.focus.target('checkpoint-next-weight-gap', () =>
      drawOriginalText(
        ctx,
        api,
        updated
          ? 'Next-update gap ≈ ' + Math.abs(full[0] - reset[0]).toFixed(8)
          : 'Next-update gap: pending',
        960,
        945,
        39,
        updated ? themeColors.green : themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'checkpoint',
  draw: drawCheckpoint,
  cues: [
    'checkpoint-beat-1-focus-1',
    'checkpoint-beat-1-focus-2',
    'ds-checkpoint-b0-s0',
    'ds-checkpoint-b0-s1',
    'ds-checkpoint-b0-s2',
    'checkpoint-restore-full',
    'checkpoint-reset-moments',
    'checkpoint-apply-next',
    'checkpoint-derived-gap',
    'ds-checkpoint-b1-s0',
    'ds-checkpoint-b1-s1',
    'ds-checkpoint-b1-s2',
    'ds-checkpoint-b1-s3',
    'ds-checkpoint-b1-s4',
    'checkpoint-next-update-proof',
    'ds-checkpoint-b2-s0',
    'ds-checkpoint-b2-s1',
    'ds-checkpoint-b2-s2',
    'ds-checkpoint-b2-s3',
  ],
};
