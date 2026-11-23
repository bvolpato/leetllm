import { packedAttention } from '../arithmetic.mjs';
import { motion, spoken } from '../construction.mjs';
import { packingImplementationState } from '../model.mjs';
import { text, upgradeBox } from '../defaults.mjs';

function draw(ctx, scene, state, api) {
  api.focus.target('packing-implementation-mechanism', () => {
    const { C } = api;
    const v = packingImplementationState(state.beat, state.beatP, state.cues);
    const query = 4;
    const pos = (i) => 568 + i * 211;
    text(ctx, api, 'Synthetic values  /  CPU isolation test', 150, 233, 30, C.muted);
    text(ctx, api, 'Example A', pos(1), 300, 40, C.blue, 'center');
    text(ctx, api, 'Example B', pos(4), 300, 40, C.cyan, 'center');
    const join = (pos(2) + pos(3)) / 2;
    api.line(ctx, join, 322, join, 850, C.yellow, 3);
    text(ctx, api, 'Position', 150, 385, 30, C.muted);
    v.values.forEach((value, i) => {
      text(
        ctx,
        api,
        i === query ? 'Query ' + i : String(i),
        pos(i),
        385,
        32,
        i === query ? C.cyan : C.muted,
        'center',
      );
      upgradeBox(ctx, api, String(value), pos(i) - 82, 423, 164, 90, i < 3 ? C.blue : C.cyan, 43);
    });
    const intervened = state.beat >= 1 && motion(state, 'packing-actual-change', 1) > 0;
    const original = packingImplementationState(0, 0).values;
    for (const [lane, independent] of [
      [0, true],
      [1, false],
    ]) {
      const y = 622 + lane * 169;
      const beforeKnown = spoken(
        state,
        independent ? 'isolated-before' : 'global-before',
        0,
        independent ? 0.69 : 0.87,
      );
      const afterKnown = spoken(
        state,
        independent ? 'packing-implementation-b2' : 'global-result',
        2,
        independent ? 0.12 : 0.41,
      );
      const before = packedAttention(original, query, independent);
      const allowed = v.values.map((_, i) => i <= query && (!independent || i >= 3));
      const count = allowed.filter(Boolean).length;
      text(
        ctx,
        api,
        independent ? 'Isolated' : 'Global causal',
        150,
        y - 7,
        33,
        independent ? C.cyan : C.blue,
      );
      const answer = independent ? v.independent : v.global;
      text(ctx, api, 'Sum ÷ ' + count, 150, y + 46, 28, C.muted);
      const result = beforeKnown ? before.toFixed(1) : '?';
      text(
        ctx,
        api,
        intervened ? result + '  →  ' + (afterKnown ? answer.toFixed(1) : '?') : result,
        1548,
        y + 89,
        39,
        C.ink,
        'center',
      );
      v.values.forEach((value, i) => {
        if (allowed[i]) {
          api.line(ctx, pos(i) - 72, y + 25, pos(i) + 72, y + 25, independent ? C.cyan : C.blue, 5);
          text(ctx, api, String(value), pos(i), y + 4, 44, C.ink, 'center');
        } else text(ctx, api, '·', pos(i), y + 4, 34, C.muted, 'center');
      });
    }
    let note = 'Equal weight for each value the query can read';
    if (spoken(state, 'mean-increase', 2, 0.6)) {
      const count = query + 1;
      const sumChange = v.values
        .slice(0, count)
        .reduce((sum, value, i) => sum + value - original[i], 0);
      note = 'Global mean increases by   ' + sumChange + ' ÷ ' + count + ' = ' + sumChange / count;
    } else if (spoken(state, 'global-result', 2, 0.41)) {
      note = 'Only the global average changes';
    } else if (intervened) {
      note = 'Only A changes. Which average moves?';
    }
    text(ctx, api, note, 960, 979, 39, C.ink, 'center');
  });
}

export default {
  id: 'packing-implementation',
  draw: draw,
  cues: [
    'packing-implementation-b1',
    'isolated-before',
    'global-before',
    'packing-actual-change',
    'packing-implementation-b2',
    'global-result',
    'mean-increase',
    'packing-implementation-b3',
  ],
};
