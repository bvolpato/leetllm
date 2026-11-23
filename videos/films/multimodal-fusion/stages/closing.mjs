import { cue } from '../arithmetic.mjs';
import { originalKey, risingRow, secondKey, trendPlot } from '../chart-reading.mjs';
import { DASHBOARD } from '../fixtures.mjs';

export function drawClosing(ctx, scene, state, api) {
  const { C, components, teaching, focus } = api;
  const beat = state.beat ?? 0;
  if (beat === 0) {
    const labels = ['Image patches', 'Connector', 'Visual prefix', 'Answer + evidence'];
    const nodes = labels.map((label, i) =>
      focus.target(i === 3 ? 'closing-answer-evidence' : 'closing-image-patches', () =>
        components.card({
          label,
          x: 110 + i * 452,
          y: 358,
          width: 350,
          height: 112,
          fill: C.panel,
          stroke: C.cyan,
          fontSize: 33,
        }),
      ),
    );
    nodes
      .slice(1)
      .forEach((node, i) =>
        teaching.transfer({
          source: { shape: nodes[i], opacity: 1 },
          target: { shape: node, opacity: 1 },
          progress: 1,
          color: C.cyan,
          gap: 12,
        }),
      );
    if (cue(state, 'closing-beat-1-focus-2', 0, 0.24, 0.5) > 0) {
      focus.target('closing-shared-prefix', () => {
        api.text(ctx, 'Same prefix layout for both dashboards', 960, 625, 37, C.ink, 'center');
        teaching.grid({
          x: 390,
          y: 675,
          width: 1140,
          height: 116,
          rows: 1,
          columns: 7,
          labels: [['v₁', 'v₂', 'v₃', '…', 'q₁', 'q₂', '…']],
          fill: C.panel,
          stroke: C.muted,
          textColor: C.ink,
          fontSize: 38,
          highlights: [0, 1, 2, 4, 5].map((column) => ({
            row: 0,
            column,
            fill: C.panel,
            stroke: column < 3 ? C.blue : C.yellow,
          })),
        });
      });
    }
    api.text(
      ctx,
      'Hold the connector, question and number of views fixed.',
      960,
      935,
      36,
      C.muted,
      'center',
    );
    return;
  }
  const changed = cue(state, 'closing-second-key', 1, 0.28, 0.62);
  const solved = cue(state, 'closing-name-line', 2, 0.05, 0.36) >= 1;
  focus.target('closing-chart-evidence', () =>
    trendPlot(ctx, api, { readings: true, title: 'Service response time (ms) in both exports' }),
  );
  focus.target('closing-keys', () => {
    api.text(ctx, 'Legend', 1155, 330, 30, C.muted);
    api.text(ctx, 'First', 1450, 330, 33, C.ink, 'center');
    api.text(ctx, 'Second', 1700, 330, 33, C.ink, 'center');
    DASHBOARD.series.forEach(({ tone }, i) => {
      const y = 445 + i * 130;
      api.line(ctx, 1160, y, 1275, y, C[tone], 9);
      api.text(ctx, originalKey[i], 1450, y + 14, 42, C[tone], 'center');
      const present = changed > 0 && changed * 3 >= i + 0.5;
      api.text(
        ctx,
        present ? secondKey[i] : '·',
        1700,
        y + 14,
        42,
        present ? C[tone] : C.muted,
        'center',
      );
    });
  });
  focus.target('closing-answer-evidence', () => {
    api.text(
      ctx,
      solved
        ? `First: ${originalKey[risingRow]}     Second: ${secondKey[risingRow]}`
        : 'Which service slowed down in the second export?',
      960,
      905,
      51,
      solved ? C.green : C.yellow,
      'center',
    );
    if (solved)
      api.text(
        ctx,
        'Check each answer against the legend in its own source.',
        960,
        978,
        32,
        C.ink,
        'center',
      );
  });
}
export default {
  id: 'closing',
  draw: drawClosing,
  cues: ['closing-beat-1-focus-2', 'closing-read-trace', 'closing-second-key', 'closing-name-line'],
};
