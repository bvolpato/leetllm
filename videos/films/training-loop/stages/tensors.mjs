import { modelSnapshot } from '../construction.mjs';
import { card, equation, optionalFocusTarget, text } from '../defaults.mjs';
export function drawTensors(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const rows = [
      [101, '-2.0', '-1.2', 'standard'],
      [102, '-1.3', '-0.8', 'standard'],
      [103, '-0.8', '-1.4', 'standard'],
      [104, '0.9', '1.1', 'escalate'],
      [105, '1.4', '0.8', 'escalate'],
      [106, '1.8', '1.6', 'escalate'],
    ];
    const sample = modelSnapshot('tensors', state);
    const focus = sample.indices;
    text(ctx, api, 'Ticket ID', 320, 330, 28, themeColors.muted, 'center');
    text(ctx, api, 'Urgency', 650, 330, 28, themeColors.muted, 'center');
    text(ctx, api, 'Severity', 900, 330, 28, themeColors.muted, 'center');
    text(ctx, api, 'Target route', 1220, 330, 28, themeColors.muted, 'center');
    teaching.grid({
      x: 205,
      y: 365,
      width: 1120,
      height: 438,
      rows: 6,
      columns: 4,
      labels: rows,
      fill: themeColors.panel,
      stroke: '#4e607e',
      lineWidth: 2,
      fontSize: 29,
      textColor: themeColors.ink,
      padding: 4,
      highlights: focus.map((row) => ({
        row,
        column: 0,
        fill: row < 3 ? '#63deec40' : '#8cdeb540',
        stroke: row < 3 ? themeColors.cyan : themeColors.green,
      })),
    });
    optionalFocusTarget(ctx, api, 'tensors-object-sample-name-11', () =>
      card(
        ctx,
        api,
        sample.name,
        1380,
        325,
        360,
        72,
        focus[0] < 4 ? themeColors.cyan : themeColors.green,
        1,
        29,
      ),
    );
    teaching.grid({
      x: 1390,
      y: 440,
      width: 430,
      height: 70 * (focus.length + 1),
      rows: focus.length + 1,
      columns: 4,
      labels: [
        ['ID', 'X₁', 'X₂', 'y'],
        ...focus.map((i) => [
          rows[i][0],
          rows[i][1],
          rows[i][2],
          rows[i][3] === 'escalate' ? 1 : 0,
        ]),
      ],
      fill: themeColors.panel,
      stroke: focus[0] < 4 ? themeColors.cyan : themeColors.green,
      fontSize: 24,
      textColor: themeColors.ink,
      padding: 5,
    });
    optionalFocusTarget(ctx, api, 'tensors-object-feature-rows-targets-12', () =>
      text(
        ctx,
        api,
        `${sample.count} feature rows · ${sample.count} targets`,
        1605,
        845,
        25,
        themeColors.yellow,
        'center',
      ),
    );
    equation(
      ctx,
      api,
      String.raw`X\in\mathbb{R}^{6\times2},\qquad y\in\{0,1\}^{6}`,
      960,
      880,
      39,
      themeColors.yellow,
    );
  }
}
export default {
  id: 'tensors',
  draw: drawTensors,
  cues: ['tensors-beat-1-focus-1', 'tensors-beat-1-focus-2', 'tensors-beat-2-focus-1'],
};
