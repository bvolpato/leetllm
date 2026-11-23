import { cueProgress } from '../construction.mjs';
import { POINTS } from '../fixtures.mjs';
import { exact, probe, referenceChangeState } from '../model.mjs';
import { resultPair } from '../neighborhood.mjs';
import { text } from '../defaults.mjs';

export default {
  id: 'transfer',
  cues: ['transfer-b1-1', 'transfer-b2-1', 'transfer-filter-reference', 'transfer-delete-reference', 'transfer-b3-1'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    api.focus.target('indexing-routes', () => {
      if (state.beat === 0) {
        const searched = probe(1);
        const columns = [
          ['Exact scan', POINTS.map((p) => p.id).join('   '), exact()],
          ['Graph path', 'E   →   C   →   A', exact(['E', 'C', 'A'].map((id) => POINTS.find((p) => p.id === id)))],
          ['Left list', searched.examined.map((p) => p.id).join('   '), searched.result],
        ];
        columns.forEach(([label, ids, pair], i) => {
          const x = 140 + i * 580;
          text(ctx, api, label, x, 348, 45, C.ink);
          text(ctx, api, ids, x, 485, 35, C.muted);
          resultPair(ctx, api, x, 648, 'Returned', pair.map((p) => p.id));
        });
        return;
      }
      const replay = state.beat === 2;
      const s = replay ? referenceChangeState({ ...state, beat: 1 }) : referenceChangeState(state);
      const expanded = replay && cueProgress(state, 'transfer-b3-1') > 0;
      text(ctx, api, 'Eligible passages', 135, 318, 39, C.ink);
      for (const [i, { id }] of POINTS.entries()) {
        const x = 575 + i * 205;
        const eligible = s.eligible.includes(id);
        api.circle(ctx, x, 304, 45, C.panel, eligible ? C.cyan : C.muted, 3);
        text(ctx, api, id, x, 319, 41, eligible ? C.ink : C.muted, 'center');
        if (!eligible) api.line(ctx, x - 38, 349, x + 38, 349, C.muted, 4);
      }
      resultPair(ctx, api, 290, 545, 'Exact eligible pair', s.reference, C.green);
      resultPair(ctx, api, 1090, 545, expanded ? 'Fresh eligible scan' : 'Saved pair after filtering', expanded ? s.reference : s.result, C.cyan, '–');
      const label = expanded ? 'E fills the slot vacated by A.' : s.stage === 'deleted' ? 'A has been deleted. The saved answer has one survivor.' :
        s.stage === 'filtered' ? 'B falls outside the filter. C now belongs in the reference.' : 'All six passages are eligible.';
      text(ctx, api, label, 960, 930, 38, C.yellow, 'center');
    });
  },
};
