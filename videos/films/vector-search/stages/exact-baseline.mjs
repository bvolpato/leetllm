import { cueProgress } from '../construction.mjs';
import { QUERY } from '../fixtures.mjs';
import { exact } from '../model.mjs';
import { neighborhood, passage, score } from '../neighborhood.mjs';
import { text } from '../defaults.mjs';

export default {
  id: 'exact-baseline',
  cues: ['measure-b', 'measure-c', 'measure-a', 'score-a', 'scan-rest', 'exact-receipt'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const a = cueProgress(state, 'measure-a'), rest = cueProgress(state, 'scan-rest');
    const scoredA = state.cues?.['score-a']?.phase === 'after';
    const links = ['B', 'C', 'A'].map((id) => [id, cueProgress(state, 'measure-' + id.toLowerCase())]);
    api.focus.target('passage-map', () => neighborhood(ctx, api, {
      links, guides: a > 0, selected: rest === 1 ? exact().map((p) => p.id) : [],
    }));
    api.focus.target('distance-scores', () => {
      text(ctx, api, 'Squared distance to query', 1230, 274, 36, C.ink);
      const rows = exact(undefined, 6);
      rows.forEach((p, i) => {
        const visible = p.id === 'A' ? scoredA
          : links.find(([id]) => id === p.id)?.[1] > 0 || (i >= 3 && rest > (i - 3) / 3);
        const y = 385 + 82 * i;
        if (!visible) return;
        text(ctx, api, p.id, 1270, y, 42, C.ink);
        text(ctx, api, score(p), 1720, y, 42, rest === 1 && i < 2 ? C.green : C.ink, 'right');
        api.line(ctx, 1350, y - 14, 1480, y - 14, C.muted, 2);
      });
    });
    api.focus.target('exact-receipt', () => {
      const b = passage('B');
      let footer = 'Query  (' + QUERY.x + ', ' + QUERY.y.toFixed(1) + ')';
      if (links[0][1] > 0) footer = 'B     (' + b.x + ' − ' + QUERY.x + ')² + 0² = ' + score(b);
      if (links[1][1] > 0) footer = 'C     (−1.1)² + (−0.2)² = ' + score(passage('C'));
      if (a > 0) footer = 'A     (−0.2)² + 0.2² = ' + (scoredA ? score(passage('A')) : '?');
      if (cueProgress(state, 'exact-receipt') > 0)
        footer = 'Exact top two     ' + exact().map((p) => p.id + '   ' + score(p)).join('        ');
      text(ctx, api, footer, 960, 968, 44, C.yellow, 'center');
    });
  },
};
