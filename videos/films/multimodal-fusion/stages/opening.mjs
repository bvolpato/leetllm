import { cue } from '../arithmetic.mjs';
import { originalKey, risingRow, traceAtHour } from '../chart-reading.mjs';
import { DASHBOARD } from '../fixtures.mjs';

export function drawOpening(ctx, scene, state, api) {
  const { C, components, focus, teaching } = api;
  const beat = state.beat ?? 0;
  if (state.t < 0.35) ctx.globalAlpha = 1;

  const trace = cue(state, 'opening-follow-traces', 0, 0, 0.32);
  const lead = api.clamp((state.t ?? 0) / 0.4);
  const hour = beat === 0 ? 3.9 + 0.4 * lead + 1.7 * trace : 6;
  const legend = cue(state, 'opening-restore-key', 1, 0.05, 0.28);
  const named = cue(state, 'opening-match-key', 1, 0.29, 0.42) === 1;
  const encode = cue(state, 'opening-beat-2-focus-1', 1, 0.45, 0.69);
  const bridge = cue(state, 'opening-beat-2-focus-2', 1, 0.71, 0.98);

  focus.target('opening-chart-evidence', () => {
    api.text(ctx, 'Milliseconds', 154, 244, 34, C.ink);
    const plot = teaching.axes({
      x: 210,
      y: 285,
      width: 1500,
      height: 370,
      xDomain: [1, 6],
      yDomain: [0, 10],
      xTicks: [1, 3, 6],
      yTicks: [0, 5, 10],
      formatX: (h) => h + ' pm',
      fontSize: 31,
    });
    const marker = plot.point(DASHBOARD.afterHour, 0);
    api.line(ctx, marker.x, plot.point(3, 10).y, marker.x, marker.y, C.muted, 2);
    DASHBOARD.series.forEach(({ values, tone }, i) => {
      const rising = i === risingRow;
      const points = traceAtHour(values, rising ? hour : 6);
      teaching.curve({ plot, points, color: C[tone], width: rising ? 12 : 6 });
      if (rising) {
        const end = points.at(-1);
        const tip = plot.point(end.x, end.y);
        api.circle(ctx, tip.x, tip.y, 16, C.green, C.bg, 4);
      }
    });
  });

  focus.target('opening-legend', () => {
    const edge = 739 + 115 * legend;
    if (edge >= 775) {
      DASHBOARD.series.forEach(({ tone }, i) => {
        const x = 328 + 510 * i;
        api.line(ctx, x, 762, x + 92, 762, C[tone], 10);
        if (edge >= 807) api.text(ctx, originalKey[i], x + 119, 785, 47, C[tone]);
      });
    }
    api.line(ctx, 120, edge, 1800, edge, C.muted, 2);
    api.line(ctx, 120, edge - 20, 120, edge, C.yellow, 5);
    api.line(ctx, 1800, edge - 20, 1800, edge, C.yellow, 5);
    api.line(ctx, 902, edge, 1018, edge, C.yellow, 8);
    if (legend === 0) api.text(ctx, 'Crop edge', 1730, edge + 48, 30, C.muted, 'right');
  });

  if (beat === 0 || (beat === 1 && encode === 0)) {
    api.text(
      ctx,
      named ? originalKey[risingRow] + ' slowed down.' : 'Which service slowed down?',
      960,
      982,
      70,
      named ? C.green : C.yellow,
      'center',
    );
    return;
  }
  if (beat === 1) {
    focus.target('opening-modality-meeting', () => {
      focus.target('opening-image-encoding', () => {
        const model = components.card({
          x: 720,
          y: 911,
          width: 460,
          height: 91,
          label: 'Encoder + connector',
          fontSize: 37,
          stroke: C.cyan,
          textColor: C.ink,
          fill: C.panel,
        });
        for (const [label, y, color] of [
          ['Rising trace', 878, C.green],
          [originalKey[risingRow] + ' swatch', 972, C.green],
        ]) {
          const region = components.card({
            x: 155,
            y,
            width: 360,
            height: 68,
            label,
            fontSize: 32,
            stroke: color,
            textColor: C.ink,
            fill: C.panel,
          });
          teaching.transfer({
            source: { shape: region, opacity: 1 },
            target: { shape: model, opacity: 1 },
            progress: encode,
            color,
            gap: 12,
          });
        }
      });
      if (bridge > 0) {
        api.line(ctx, 1195, 956, 1195 + 130 * bridge, 956, C.cyan, 5);
        api.text(ctx, 'Language model', 1365, 948, 42, C.ink);
        api.text(ctx, 'Question + image features', 1365, 1002, 31, C.cyan);
      }
    });
    return;
  }
  focus.target('opening-route-output', () => {
    const reading = cue(state, 'opening-read-evidence', 2, 0.46, 0.75) > 0;
    api.text(
      ctx,
      reading ? 'Name the service from its slope and label' : 'Find similar screenshots',
      960,
      946,
      48,
      reading ? C.green : C.blue,
      'center',
    );
    api.text(
      ctx,
      reading ? 'Visual prefix or separate visual memory' : 'One similarity score per chart',
      960,
      1011,
      33,
      C.ink,
      'center',
    );
  });
}

export default {
  id: 'opening',
  draw: drawOpening,
  cues: [
    'opening-follow-traces',
    'opening-restore-key',
    'opening-match-key',
    'opening-beat-2-focus-1',
    'opening-beat-2-focus-2',
    'opening-read-evidence',
  ],
};
