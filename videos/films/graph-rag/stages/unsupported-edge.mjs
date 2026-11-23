import { EDGES, RECORDS } from '../fixtures.mjs';
import { entails } from '../model.mjs';
import { card, connector, line, text } from '../defaults.mjs';

const id = 'unsupported-edge';
export function drawUnsupportedEdge(ctx, scene, state, api) {
  const { C } = api;
  const cue = (name) => state.cues?.[id + '-' + name];
  const candidate = cue('candidate')?.progress ?? 0;
  const verdict = cue('ownership')?.phase === 'after';
  const checked = cue('authorship')?.phase === 'after';
  api.focus.target(id + '-source', () => {
    text(ctx, api, id, 'A   /   Revision 1', 145, 286, 33, C.blue);
    text(ctx, api, id, RECORDS.author.text, 145, 391, 65, C.ink);
    line(ctx, api, 145, 430, 1775, 430, C.blue, 3);
  });
  // Both candidates resolve to the same record and endpoints. Review each predicate separately.
  const rows = candidate > 0 ? [EDGES[0], { ...EDGES[0], relation: 'owns' }] : [EDGES[0]];
  rows.forEach((edge, i) => {
    const y = 546 + i * 165;
    const decided = i === 0 ? checked : verdict;
    const color = decided ? (entails(edge) ? C.green : C.pink) : C.ink;
    api.focus.target(id + '-comparison', () => {
      text(ctx, api, id, 'Lena', 155, y + 39, 42, C.ink);
      text(ctx, api, id, edge.relation, 485, y - 8, 35, color, 'center');
      connector(ctx, api, 338, y + 28, 638, y + 28, i ? candidate : 1, color);
      text(ctx, api, id, 'River Walk', 680, y + 39, 42, C.ink);
      card(ctx, api, id, 'A  ·  revision 1', 1030, y - 10, 330, 82, C.blue, 32);
      text(
        ctx,
        api,
        id,
        decided ? (entails(edge) ? 'Keep' : 'Withhold') : 'Pending',
        1480,
        y + 39,
        39,
        decided ? color : C.muted,
      );
    });
  });
  if (candidate > 0)
    text(
      ctx,
      api,
      id,
      verdict
        ? 'Authorship has evidence. Ownership needs its own source.'
        : 'Which claim can we keep?',
      960,
      955,
      40,
      verdict ? C.ink : C.yellow,
      'center',
    );
}
export default {
  id,
  draw: drawUnsupportedEdge,
  cues: ['source', 'candidate', 'decide', 'authorship', 'ownership'].map((name) => id + '-' + name),
};
