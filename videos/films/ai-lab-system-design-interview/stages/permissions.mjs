import { namedSystemCue, spokenResult } from '../construction.mjs';
import { DOCS } from '../fixtures.mjs';
import { eligibleDocuments } from '../model.mjs';
import { card, text } from '../defaults.mjs';

const groups = ['employees'];
const ranked = [...DOCS].sort((a, b) => b.score - a.score);
const eligible = new Set(eligibleDocuments(ranked, groups).map((doc) => doc.id));

export function drawPermissions(ctx, scene, state, api) {
  const { C, focus } = api;
  const checks = ['permission-finance', 'permission-deleted', 'permission-allow'];
  const crossed = spokenResult(state, checks[2], 1, 0.76);
  focus.target('permission-gate', () => {
    text(ctx, api, 'Trusted index   /   Caller group · employees', 150, 279, 41, C.ink);
    api.line(ctx, 1180, 342, 1180, 844, C.yellow, 5);
    text(ctx, api, 'Check access', 1180, 326, 32, C.yellow, 'center');
  });
  focus.target('permission-path', () => {
    text(ctx, api, 'External reranker', 1740, 279, 38, C.cyan, 'right');
    api.line(ctx, 150, 887, 1750, 887, C.muted, 2);
    const sent = ranked.filter((doc) => crossed && eligible.has(doc.id));
    text(ctx, api, 'Citation receipt', 150, 959, 35, C.muted);
    text(
      ctx,
      api,
      sent.length ? 'Source ID    ' + sent[0].id : 'Awaiting eligible source',
      1750,
      959,
      39,
      sent.length ? C.cyan : C.muted,
      'right',
    );
  });
  focus.target('permission-docs', () => {
    ranked.forEach((doc, i) => {
      const progress = namedSystemCue(state, checks[i], 1, [0.1, 0.35, 0.66][i]);
      const decided = spokenResult(state, checks[i], 1, [0.22, 0.47, 0.78][i]);
      const allowed = eligible.has(doc.id);
      const x = 150 + (allowed ? 1180 : 590) * progress,
        y = 412 + i * 165;
      const evidence =
        'Score ' +
        doc.score.toFixed(2) +
        '   ·   ' +
        doc.groups.join(', ') +
        '   ·   ' +
        (doc.deleted ? 'deleted' : 'live');
      text(ctx, api, evidence, 150, y - 21, 31, C.ink);
      card(ctx, api, doc.id, x, y, 412, decided ? (allowed ? C.cyan : C.pink) : C.blue, 78, 32);
    });
  });
}
export default {
  id: 'permissions',
  draw: drawPermissions,
  cues: [
    'permission-scores',
    'permission-groups',
    'permission-finance',
    'permission-deleted',
    'permission-allow',
    'permission-proof',
    'permission-freshness',
  ],
};
