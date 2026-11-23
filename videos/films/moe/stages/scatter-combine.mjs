import { vec } from '../arithmetic.mjs';
import { spokenProgress } from '../construction.mjs';
import { moePacked } from '../model.mjs';
import { line, rect, text } from '../defaults.mjs';
import { assignmentTicket, packedX, rowY } from '../packed-rows.mjs';

export function drawScatterCombine(ctx, scene, state, api) {
  const { C } = api;
  const beat = state.beat ?? 0;
  const { packed, outputs } = moePacked();
  const doubles = spokenProgress(api, state, 'double-rows', 0);
  const negative = spokenProgress(api, state, 'negate-zero', 1);
  const prepare = spokenProgress(api, state, 'quarter-return', 2, 0.08, 0.6);
  const add = spokenProgress(api, state, 'add-zero', 3, 0.06, 0.36);
  const last = spokenProgress(api, state, 'last-return', 3, 0.56, 0.86);
  const steps = [
    api.clamp(2 * doubles, 0, 1),
    api.clamp(2 * doubles - 1, 0, 1),
    negative,
    0.62 * prepare + 0.38 * add,
    last,
  ];
  const sums = outputs.map((v) => v.map(() => 0));
  const zeroRows = packed.filter((row) => row.token === 0);

  text(ctx, api, 'Grouped by expert', packedX, 274, 43, C.ink);
  text(ctx, api, 'Return to token', 1295, 274, 43, C.ink);
  api.focus.target('packed-execution', () => {
    packed.forEach((row, i) => {
      assignmentTicket(ctx, api, row, packedX, rowY(i), row.token === 0);
      if (steps[i] === 1) row.contribution.forEach((value, j) => (sums[row.token][j] += value));
    });
  });
  api.focus.target('token-sums', () => {
    sums.forEach((v, t) => {
      const y = 359 + 168 * t;
      const color = t === 0 ? C.cyan : C.muted;
      rect(ctx, api, 1280, y, 512, 116, C.panel, color, 12);
      text(ctx, api, 't' + t, 1310, y + 74, 36, color, 'left', 'mono');
      text(ctx, api, vec(v), 1763, y + 74, 37, C.ink, 'right', 'mono');
    });
  });
  api.focus.target('weighted-return-path', () => {
    text(ctx, api, 'Weighted return', 938, 274, 33, C.muted, 'center');
    packed.forEach((row, i) => {
      const q = steps[i];
      if (q <= 0 || q >= 1) return;
      // Route the vector through the open aisle, then deliver it to its token's row.
      const x =
        q < 0.26
          ? api.lerp(755, 923, q / 0.26)
          : q <= 0.72
            ? 923
            : api.lerp(923, 1115, (q - 0.72) / 0.28);
      const y = api.lerp(rowY(i) + 40, 417 + 168 * row.token, api.phase(q, 0.26, 0.61));
      rect(ctx, api, x - 138, y - 31, 276, 62, C.cyan, undefined, 9);
      text(ctx, api, vec(row.contribution), x, y + 12, 30, C.bg, 'center', 'mono');
    });
  });
  let note = 'E0 doubles its input     E1 negates it     E2 halves it';
  if (beat === 1)
    note = 't0 via E1      ' + zeroRows[0].gate + ' × ' + vec(zeroRows[0].expertOutput);
  if (beat === 2)
    note =
      't0 via E2      ' +
      zeroRows[1].gate +
      ' × ' +
      vec(zeroRows[1].expertOutput) +
      '       What belongs in t0 now?';
  if (beat === 3) note = 'Five assignment rows return to three token positions';
  if (beat >= 4) {
    const ungated = zeroRows[0].expertOutput.map((_, j) =>
      zeroRows.reduce((n, row) => n + row.expertOutput[j], 0),
    );
    note =
      't0 with overwrite   ' +
      vec(zeroRows.at(-1).contribution) +
      '        t0 without gates   ' +
      vec(ungated);
  }
  line(ctx, api, 166, 903, 1790, 903, C.muted, 2);
  text(ctx, api, note, 960, 988, 37, beat === 2 ? C.yellow : C.ink, 'center');
}

export default {
  id: 'scatter-combine',
  draw: drawScatterCombine,
  cues: ['double-rows', 'negate-zero', 'quarter-return', 'add-zero', 'last-return', 'wrong-writes'],
};
