import { clauseEnded, tile } from '../cache-picture.mjs';
import { splitExample } from '../model.mjs';

export function drawMergeRecurrence(ctx, scene, state, api) {
  const { C } = api;
  const reset = clauseEnded(state, 'recurrence-original', 0, 0.16);
  const { totals, b, result } = splitExample(reset ? 0 : Math.log(3));
  const shift = Math.max(...b);
  const relative = b.map((stat) => 2 ** (stat - shift));
  const sum = relative[0] + relative[1];
  const scaled = clauseEnded(state, 'recurrence-shift', 1, 0.5);
  const normalized = clauseEnded(state, 'recurrence-shares', 1, 0.87);
  const retained = clauseEnded(state, 'recurrence-parent', 2, 0.55);
  api.focus.target('recurrence-states', () => {
    api.text(
      ctx,
      reset
        ? 'Same query and head  /  six zero scores'
        : 'Same query and head  /  score of k5 = ln(3)',
      130,
      265,
      38,
      C.ink,
    );
    api.text(ctx, 'Worker', 142, 371, 32, C.muted);
    api.text(ctx, 'Output', 471, 371, 32, C.muted, 'center');
    api.text(ctx, 'b = log₂(mass)', 850, 371, 32, C.muted, 'center');
    api.text(ctx, '2 raised to b − m', 1270, 371, 32, C.muted, 'center');
    api.text(ctx, 'Share', 1630, 371, 32, C.muted, 'center');
    totals.forEach((mass, i) => {
      const y = 412 + i * 123,
        color = i === 0 ? C.blue : C.cyan;
      api.text(ctx, i === 0 ? 'A' : 'B', 165, y + 60, 48, color);
      tile(api, i === 0 ? '[1, 0]' : '[0, 1]', 342, y, 258, 88, color);
      tile(api, `log₂(${Math.round(mass)}) = ${Math.round(b[i])}`, 657, y, 386, 88, color);
      if (scaled)
        tile(api, `2^(${b[i]} − ${shift}) = ${relative[i]}`, 1080, y, 382, 88, color, C.ink, 32);
      if (normalized) tile(api, `${relative[i]}/${sum}`, 1486, y, 286, 88, color);
    });
    if (scaled) api.text(ctx, `Common shift   m = ${shift}`, 960, 724, 39, C.yellow, 'center');
    if (normalized)
      api.text(
        ctx,
        `Output  [${result.output.map((v) => v.toFixed(4)).join(', ')}]`,
        960,
        821,
        45,
        C.ink,
        'center',
      );
    if (retained)
      api.text(
        ctx,
        `Parent b  =  ${shift} + log₂(${sum})  ≈  ${result.b.toFixed(3)}`,
        960,
        934,
        48,
        C.yellow,
        'center',
      );
  });
}
export default {
  id: 'merge-recurrence',
  draw: drawMergeRecurrence,
  cues: ['recurrence-original', 'recurrence-shift', 'recurrence-shares', 'recurrence-parent'],
};
