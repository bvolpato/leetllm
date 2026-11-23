import { JUDGE_ROWS } from '../fixtures.mjs';
import { after, decision } from '../circulation.mjs';

function order(ctx, api, y, name, ids, pick) {
  api.text(ctx, name, 160, y + 55, 31, api.C.muted);
  ids.forEach((id, i) => {
    const x = 430 + 157 * i;
    api.rect(ctx, x, y, 112, 82, api.C.panel, pick === id ? api.C.yellow : api.C.muted, 6);
    api.text(ctx, id, x + 56, y + 57, 43, id === 'A' ? api.C.blue : api.C.cyan, 'center');
    if (pick === id) api.line(ctx, x + 6, y + 98, x + 106, y + 98, api.C.yellow, 5);
  });
}

export default {
  id: 'judge-calibration',
  cues: [
    'human-labels',
    'forward-input',
    'forward-score',
    'swap-remap',
    'flip-score',
    'judge-screen',
    'judge-advisory',
    'critical-override',
    'judge-injection',
    'judge-boundary',
  ],
  draw(ctx, scene, state, api) {
    const { C, focus } = api;
    focus.target('judge-calibration-mechanism', () => {
      if (state.beat === 0) {
        const forward = focus.visible('forward-input') || focus.visible('forward-score');
        const swap = focus.visible('swap-remap');
        const correct = JUDGE_ROWS.filter((row) => row.forward === row.human).length;
        const flipped = JUDGE_ROWS.filter((row) => row.forward !== row.swap).length;
        api.text(ctx, 'Pair 2   ·   two replies', 160, 285, 40, C.ink, 'left', 'serif');
        api.text(ctx, 'First slot', 486, 385, 27, C.muted, 'center');
        api.text(ctx, 'Second slot', 643, 385, 27, C.muted, 'center');
        order(ctx, api, 423, 'Original order', ['A', 'B'], forward ? 'B' : null);
        if (swap) order(ctx, api, 588, 'Swapped order', ['B', 'A'], 'A');
        api.text(ctx, 'Human chose B', 160, 788, 34, C.ink);
        const columns = [930, 1115, 1355, 1610];
        ['Pair', 'Human', 'Original', 'Swapped'].forEach((v, i) =>
          api.text(ctx, v, columns[i], 337, 31, C.muted, 'center'),
        );
        JUDGE_ROWS.forEach((row, i) => {
          const y = 431 + i * 82;
          if (i === 1) api.line(ctx, 854, y + 13, 1698, y + 13, C.yellow, 2);
          [i + 1, row.human, forward ? row.forward : '·', swap ? row.swap : '·'].forEach(
            (value, j) =>
              api.text(
                ctx,
                value,
                columns[j],
                y,
                40,
                j === 3 && swap && row.swap !== row.forward ? C.yellow : C.ink,
                'center',
              ),
          );
        });
        if (after(state, 'forward-score'))
          api.text(
            ctx,
            'Accuracy: ' + correct + ' / 4 = ' + (correct / 4).toFixed(2),
            1010,
            805,
            35,
            C.green,
            'center',
          );
        if (after(state, 'flip-score'))
          api.text(
            ctx,
            'Order flips: ' + flipped + ' / 4 = ' + (flipped / 4).toFixed(2),
            1530,
            805,
            35,
            C.yellow,
            'center',
          );
        if (after(state, 'judge-screen'))
          decision(ctx, api, 'Accuracy ≥ 0.90   ·   flips ≤ 0.05   → ADVISORY', C.yellow);
      } else if (state.beat === 1) {
        api.text(ctx, 'Library host', 170, 325, 41, C.cyan);
        api.text(ctx, 'Private-account read', 170, 440, 44, C.ink);
        api.text(ctx, 'Denied', 170, 535, 55, C.pink);
        api.text(ctx, 'Message rubric', 1020, 325, 41, C.blue);
        api.text(ctx, 'Clear explanation', 1020, 440, 44, C.ink);
        api.text(ctx, '0.99', 1020, 535, 55, C.green);
        api.line(ctx, 930, 278, 930, 640, C.muted, 3);
        if (focus.visible('critical-override'))
          decision(ctx, api, 'The attempted access fails the library policy.', C.pink);
      } else {
        api.text(ctx, 'Assistant’s final message', 160, 315, 37, C.cyan);
        api.text(
          ctx,
          '“I told Lena where to find the hold.”',
          160,
          430,
          54,
          C.ink,
          'left',
          'serif',
        );
        api.line(ctx, 160, 510, 1700, 510, C.muted, 2);
        if (focus.visible('judge-injection')) {
          api.text(ctx, 'Input to the communication rubric', 160, 610, 34, C.muted);
          api.text(ctx, 'Quoted message from the candidate', 160, 699, 44, C.blue);
        }
        if (focus.visible('judge-boundary'))
          decision(ctx, api, 'Judge the wording. Send sensitive cases to a human reviewer.');
      }
    });
  },
};
