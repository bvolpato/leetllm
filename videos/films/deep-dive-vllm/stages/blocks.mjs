import { r0 } from '../fixtures.mjs';
import { sampleModel } from '../construction.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawBlocks(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('blocks', state),
    currentBeat = modelState.b;
  const route = (a, z, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress: modelState.q,
      color,
      particle: {
        radius: 7,
        fill: color,
      },
      margin: 3,
    });
  {
    text(
      ctx,
      api,
      'R0 · “The little bird sat on the green branch”',
      960,
      285,
      37,
      themeColors.blue,
      'center',
    );
    api.focus.target('blocks-r0', () =>
      teaching.grid({
        x: 190,
        y: 390,
        width: 1520,
        height: 120,
        rows: 1,
        columns: 8,
        labels: [r0],
        cellFocusTarget: (_row, column) =>
          column === modelState.position
            ? 'blocks-selected-position'
            : column < 4
              ? 'blocks-first-block'
              : 'blocks-second-block',
        fontSize: 30,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: [
          {
            row: 0,
            column: modelState.position,
            fill: themeColors.panel,
            stroke: themeColors.yellow,
          },
        ],
      }),
    );
    [12, 41].forEach((slot, logical) =>
      api.focus.target('blocks-request-table', () =>
        card(
          ctx,
          api,
          'L' + logical + ' → physical ' + slot,
          400 + logical * 620,
          555,
          500,
          logical === modelState.logical ? themeColors.yellow : themeColors.blue,
          80,
        ),
      ),
    );
    const logical = api.focus.target('blocks-logical-block', () =>
        card(ctx, api, `Logical block ${modelState.logical}`, 250, 690, 600, themeColors.yellow),
      ),
      physical = api.focus.target('blocks-physical-slot-offset', () =>
        card(
          ctx,
          api,
          `Physical slot ${modelState.physical} · offset ${modelState.offset}`,
          1130,
          690,
          610,
          themeColors.cyan,
        ),
      );
    route(logical, physical);
    api.focus.target('blocks-address-calculation', () =>
      math(
        ctx,
        api,
        String.raw`j=${modelState.position}=4\cdot${modelState.logical}+${modelState.offset}`,
        960,
        900,
        52,
      ),
    );
  }
}
export default {
  id: 'blocks',
  draw: drawBlocks,
  cues: [
    'blocks-beat-1-focus-1',
    'blocks-beat-1-focus-2',
    'blocks-beat-2-focus-1',
    'blocks-beat-2-focus-2',
    'blocks-beat-3-focus-1',
    'blocks-beat-3-focus-2',
  ],
};
