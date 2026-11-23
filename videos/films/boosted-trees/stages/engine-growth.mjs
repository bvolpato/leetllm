import { boostCue } from '../construction.mjs';
import { arrow, cellText, dot, footer, heading, line, outlineBox } from '../defaults.mjs';
export function drawEngineGrowth(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const cueProgress = (id, beat = currentBeat) => boostCue(state, id, beat);
  const S = (id, beat = currentBeat) =>
    state.cues?.[id]
      ? state.cues[id].phase !== 'before'
      : (state.beat ?? 0) > beat || ((state.beat ?? 0) === beat && progress > 0.15);
  api.focus.target('engine-growth-model', () => {
    if (currentBeat === 0) {
      heading(ctx, api, 'The same eligible frontier can produce different next splits');
      const nodes = [
        {
          x: 800,
          y: 380,
        },
        {
          x: 550,
          y: 520,
        },
        {
          x: 1050,
          y: 520,
        },
        {
          x: 1250,
          y: 660,
        },
      ];
      [
        [0, 1],
        [0, 2],
        [2, 3],
      ].forEach(([i, j]) =>
        line(ctx, api, nodes[i].x, nodes[i].y, nodes[j].x, nodes[j].y, themeColors.muted, 3),
      );
      nodes.forEach((n) => dot(ctx, api, n.x, n.y, themeColors.muted, 13));
      outlineBox(ctx, api, 420, 580, 300, 95, themeColors.blue);
      outlineBox(ctx, api, 1110, 710, 300, 95, themeColors.pink);
      cellText(ctx, api, 'A · depth 2 · gain .4', 570, 630, themeColors.blue, 25);
      cellText(ctx, api, 'B · depth 3 · gain .9', 1260, 760, themeColors.pink, 25);
      if (S('growth-frontier', 0)) {
        arrow(ctx, api, 310, 855, 500, 700, themeColors.blue, 5);
        cellText(ctx, api, 'depthwise → A', 410, 930, themeColors.blue, 29);
      }
      if (S('growth-best', 0)) {
        arrow(ctx, api, 1580, 855, 1360, 825, themeColors.pink, 5);
        cellText(ctx, api, 'highest gain → B', 1470, 930, themeColors.pink, 29);
      }
      footer(
        ctx,
        api,
        'The depth limit sets eligibility. The growth policy picks the next eligible leaf.',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Split candidates and the growth frontier are separate choices');
      ['exact', 'approx', 'hist'].forEach((s, j) => {
        const x = 360 + j * 590;
        cellText(
          ctx,
          api,
          s,
          x,
          380,
          [themeColors.blue, themeColors.pink, themeColors.cyan][j],
          34,
        );
        line(ctx, api, x - 180, 650, x + 180, 650, themeColors.muted, 2);
        [1, 2, 3, 4].forEach((r, i) => {
          const xx = x - 140 + i * 90;
          dot(ctx, api, xx, 650, themeColors.ink, 13);
          if (i < 3 && (j === 0 || i !== 1))
            line(
              ctx,
              api,
              xx + 45,
              530,
              xx + 45,
              740,
              [themeColors.blue, themeColors.pink, themeColors.cyan][j],
              3,
            );
        });
        cellText(
          ctx,
          api,
          j === 0
            ? 'sorted candidates'
            : j === 1
              ? 'Hessian sketch / tree'
              : 'global weighted sketch',
          x,
          840,
          themeColors.ink,
          25,
        );
      });
      footer(
        ctx,
        api,
        'Schematic bin boundaries · LightGBM uses leafwise gain selection with explicit capacity and support limits.',
      );
    } else {
      heading(ctx, api, 'Shared predicates turn the path into a leaf-table index');
      const bits = [1, 0, 1],
        n = Math.floor(cueProgress('growth-bits', 2) * 3 + 1e-8),
        pred = ['x₁ > a', 'x₂ > b', 'x₁ > c'];
      for (let depth = 0; depth < 3; depth++) {
        const count = 2 ** depth,
          yy = 400 + depth * 145;
        cellText(ctx, api, pred[depth], 260, yy + 10, themeColors.cyan, 27);
        for (let i = 0; i < count; i++) {
          const xx = 520 + ((i + 0.5) * 1050) / count;
          dot(ctx, api, xx, yy, themeColors.cyan, 15);
          if (depth < 2)
            [0, 1].forEach((k) =>
              line(
                ctx,
                api,
                xx,
                yy + 20,
                520 + ((2 * i + k + 0.5) * 1050) / (count * 2),
                yy + 120,
                themeColors.muted,
                2,
              ),
            );
        }
      }
      for (let i = 0; i < 8; i++) {
        const xx = 520 + ((i + 0.5) * 1050) / 8;
        outlineBox(
          ctx,
          api,
          xx - 43,
          845,
          86,
          75,
          n === 3 && i === 5 ? themeColors.yellow : themeColors.muted,
        );
        cellText(
          ctx,
          api,
          i,
          xx,
          895,
          n === 3 && i === 5 ? themeColors.yellow : themeColors.muted,
          27,
        );
      }
      cellText(
        ctx,
        api,
        'example bits: ' + bits.map((v, i) => (i < n ? v : '?')).join(''),
        960,
        985,
        themeColors.yellow,
      );
      footer(ctx, api, 'One shared predicate per level. Three bits index eight leaves.');
    }
  });
}
export default {
  id: 'engine-growth',
  draw: drawEngineGrowth,
  cues: [
    'engine-growth-step-1',
    'growth-frontier',
    'growth-best',
    'engine-growth-step-2',
    'engine-growth-step-3',
    'growth-bits',
  ],
};
