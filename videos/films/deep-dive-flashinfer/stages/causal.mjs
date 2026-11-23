import { bracket, cachePicture, clauseEnded } from '../cache-picture.mjs';
import { requests } from '../fixtures.mjs';
import { flashCue } from '../construction.mjs';

export function drawCausal(ctx, scene, state, api) {
  const { C } = api;
  const request = requests[2];
  const length = 4 * (request.pages.length - 1) + request.tail;
  const first = length - request.q;
  const moves = ['causal-one', 'causal-two', 'causal-three'];
  const row = moves.filter((id, i) => clauseEnded(state, id, 2, [0.22, 0.49, 0.78][i])).length;
  const revealed = clauseEnded(state, 'causal-stop', 1, 0.25);
  const position = first + row;
  const sweep = flashCue(state, 'causal-read', 1, [0.31, 0.7]);
  const read = revealed ? Math.floor(sweep * (position + 1)) : 0;

  api.focus.target('causal-history', () => {
    api.text(ctx, 'R2  /  nine keys in memory', 130, 269, 40, C.ink);
    const bank = cachePicture(ctx, api, {
      pages: request.pages,
      pageSize: 4,
      length,
      style: (j) => {
        if (!revealed || j >= length) return {};
        if (j < read) return { color: C.cyan, ink: C.cyan };
        return j > position ? { color: C.muted, ink: C.muted } : {};
      },
    });
    for (let i = 0; i < request.q; i++) {
      const x = bank.slot(first + i) + bank.slotWidth / 2;
      api.text(ctx, `q${i}`, x, 626, 37, i === row ? C.yellow : C.muted, 'center');
      if (i === row) api.line(ctx, x, 573, x, 520, C.yellow, 5);
    }
    api.text(ctx, 'New queries', 130, 626, 33, C.yellow);
    if (read > 0) {
      const end = bank.slot(read - 1) + bank.slotWidth;
      bracket(ctx, api, bank.slot(0), end, 770, C.cyan);
      api.text(
        ctx,
        `${read} ${read === 1 ? 'key' : 'keys'} ${sweep < 1 ? 'counted' : 'in reach'}`,
        (bank.slot(0) + end) / 2,
        835,
        37,
        C.cyan,
        'center',
      );
    }
    const label = !revealed
      ? 'At q0, which key is the last one this query may read?'
      : `q${row} is at position ${position}   ·   last allowed key  k${position}`;
    api.text(ctx, label, 960, 950, 44, C.yellow, 'center');
  });
}
export default {
  id: 'causal',
  draw: drawCausal,
  cues: ['causal-query', 'causal-stop', 'causal-read', 'causal-one', 'causal-two', 'causal-three'],
};
