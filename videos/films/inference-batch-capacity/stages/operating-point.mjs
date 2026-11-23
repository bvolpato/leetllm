import { GiB } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { drawOriginalText } from '../defaults.mjs';
export function drawOperatingPoint(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  let directed = state;
  if (state.cues) {
    const b = state.beat;
    let u = null,
      k = 1;
    if (b < 2) {
      u = api.focus.progress(b === 0 ? 'memory-test' : 'latency-test', 0);
      k = 0.65;
    }
    if (u !== null)
      directed = {
        ...state,
        beatP: 0.15 + 0.6 * k * u,
      };
  }
  const modelState = sampleModel('operating-point', directed),
    currentBeat = modelState.step;
  {
    const x = [180, 500, 850, 1190, 1510];
    [
      'Batch',
      'Reserved KV',
      'Iteration',
      'Output rate',
      currentBeat === 0 ? 'Memory' : 'Both limits',
    ].forEach((label, i) =>
      api.focus.target('operating-point-readout', () =>
        drawOriginalText(ctx, api, label, x[i], 315, 28, themeColors.muted),
      ),
    );
    modelState.rows.forEach((row, i) =>
      api.focus.target('candidate-checks', () => {
        const y = 415 + i * 85,
          checked = row.memoryTested && (currentBeat === 0 || !row.memoryPass || row.latencyTested),
          pass = row.memoryPass && (currentBeat === 0 || row.latencyPass);
        const current = currentBeat < 2 && i === modelState.tested;
        if (current)
          teaching.changeCue(
            {
              x: 155,
              y: y - 54,
              width: 1630,
              height: 72,
              from: 0,
              to: 1,
              progress: 0.5,
              emphasis: 0.75,
              color: themeColors.yellow,
              restColor: themeColors.yellow,
            },
            () => {},
          );
        const color =
          row.batch === modelState.selected?.batch
            ? themeColors.green
            : checked
              ? pass
                ? themeColors.ink
                : themeColors.pink
              : themeColors.muted;
        const reservedColor = row.memoryTested
          ? row.memoryPass
            ? themeColors.green
            : themeColors.pink
          : themeColors.blue;
        api.rect(
          ctx,
          490,
          y - 35,
          270 * Math.min(1, row.reserved / (20 * GiB)),
          45,
          reservedColor + '22',
          undefined,
          0,
        );
        api.line(
          ctx,
          490 + (270 * 16) / 20,
          y - 40,
          490 + (270 * 16) / 20,
          y + 13,
          themeColors.yellow,
          2,
        );
        if (currentBeat > 0) {
          api.rect(
            ctx,
            840,
            y - 35,
            250 * Math.min(1, row.ms / 64),
            45,
            (row.latencyTested
              ? row.latencyPass
                ? themeColors.green
                : themeColors.pink
              : themeColors.blue) + '22',
            undefined,
            0,
          );
          api.line(
            ctx,
            840 + (250 * 40) / 64,
            y - 40,
            840 + (250 * 40) / 64,
            y + 13,
            themeColors.yellow,
            2,
          );
        }
        const verdict = checked
          ? pass
            ? 'pass'
            : row.memoryPass
              ? 'latency fails'
              : 'memory fails'
          : current
            ? 'testing…'
            : 'pending';
        [
          row.batch,
          `${row.reserved / GiB} GiB`,
          `${row.ms} ms`,
          `${row.tps.toFixed(0)} tok/s`,
          verdict,
        ].forEach((value, j) =>
          api.focus.target('operating-point-readout-2', () =>
            drawOriginalText(ctx, api, String(value), x[j], y, 30, color),
          ),
        );
      }),
    );
    api.focus.target('operating-point-readout-3', () =>
      drawOriginalText(
        ctx,
        api,
        modelState.tested === 5
          ? `Selected from this sweep: B = ${modelState.selected.batch}`
          : modelState.selected
            ? `Best passing candidate so far: B = ${modelState.selected.batch}`
            : 'Apply each constraint before selecting a candidate',
        180,
        890,
        34,
        modelState.tested === 5 ? themeColors.green : themeColors.yellow,
      ),
    );
    api.focus.target('operating-point-readout-4', () =>
      drawOriginalText(
        ctx,
        api,
        currentBeat === 2
          ? `Authored $2 / hour · modeled active rate → $${modelState.costPerMillion.toFixed(2)} / million tokens`
          : 'KV limit 16 GiB · iteration target 40 ms when applied',
        180,
        975,
        28,
        themeColors.muted,
      ),
    );
  }
}
export default {
  id: 'operating-point',
  draw: drawOperatingPoint,
  cues: [
    'memory-test',
    'memory-choice',
    'latency-test',
    'both-limits',
    'cost-interval',
    'useful-output-rate',
  ],
};
