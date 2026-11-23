import { gradientFixture, keepMask, sum } from '../arithmetic.mjs';
import { afterCue, cueMotion } from '../construction.mjs';
import { scores, values } from '../fixtures.mjs';
import { drawExtensionCell, drawExtensionFooter, drawExtensionVector } from '../defaults.mjs';

export function drawGradientWorked(ctx, scene, state, api) {
  const { C, focus, teaching } = api;
  const label = (value, x, y, size, color = C.ink, align = 'center') =>
    api.text(ctx, value, x, y, size, color, align);
  const mechanism = 'fa-gradient-worked-mechanism';
  return focus.target(mechanism, () => {
    if (state.beat === 2) {
      label(
        'PyTorch 2.13 CPU  ·  math backend  ·  float64  ·  dropout off',
        960,
        265,
        36,
        C.yellow,
      );
      const matched = afterCue(state, 2, 'fa-gradient-worked-2');
      for (const [i, [rows, columns]] of [
        [2, 5],
        [5, 2],
        [4, 4],
      ].entries()) {
        const x = 190 + i * 560;
        const mask = keepMask(rows, columns, 'right');
        label(`${rows} queries × ${columns} keys`, x + 220, 365, 34, C.blue);
        teaching.grid({
          x,
          y: 405,
          width: 440,
          height: 320,
          rows,
          columns,
          labels: mask.map((row) => row.map((allowed) => (allowed ? '•' : '×'))),
          highlights: mask.flatMap((keys, row) =>
            keys.flatMap((allowed, column) =>
              allowed ? [{ row, column, fill: C.cyan + '55', stroke: C.cyan }] : [],
            ),
          ),
          fontSize: 36,
          textColor: C.ink,
          fill: C.panel,
          stroke: C.muted,
        });
        const empty = mask.filter((row) => !row.some(Boolean)).length;
        if (empty) label(`First ${empty} outputs = 0`, x + 220, 801, 34, C.yellow);
        if (matched) label('O, dQ, dK, dV match', x + 220, 909, 35, C.green);
      }
      drawExtensionFooter(ctx, api, 'Absolute and relative tolerances: 10⁻¹²');
      return;
    }

    const g = gradientFixture();
    const left = 300,
      width = 1360,
      cell = width / scores.length;
    const vector = (name, entries, y, color) => {
      label(name, left - 25, y + 47, 34, color, 'right');
      drawExtensionVector(ctx, api, entries, left, y, width, 70, color);
    };
    label(
      'Q = 1     ·     head width = 1     ·     output gradient G = [1, −1]',
      960,
      245,
      38,
      C.yellow,
    );
    vector('Key', scores, 285, C.blue);
    const second = cueMotion(state, 0, 'fa-gradient-worked-0') > 0;
    const third = cueMotion(state, 0, 'gradient-third-key') > 0;
    const all = afterCue(state, 0, 'fa-gradient-dp');
    focus.target('gradient-values', () => {
      label('Value', left - 25, 432, 34, C.ink, 'right');
      values.forEach((value, i) => {
        const active = !all && ((second && !third && i === 1) || (third && i === 2));
        drawExtensionCell(
          ctx,
          api,
          '[' + value.join(', ') + ']',
          left + i * cell,
          385,
          cell - 8,
          70,
          active ? C.yellow : C.ink,
        );
      });
    });
    vector(
      'P',
      g.p.map((p) => p.toFixed(4)),
      485,
      C.cyan,
    );
    vector(
      'dP',
      g.dP.map((dp, i) => {
        if (all) return dp;
        if (i === 1 && afterCue(state, 0, 'gradient-second-key'))
          return `${values[i][0]} − ${values[i][1]} = ${dp}`;
        if (i === 2 && afterCue(state, 0, 'gradient-third-key'))
          return `${values[i][0]} − ${values[i][1]} = ${dp}`;
        return '·';
      }),
      585,
      C.pink,
    );
    const scalar = afterCue(state, 0, 'fa-gradient-scalar');
    label(scalar ? 'D = Σ(P × dP) ≈ ' + g.D.toFixed(4) : 'D = Σ(P × dP)', 960, 743, 42, C.yellow);
    if (state.beat === 0) return;
    const n = Math.floor(4 * cueMotion(state, 1, 'fa-gradient-worked-1'));
    vector(
      'dS',
      g.dS.map((v, i) => (i < n ? v.toFixed(4) : '·')),
      796,
      C.green,
    );
    if (afterCue(state, 1, 'fa-gradient-zero')) {
      const total = Number(sum(g.dS).toFixed(4));
      label(`Σ dS = ${total}`, 640, 966, 41, C.green);
    }
    if (afterCue(state, 1, 'gradient-query-sum')) {
      label(`dQ = Σ(dS × K) ≈ ${g.dQ.toFixed(4)}`, 1230, 966, 41, C.green);
    }
  });
}

export default {
  id: 'gradient-worked',
  draw: drawGradientWorked,
  cues: [
    'fa-gradient-worked-0',
    'gradient-second-key',
    'gradient-third-key',
    'fa-gradient-dp',
    'fa-gradient-scalar',
    'fa-gradient-worked-1',
    'fa-gradient-zero',
    'gradient-query-sum',
    'fa-gradient-worked-2',
  ],
};
