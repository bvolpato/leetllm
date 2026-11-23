import { ranked } from '../construction.mjs';
import { SHORT } from '../fixtures.mjs';
import { sourceIdentity } from '../arithmetic.mjs';
import { judgedListState, permissionTransfer, sourceSlate } from '../model.mjs';
import { cueProgress } from '../defaults.mjs';
import { drawReserve, drawSlots } from '../slate-board.mjs';

const first = permissionTransfer();
const alternative = sourceSlate({ revoked: ['blog-post'] });
const alternativeReport = judgedListState(alternative.selected, { revoked: ['blog-post'] });
const entriesFor = (ids, progress = 1) =>
  ids.map((id, i) => ({
    page: ranked.find((d) => d.id === id),
    opacity: Math.max(0, Math.min(1, progress * ids.length - i)),
  }));

function reportLine(ctx, api, version, report, x, showResult, compareThird = false) {
  const { C } = api;
  const third = report.rows[2];
  const detail = compareThird
    ? 'slot 3: ' + SHORT[third.id] + ' (grade ' + third.relevance + ')'
    : 'ideal grades   ' + report.ideal.join('   ');
  api.text(ctx, version + '  ·  ' + detail, x, 941, 30, C.muted);
  api.text(ctx, report.dcg.toFixed(3) + ' / ' + report.idcg.toFixed(3), x, 1000, 36, C.ink);
  if (showResult)
    api.text(
      ctx,
      version + ' system NDCG = ' + report.system.toFixed(3),
      x + 308,
      1000,
      32,
      C.green,
    );
}

export function paintFreshPermission(ctx, scene, state, api) {
  const { C } = api;
  const p = (id, b, a, z) => cueProgress(state, api, id, b, a, z);
  const rev = p('permission-revoked', 0, 0.61, 0.77);
  const block = p('permission-block', 1, 0.01, 0.27);
  const admit = p('permission-reserve', 1, 0.28, 0.67);
  const ideal = p('permission-ideal', 2, 0.37, 0.54);
  const score = p('permission-result', 2, 0.6, 0.75);
  const separate = p('permission-replay', 3, 0.01, 0.16) > 0;
  const deniedBlog = p('permission-blog', 3, 0.25, 0.46) > 0;
  const finish = p('permission-changelog', 4, 0.01, 0.16);
  const blogScore = p('permission-final-score', 4, 0.48, 0.65);
  const blocked = separate ? (deniedBlog ? 'blog-post' : null) : rev > 0 ? first.blocked : null;
  let title = 'Cached proposal  ·  E1';
  let entries = entriesFor(first.original.selected);
  let question = '';
  if (separate) {
    title = deniedBlog ? 'Blog access changed  ·  E3' : 'Original proposal  ·  E1';
    if (deniedBlog) {
      entries = entriesFor(alternative.selected);
      entries[2].opacity = finish;
      if (finish === 0) question = 'Which page can fill slot three?';
    }
  } else if (block > 0 || admit > 0) {
    title = 'Rechecked proposal  ·  E2';
    entries = entriesFor(first.current.selected, admit);
  } else if (rev > 0) {
    question = 'Which page gets the open platform place?';
  }
  const placements = entries.filter((entry) => entry.opacity === 1).map((entry) => entry.page.id);
  drawReserve(ctx, api, {
    target: 'permission-reserve-list',
    blocked,
    placements: separate || block > 0 ? placements : undefined,
  });
  drawSlots(ctx, api, {
    title,
    entries,
    target: 'permission-slots',
    question,
    questionSlot: separate ? 2 : null,
    platformUsed: placements.filter((id) => sourceIdentity(id) === 'platform').length,
  });
  api.focus.target('permission-metrics', () => {
    reportLine(ctx, api, 'E1', first.oldReport, 120, true, separate && blogScore === 1);
    if (separate && blogScore > 0) {
      reportLine(ctx, api, 'E3', alternativeReport, 1072, true, blogScore === 1);
    } else if (!separate && ideal > 0) {
      reportLine(ctx, api, 'E2', first.newReport, 1072, score > 0);
    } else if (!separate && admit === 1) {
      api.text(ctx, 'E2 ideal grades   ?', 1072, 941, 30, C.yellow);
    }
  });
}
export default {
  id: 'fresh-permission',
  draw: paintFreshPermission,
  cues: [
    'permission-original',
    'permission-revoked',
    'permission-block',
    'permission-reserve',
    'permission-ideal',
    'permission-result',
    'permission-replay',
    'permission-blog',
    'permission-changelog',
    'permission-final-score',
  ],
};
