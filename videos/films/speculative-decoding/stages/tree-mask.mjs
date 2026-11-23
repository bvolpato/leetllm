import { visibility } from '../arithmetic.mjs';
import { completedCue } from '../construction.mjs';
import {
  drawConstructionsBox,
  drawConstructionsCenter,
  drawConstructionsText,
} from '../defaults.mjs';
export function drawTreeMask(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    done = (beat, cue) => currentBeat > beat || (currentBeat === beat && completedCue(state, cue));
  api.focus.target('sd-tree-mask-mechanism', () => {
    const nodes = [
      {
        x: 360,
        y: 425,
        parent: null,
      },
      {
        x: 810,
        y: 425,
        parent: null,
      },
      {
        x: 360,
        y: 700,
        parent: 0,
      },
      {
        x: 810,
        y: 700,
        parent: 1,
      },
    ];
    drawConstructionsCenter(
      ctx,
      api,
      'Candidate-only forest · committed prefix columns stay visible',
      245,
    );
    nodes.forEach((n, i) => {
      if (n.parent !== null)
        api.arrow(ctx, n.x, nodes[n.parent].y + 75, n.x, n.y - 60, themeColors.blue, 4);
      drawConstructionsBox(ctx, api, 'node ' + i, n.x - 135, n.y - 40, 270, themeColors.blue);
      if (currentBeat === 2 && done(2, 'sd-tree-position'))
        drawConstructionsText(
          ctx,
          api,
          'position ' + (n.parent === null ? 10 : 11),
          n.x + 170,
          n.y + 100,
          28,
          themeColors.yellow,
          'center',
        );
    });
    if (currentBeat > 0) {
      const masks = [0, 1, 2, 3].map((q) =>
        visibility([null, null, 0, 1], q).map((v) => String(v)),
      );
      teaching.grid({
        x: 1160,
        y: 405,
        width: 550,
        height: 400,
        rows: 4,
        columns: 4,
        labels: masks,
        fontSize: 31,
        fill: themeColors.panel,
        stroke: themeColors.muted,
        textColor: themeColors.ink,
        highlights: masks.flatMap((r, ri) =>
          r.flatMap((v, ci) =>
            v === '1'
              ? [
                  {
                    row: ri,
                    column: ci,
                    fill: themeColors.panel,
                    stroke: themeColors.cyan,
                  },
                ]
              : [],
          ),
        ),
      });
      drawConstructionsText(
        ctx,
        api,
        'rows=query · columns=key',
        1435,
        875,
        27,
        themeColors.muted,
        'center',
      );
    }
    drawConstructionsCenter(
      ctx,
      api,
      currentBeat === 2
        ? 'Equal depth shares a position; flattened index does not define position'
        : 'Each query sees its own ancestors and itself',
      1010,
      themeColors.yellow,
      31,
    );
  });
  return;
}
export default {
  id: 'tree-mask',
  draw: drawTreeMask,
  cues: [
    'sd-tree-mask-b0',
    'sd-tree-mask-b1',
    'sd-tree-row2',
    'sd-tree-row3',
    'sd-tree-mask-b2',
    'sd-tree-position',
  ],
};
