import { sampleModel } from '../model.mjs';
import { drawOriginalCard, drawOriginalEquation, drawOriginalText } from '../defaults.mjs';
export function drawReuse(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('reuse', state),
    currentBeat = modelState.step;
  {
    const weights = api.focus.target('reuse-same-86-mib-weights-w', () =>
      drawOriginalCard(ctx, api, 'Same 86 MiB weights W', 680, 285, 560, themeColors.yellow),
    );
    const active = Math.min(5, Math.floor(6 * modelState.q));
    const input = api.focus.target('reuse-grid-reuse', () =>
      teaching.grid({
        x: 170,
        y: 470,
        width: 520,
        height: 285,
        rows: 6,
        columns: 4,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        highlights: Array.from(
          {
            length: 4,
          },
          (_, column) => ({
            row: active,
            column,
            fill: '#79aaff30',
            stroke: themeColors.yellow,
          }),
        ),
      }),
    );
    const output = api.focus.target('reuse-grid-reuse-2', () =>
      teaching.grid({
        x: 1230,
        y: 470,
        width: 520,
        height: 285,
        rows: 6,
        columns: 6,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        highlights: Array.from(
          {
            length: 6,
          },
          (_, column) => ({
            row: active,
            column,
            fill: '#63deec30',
            stroke: themeColors.yellow,
          }),
        ),
      }),
    );
    const resident = api.focus.target('reuse-resident-w-tile', () =>
      drawOriginalCard(ctx, api, 'Resident W tile', 800, 535, 320, themeColors.yellow),
    );
    api.connect(ctx, weights, resident, {
      color: themeColors.yellow,
      gap: 15,
    });
    const y = 470 + ((active + 0.5) * 285) / 6;
    api.path(
      ctx,
      [
        {
          x: 705,
          y,
        },
        {
          x: 760,
          y,
        },
        {
          x: 760,
          y: 580,
        },
        {
          x: 785,
          y: 580,
        },
      ],
      {
        color: themeColors.blue,
        width: 3,
      },
    );
    api.path(
      ctx,
      [
        {
          x: 1135,
          y: 580,
        },
        {
          x: 1180,
          y: 580,
        },
        {
          x: 1180,
          y,
        },
        {
          x: 1215,
          y,
        },
      ],
      {
        color: themeColors.cyan,
        width: 3,
      },
    );
    drawOriginalText(ctx, api, 'row ' + active, 120, y + 9, 23, themeColors.blue, 'right');
    drawOriginalText(ctx, api, 'same row ' + active, 1780, y + 9, 23, themeColors.cyan);
    drawOriginalText(
      ctx,
      api,
      'Six representative rows',
      430,
      435,
      26,
      themeColors.muted,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      `${modelState.rows.toLocaleString()} token rows`,
      430,
      825,
      36,
      themeColors.blue,
      'center',
    );
    drawOriginalText(
      ctx,
      api,
      `${modelState.intensity.toFixed(1)} FLOP / byte`,
      1490,
      825,
      36,
      themeColors.cyan,
      'center',
    );
    api.focus.target('reuse-math-f-2mknqquad-q-2-mk-kn-mn', () =>
      drawOriginalEquation(ctx, api, String.raw`F=2MKN\qquad Q=2(MK+KN+MN)`, 960, 935, 40),
    );
  }
}
export default {
  id: 'reuse',
  draw: drawReuse,
  cues: [
    'reuse-beat-1-focus-1',
    'reuse-beat-1-focus-2',
    'reuse-beat-2-focus-1',
    'reuse-beat-2-focus-2',
    'reuse-beat-3-focus-1',
    'reuse-beat-3-focus-2',
  ],
};
