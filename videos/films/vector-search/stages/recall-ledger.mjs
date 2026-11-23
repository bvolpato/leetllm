import { cueProgress } from '../construction.mjs';
import { exact, probe, recall } from '../model.mjs';
import { score } from '../neighborhood.mjs';
import { text } from '../defaults.mjs';

export default {
  id: 'recall-ledger',
  cues: ['recall-ledger-b1-1', 'recall-ledger-b1-2', 'recall-ledger-b2-1', 'recall-ledger-b3-1'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const a = cueProgress(state, 'recall-ledger-b1-1'), b = cueProgress(state, 'recall-ledger-b2-1');
    const lists = b > 0 || state.beat === 2 ? 2 : 1;
    const { result, examined } = probe(lists);
    const reference = exact();
    const recovered = reference.filter((p) => result.some((r) => r.id === p.id));
    api.focus.target('exact-reference', () => {
      text(ctx, api, 'Exact top two', 320, 327, 43, C.ink);
      reference.forEach((p, i) => {
        const y = 508 + i * 173;
        text(ctx, api, p.id, 355, y, 65, C.ink);
        text(ctx, api, score(p), 558, y, 46, C.muted);
      });
    });
    api.focus.target('approximate-result', () => {
      text(ctx, api, lists === 1 ? 'One list open' : 'Two lists open', 1280, 327, 43, C.ink);
      result.forEach((p, i) => {
        const y = 508 + i * 173, match = recovered.some((r) => r.id === p.id);
        const progress = p.id === 'A' ? a : b;
        if (match && progress > 0) api.line(ctx, 735, y - 20, api.lerp(735, 1190, progress), y - 20, C.green, 5);
        text(ctx, api, p.id, 1300, y, 65, match && progress > 0 ? C.green : C.ink);
        text(ctx, api, score(p), 1505, y, 46, C.muted);
      });
    });
    api.focus.target('recall-calculation', () => {
      const revealed = cueProgress(state, 'recall-ledger-b1-2') > 0;
      const percentage = (100 * recall(result, reference)).toFixed(0);
      const label = revealed ? 'Recall@2     ' + recovered.length + ' / ' + reference.length + ' = ' + percentage + '%' : 'Recall@2     ? / ' + reference.length;
      text(ctx, api, label, 960, 883, 50, C.yellow, 'center');
      text(ctx, api, examined.length + ' passage distances scored', 960, 981, 35, C.muted, 'center');
    });
  },
};
