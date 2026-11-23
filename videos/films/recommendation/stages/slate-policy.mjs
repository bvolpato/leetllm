import { ranked } from '../construction.mjs';
import { judgedListState, sourceSlate } from '../model.mjs';
import { cueProgress } from '../defaults.mjs';
import { drawReserve, drawSlots } from '../slate-board.mjs';

const original = ranked.slice(0, 3);
const capped = sourceSlate().selected.map((id) => ranked.find((d) => d.id === id));
const before = judgedListState(original.map((d) => d.id));
const after = judgedListState(capped.map((d) => d.id));
export function paintSlatePolicy(ctx, scene, state, api) {
  const { C } = api;
  const open = cueProgress(state, api, 'slate-open', 1, 0.12, 0.3);
  const q = cueProgress(state, api, 'slate-exchange', 2, 0.01, 0.21);
  const choice = cueProgress(state, api, 'slate-choice', 1, 0.64, 0.95) > 0;
  const showCost = cueProgress(state, api, 'slate-cost', 2, 0.58, 0.84) > 0;
  drawReserve(ctx, api, { target: 'slate-reserve' });
  const entries = original.map((page) => ({ page }));
  entries[2] = q > 0 ? { page: capped[2], opacity: q } : { page: original[2], opacity: 1 - open };
  drawSlots(ctx, api, {
    title: open === 0 ? 'Top three by score' : 'Applying the source cap',
    entries,
    platformUsed: open > 0 ? 2 : undefined,
    target: 'slate-slots',
    thirdTarget: 'slate-third',
    question: choice && q === 0 ? 'Which page can fill this slot?' : '',
  });
  api.focus.target('slate-metric', () => {
    if (q > 0 && !showCost) {
      api.text(
        ctx,
        'Slot 3 grade   ' + before.grades[2] + ' → ' + after.grades[2],
        120,
        970,
        37,
        C.ink,
      );
    } else if (showCost) {
      const loss = before.dcg - after.dcg;
      api.text(ctx, 'Slot 3 lost   3 / log₂(4) = ' + loss.toFixed(1) + ' DCG', 120, 973, 38, C.ink);
      api.text(
        ctx,
        'System NDCG   ' + before.system.toFixed(3) + ' → ' + after.system.toFixed(3),
        1072,
        973,
        38,
        C.yellow,
      );
    } else {
      api.text(
        ctx,
        'Before the cap   ·   system NDCG ' + before.system.toFixed(3),
        120,
        973,
        38,
        C.ink,
      );
    }
  });
}
export default {
  id: 'slate-policy',
  draw: paintSlatePolicy,
  cues: ['slate-source', 'slate-open', 'slate-choice', 'slate-exchange', 'slate-cost'],
};
