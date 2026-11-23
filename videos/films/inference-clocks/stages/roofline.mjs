import { capacityFixture, metrics } from '../arithmetic.mjs';
import { outputs, prompt } from '../fixtures.mjs';
import { inferenceCapacityAnswerVisible, sampleModel } from '../model.mjs';
import { drawUpgradeBar, drawUpgradeText, text } from '../defaults.mjs';
export function drawRoofline(ctx, scene, state, api) {
  if (drawUpgrade(ctx, scene, state, api)) return;
  const { C: themeColors, teaching: teaching } = api;
  const modelState = sampleModel('roofline', state),
    currentBeat = modelState.step;
  if (state.cues && false) {
    const q =
      currentBeat === 0
        ? 70
        : currentBeat === 1
          ? 70 * (1 - api.focus.progress('remove-queue', 0))
          : 70 * api.focus.progress('restore-queue', 0);
    let end = 0;
    modelState.spans = ['Queue', 'Tokenization', 'Prefill', 'First-logit work'].map((name, i) => {
      const start = end,
        duration = [q, 10, 230, 10][i];
      end += duration;
      return {
        name,
        start,
        duration,
        end,
      };
    });
    modelState.constructionClock =
      currentBeat === 0 ? end * api.focus.progress('construct-first-clock', 0) : end;
    modelState.clientExtra =
      currentBeat === 2 ? Math.round(30 * api.focus.progress('client-boundaries', 0)) : 0;
    Object.assign(modelState, {
      serverFirst: end,
      clientSend: -modelState.clientExtra,
      clientFirst: end + modelState.clientExtra,
      serverTtft: end,
      clientTtft: end + 2 * modelState.clientExtra,
    });
  }
  if (state.cues && false) {
    modelState.cached = api.focus.progress('prompt-kv', 0) > 0 ? prompt : [];
    modelState.prediction = api.focus.progress('first-prediction', 0) > 0 ? outputs[0] : null;
  }
  if (state.cues && false) {
    modelState.consumed =
      currentBeat === 0
        ? api.focus.progress('predict-next', 0) > 0
          ? 1
          : 0
        : currentBeat === 1
          ? api.focus.progress('punctuation', 0) > 0
            ? 2
            : 1
          : 2;
    modelState.cached = [...prompt, ...outputs.slice(0, modelState.consumed)];
    modelState.prediction = outputs[modelState.consumed];
    modelState.emitted = modelState.consumed + 1;
  }
  {
    api.focus.target('roofline-authored-ceilings-10-tb-s-bandwidth-200-tflop-s-compute', () =>
      text(
        ctx,
        api,
        'Example GPU · 10 TB/s bandwidth · 200 TFLOP/s compute',
        140,
        260,
        30,
        themeColors.muted,
      ),
    );
    const plot = teaching.axes({
      x: 240,
      y: 405,
      width: 1050,
      height: 410,
      xDomain: [0, 40],
      yDomain: [0, 240],
      xTicks: [0, 10, 20, 30, 40],
      yTicks: [0, 100, 200],
      xLabel: 'intensity (FLOPs/byte)',
      yLabel: 'compute rate (TFLOP/s)',
    });
    api.focus.target('projection-roofline', () =>
      teaching.curve({
        plot,
        points: [
          {
            x: 0,
            y: 0,
          },
          {
            x: 20,
            y: 200,
          },
          {
            x: 40,
            y: 200,
          },
        ],
        color: themeColors.cyan,
        width: 5,
      }),
    );
    api.focus.target('projection-roofline', () =>
      teaching.scatter({
        plot,
        points: [
          {
            x: modelState.intensity,
            y: modelState.roof,
            color: themeColors.yellow,
            radius: 11,
          },
        ],
      }),
    );
    api.focus.target('roofline-readout', () =>
      text(ctx, api, `${modelState.rows} rows`, 1530, 440, 42, themeColors.yellow, 'center'),
    );
    api.focus.target('roofline-readout-2', () =>
      text(ctx, api, `${modelState.flops} FLOPs`, 1530, 550, 30, themeColors.ink, 'center'),
    );
    api.focus.target('roofline-readout-3', () =>
      text(
        ctx,
        api,
        `${modelState.weightBytes} weight bytes`,
        1530,
        635,
        29,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('roofline-readout-4', () =>
      text(ctx, api, `I = ${modelState.intensity}`, 1530, 720, 34, themeColors.cyan, 'center'),
    );
    api.focus.target('roofline-16-projection-weights-two-byte-values-multiply-add-coun', () =>
      text(
        ctx,
        api,
        '16 projection weights · two-byte values · multiply-add counts as two FLOPs',
        960,
        965,
        28,
        themeColors.muted,
        'center',
      ),
    );
  }
}
function drawUpgrade(ctx, scene, state, api) {
  const roof = (state.beat ?? 0) === 3;
  if (!roof) return false;
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    f = capacityFixture();
  const target = roof
    ? 'roofline-extension'
    : currentBeat === 3
      ? 'roofline-extension'
      : 'roofline-mechanism';
  api.focus.target(target, () => {
    if (roof) {
      drawUpgradeText(
        ctx,
        api,
        'One BF16 weight read · N rows reuse it',
        960,
        290,
        40,
        themeColors.ink,
        'center',
      );
      drawUpgradeBar(ctx, api, 260, 460, 180, 140, themeColors.blue);
      drawUpgradeText(ctx, api, '2 bytes', 350, 715, 35, themeColors.blue, 'center');
      const n =
        1 +
        Math.floor(
          7 * api.focus.progress('roofline-core-extension', api.phase(progress, 0.05, 0.7)),
        );
      for (let i = 0; i < n; i++) {
        const x = 690 + i * 140;
        drawUpgradeBar(ctx, api, x, 460, 90, 140, themeColors.panel);
        drawUpgradeText(ctx, api, '× +', x + 45, 550, 33, themeColors.yellow, 'center');
        drawUpgradeText(ctx, api, '2', x + 45, 690, 36, themeColors.yellow, 'center');
      }
      drawUpgradeText(
        ctx,
        api,
        2 * n + ' operations  ÷  2 weight bytes  =  ' + n + ' FLOPs/byte',
        960,
        849,
        47,
        themeColors.green,
        'center',
      );
      drawUpgradeText(
        ctx,
        api,
        'For N rows: 2N operations from the same 2 weight bytes',
        960,
        990,
        31,
        themeColors.muted,
        'center',
      );
    } else {
      if (currentBeat === 0) {
        const times = [410, 454, 495, 542],
          m = metrics(0, times),
          X = (v) => 200 + v * 2.8;
        api.line(ctx, 200, 570, X(560), 570, themeColors.muted, 3);
        times.forEach((t, i) => {
          const x = X(t);
          api.circle(ctx, x, 570, 12, themeColors.cyan);
          drawUpgradeText(ctx, api, String(t), x, 650, 31, themeColors.cyan, 'center');
          drawUpgradeText(ctx, api, 'T' + (i + 1), x, 480, 30, themeColors.ink, 'center');
        });
        drawUpgradeText(
          ctx,
          api,
          'TTFT 410 ms · gaps 44, 41, 47 ms',
          960,
          820,
          39,
          themeColors.yellow,
          'center',
        );
        drawUpgradeText(
          ctx,
          api,
          'TPOT ' + m.tpot + ' ms · decode ' + m.decodeTps.toFixed(1) + ' tokens/s',
          960,
          970,
          41,
          themeColors.green,
          'center',
        );
      } else if (currentBeat < 4) {
        drawUpgradeText(
          ctx,
          api,
          'Same admitted-stream latency · new requests cannot reserve state',
          960,
          300,
          35,
          themeColors.ink,
          'center',
        );
        for (let i = 0; i < 40; i++) {
          const x = 220 + (i % 10) * 150,
            y = 400 + Math.floor(i / 10) * 100;
          drawUpgradeBar(ctx, api, x, y, 115, 70, themeColors.blue);
        }
        drawUpgradeText(
          ctx,
          api,
          'No free page for the next reservation',
          960,
          900,
          42,
          themeColors.red,
          'center',
        );
        drawUpgradeText(
          ctx,
          api,
          inferenceCapacityAnswerVisible(state)
            ? 'Smaller state, smaller reservations or more memory target this receipt'
            : 'Predict which intervention can create a free reservation page',
          960,
          995,
          31,
          inferenceCapacityAnswerVisible(state) ? themeColors.yellow : themeColors.muted,
          'center',
        );
      } else {
        const offered = 20,
          qualifying = 12,
          seconds = 20;
        drawUpgradeText(
          ctx,
          api,
          'Authored offered population · full 20-second window',
          960,
          280,
          38,
          themeColors.ink,
          'center',
        );
        for (let i = 0; i < offered; i++) {
          const x = 210 + (i % 10) * 155,
            y = 390 + Math.floor(i / 10) * 180,
            color =
              i < qualifying ? themeColors.green : i < 17 ? themeColors.red : themeColors.pink;
          drawUpgradeBar(ctx, api, x, y, 115, 100, color);
          drawUpgradeText(
            ctx,
            api,
            'R' + (i + 1),
            x + 57.5,
            y + 150,
            28,
            themeColors.muted,
            'center',
          );
        }
        drawUpgradeText(
          ctx,
          api,
          '12 qualify · 5 rejected · 3 failed',
          960,
          810,
          36,
          themeColors.ink,
          'center',
        );
        drawUpgradeText(
          ctx,
          api,
          (qualifying / seconds).toFixed(1) +
            ' qualifying requests/s · ' +
            ((qualifying / offered) * 100).toFixed(0) +
            '% of offered requests',
          960,
          960,
          41,
          themeColors.yellow,
          'center',
        );
      }
    }
  });
  return true;
}
export default {
  id: 'roofline',
  draw: drawRoofline,
  cues: [
    'weight-payload',
    'arithmetic-intensity',
    'shared-rows',
    'fixed-weight-bytes',
    'roofline-point',
    'upper-bounds',
    'profile-shapes',
    'roofline-core-extension',
  ],
};
