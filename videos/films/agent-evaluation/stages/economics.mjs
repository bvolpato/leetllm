import { ECONOMIC_RUNS } from '../fixtures.mjs';
import { economicsFrame, report } from '../model.mjs';
import { originalCard, originalEquation, originalText } from '../defaults.mjs';
export function drawEconomics(ctx, scene, state, api) {
  const { C: themeColors, components: components, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88),
    r = report(),
    resultComplete = (id) =>
      state.cues?.[id] ? state.cues[id].phase === 'after' : api.focus.progress(id, 0) === 1;
  {
    const current = economicsFrame(beat, progress2);
    if (state.cues?.['add-costs']) {
      current.spent = Math.min(9, Math.ceil(9 * api.focus.progress('add-costs', 0)));
      current.checked = Math.min(9, Math.ceil(9 * api.focus.progress('successful-denominator', 0)));
      current.total = ECONOMIC_RUNS.slice(0, current.spent).reduce((sum, row) => sum + row.cost, 0);
      current.successes = ECONOMIC_RUNS.slice(0, current.checked).filter((row) => row.pass).length;
      current.quotientReady = resultComplete('cost-quotient');
      current.durationCount = Math.min(9, Math.ceil(9 * api.focus.progress('place-durations', 0)));
      current.p95Ready = resultComplete('sample-quantile');
    }
    if (beat === 0) {
      api.focus.target('incurred-spend', () =>
        teaching.valueChange({
          x: 170,
          y: 260,
          width: 500,
          height: 150,
          label: 'All incurred spend',
          from: 0,
          to: current.total,
          progress: 1,
          format: (v) => '$' + v.toFixed(3),
          fontSize: 32,
          showDelta: false,
          color: themeColors.yellow,
          restColor: themeColors.cyan,
          emphasis: current.spent > 0 && current.spent < 9 ? 0.7 : 0,
        }),
      );
      api.focus.target('successful-runs', () =>
        teaching.valueChange({
          x: 720,
          y: 260,
          width: 450,
          height: 150,
          label: 'Successful runs',
          from: 0,
          to: current.successes,
          progress: 1,
          format: String,
          fontSize: 32,
          showDelta: false,
          color: themeColors.green,
          restColor: themeColors.green,
          emphasis: current.checked > 0 && current.checked < 9 ? 0.7 : 0,
        }),
      );
      api.focus.target('cost-per-success', () =>
        originalCard(
          ctx,
          api,
          current.quotientReady
            ? 'Cost per success\n$' +
                current.total.toFixed(3) +
                ' ÷ ' +
                current.successes +
                ' = $' +
                (current.total / current.successes).toFixed(3)
            : 'Cost per success\nWait for accounting',
          1220,
          260,
          520,
          current.quotientReady ? themeColors.green : themeColors.muted,
          150,
        ),
      );
      const x = 235,
        width = 1450,
        slot = width / 9,
        base = 790,
        height = 320;
      ECONOMIC_RUNS.forEach((row, i) => {
        const cx = x + (i + 0.5) * slot,
          color = row.pass ? themeColors.green : themeColors.pink,
          shown = i < current.spent;
        api.rect(ctx, cx - 30, base - height, 60, height, '#8d9cb922');
        if (shown) {
          const h = (height * row.cost) / 0.05;
          api.focus.target('cost-bars', () => {
            const bar = () => api.rect(ctx, cx - 30, base - h, 60, h, color);
            if (row.id === 'R5') api.focus.target('failed-cost', bar);
            else bar();
          });
          originalText(
            ctx,
            api,
            (100 * row.cost).toFixed(1) + '¢',
            cx,
            base - h - 17,
            26,
            color,
            'center',
          );
        }
        api.focus.target('run-identities', () =>
          originalText(ctx, api, row.id, cx, 835, 25, themeColors.muted, 'center'),
        );
        originalText(ctx, api, row.seconds + ' s', cx, 930, 24, themeColors.muted, 'center');
        if (i < current.checked)
          api.focus.target('run-outcomes', () =>
            originalText(ctx, api, row.pass ? 'PASS' : 'FAIL', cx, 890, 24, color, 'center'),
          );
      });
      originalText(
        ctx,
        api,
        current.spent + ' / 9 costs added · ' + current.checked + ' / 9 outcomes checked',
        960,
        965,
        30,
        themeColors.ink,
        'center',
      );
    } else {
      originalText(
        ctx,
        api,
        'Same nine run IDs · observed duration inputs',
        960,
        270,
        31,
        themeColors.ink,
        'center',
      );
      ECONOMIC_RUNS.forEach((row, i) => {
        const x = 150 + i * 180,
          position = current.ordered.findIndex((r) => r.id === row.id),
          used = position < current.durationCount;
        api.focus.target('duration-inputs', () =>
          components.panel({
            x,
            y: 320,
            width: 160,
            height: 135,
            fill: themeColors.panel,
            stroke: used ? themeColors.muted : themeColors.blue,
          }),
        );
        api.focus.target('duration-inputs', () =>
          originalText(
            ctx,
            api,
            row.id,
            x + 80,
            357,
            25,
            used ? themeColors.muted : themeColors.blue,
            'center',
          ),
        );
        api.focus.target('duration-inputs', () =>
          originalText(
            ctx,
            api,
            row.seconds + ' s',
            x + 80,
            400,
            26,
            used ? themeColors.muted : themeColors.ink,
            'center',
          ),
        );
        originalText(
          ctx,
          api,
          (100 * row.cost).toFixed(1) + '¢',
          x + 80,
          440,
          24,
          themeColors.muted,
          'center',
        );
      });
      const x = 235,
        width = 1450,
        slot = width / 9,
        base = 790,
        height = 300;
      current.ordered.forEach((row, i) => {
        if (i >= current.durationCount) return;
        const cx = x + (i + 0.5) * slot,
          h = (height * row.seconds) / 9,
          color = current.p95Ready && i === 8 ? themeColors.yellow : themeColors.blue;
        api.focus.target('ordered-durations', () => api.rect(ctx, cx - 30, base - h, 60, h, color));
        originalText(ctx, api, row.seconds + ' s', cx, base - h - 18, 27, color, 'center');
        originalText(ctx, api, row.id, cx, 835, 25, color, 'center');
      });
      originalText(
        ctx,
        api,
        current.durationCount + ' / 9 observed durations placed in ascending order',
        960,
        900,
        29,
        themeColors.ink,
        'center',
      );
      if (current.durationCount === 9)
        api.focus.target('quantile-rank', () =>
          originalEquation(
            ctx,
            api,
            String.raw`k=\lceil0.95\cdot9\rceil=9`,
            540,
            975,
            37,
            themeColors.cyan,
          ),
        );
      if (current.p95Ready)
        api.focus.target('quantile-rank', () =>
          originalText(
            ctx,
            api,
            'Nearest-rank sample p95: ' + current.p95.seconds + ' seconds',
            1350,
            975,
            31,
            themeColors.yellow,
            'center',
          ),
        );
    }
    originalText(
      ctx,
      api,
      'All incurred spend includes failed runs · percentiles retain actual observed run durations',
      960,
      1040,
      26,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'economics',
  draw: drawEconomics,
  cues: [
    'add-costs',
    'failed-cost',
    'successful-denominator',
    'cost-quotient',
    'place-durations',
    'sample-quantile',
    'incurred-accounting',
  ],
};
