import { safeToolCosine } from '../arithmetic.mjs';
import { permittedToolRanking } from '../model.mjs';
import { filmClock } from '../clock.mjs';
import { box, chapterCode, chapterLine, chapterText, footer, heading } from '../defaults.mjs';
export function drawPermissionBeforeRanking(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    clock = filmClock(scene, state),
    resultComplete = (id) => clock.after('tu-' + id),
    num = (x) => Number(x.toFixed(6)).toString();
  api.focus.target('tu-permission-before-ranking-mechanism', () => {
    if (currentBeat < 2) heading(ctx, api, currentBeat === 0 ? 'Host inventory   /   triage session' : 'Tool A   /   three finite coordinates');
    if (currentBeat === 0) {
      const names = [
          'get_release_status',
          'search_release_policy',
          'promote_model',
          'restart_cluster',
        ],
        filter = resultComplete('rank-permission', 0);
      names.forEach((name, i) => {
        const allowed = i < 2,
          y = 410 + i * 125;
        chapterCode(ctx, api, name, 150, y, 29, allowed ? themeColors.blue : themeColors.muted);
        chapterText(
          ctx,
          api,
          allowed ? 'triage' : 'ops-admin',
          800,
          y,
          28,
          allowed ? themeColors.cyan : themeColors.muted,
        );
        chapterText(
          ctx,
          api,
          filter
            ? allowed
              ? 'eligible for ranking'
              : 'not disclosed to caller'
            : 'trusted host inventory',
          1220,
          y,
          27,
          filter ? (allowed ? themeColors.green : themeColors.pink) : themeColors.yellow,
        );
        if (filter && !allowed) chapterText(ctx, api, '×', 1100, y, 30, themeColors.pink);
      });
    } else if (currentBeat === 1) {
      const scale = 0.8,
        scaled = [0.75, 1, 0],
        length = Math.hypot(...scaled);
      chapterCode(ctx, api, 'v = [0.6, 0.8, 0.0]', 150, 405, 33, themeColors.blue);
      chapterText(
        ctx,
        api,
        'scale by max |coordinate| = ' + scale,
        150,
        535,
        30,
        themeColors.yellow,
      );
      if (resultComplete('rank-norm', 1)) {
        chapterCode(ctx, api, 'scaled = [0.75, 1, 0]', 150, 665, 31, themeColors.cyan);
        chapterText(
          ctx,
          api,
          'length = ' + num(length) + ' → unit = [0.6, 0.8, 0]',
          150,
          780,
          30,
          themeColors.green,
        );
      }
      if (resultComplete('rank-dot', 1))
        chapterText(
          ctx,
          api,
          'dot: multiply matching coordinates, then add',
          150,
          905,
          30,
          themeColors.cyan,
        );
      if (resultComplete('rank-zero', 1))
        box(
          ctx,
          api,
          'zero vector',
          'reject: no cosine direction',
          1170,
          410,
          560,
          themeColors.pink,
          140,
        );
    } else {
      const query = [1, 0, 0];
      const catalog = [
        { name: 'A', tool: 'Status read', role: 'triage', vector: [0.6, 0.8, 0] },
        { name: 'B', tool: 'Policy read', role: 'triage', vector: [0.8, 0.6, 0] },
        { name: 'C', tool: 'Write', role: 'admin', vector: [1, 0, 0] },
      ];
      const [winner] = permittedToolRanking(query, catalog, ['triage'], 1);
      const chosen = clock.after('tu-rank-top-one');
      const x = 180, y = 798, unit = 538;
      api.focus.target('rank-axis', () => {
        chapterLine(ctx, api, x, y, x + unit + 80, y, themeColors.yellow, 3);
        chapterLine(ctx, api, x, y, x, y - unit, themeColors.muted, 2);
        chapterLine(ctx, api, x + unit + 62, y - 12, x + unit + 80, y, themeColors.yellow, 3);
        chapterLine(ctx, api, x + unit + 62, y + 12, x + unit + 80, y, themeColors.yellow, 3);
        chapterText(ctx, api, 'Query direction   [1, 0, 0]', x, 948, 35, themeColors.yellow);
        for (const tool of catalog.filter(t => t.role === 'triage')) {
          const xx = x + unit * tool.vector[0], yy = y - unit * tool.vector[1];
          const color = tool.name === 'A' ? themeColors.blue : themeColors.cyan;
          const suffix = tool.name.toLowerCase();
          chapterLine(ctx, api, x, y, xx, yy, color, 5);
          api.circle(ctx, xx, yy, 9, color);
          chapterText(ctx, api, tool.name, xx + 14, yy - 13, 39, color);
          const p = clock.progress('rank-project-' + suffix);
          if (p > 0) chapterLine(ctx, api, xx, yy + 12, xx, yy + 12 + (y - yy - 12) * p, color, 2);
          if (clock.after('rank-score-' + suffix))
            chapterText(ctx, api, num(safeToolCosine(query, tool.vector)), xx, y + 58, 41, color, 'center');
        }
      });
      api.focus.target('rank-options', () => {
        chapterText(ctx, api, 'Tools the job needs', 965, 300, 45, themeColors.ink, 'left', 'serif');
        for (const [i, tool] of catalog.slice(0, 2).entries()) {
          const color = i === 0 ? themeColors.blue : themeColors.cyan;
          chapterText(ctx, api, tool.name + '   ' + tool.tool, 965, 405 + i * 130, 44, color);
          chapterCode(ctx, api, '[' + tool.vector.join(', ') + ']', 965, 454 + i * 130, 31, themeColors.ink);
        }
        chapterLine(ctx, api, 965, 635, 1765, 635, themeColors.muted, 2);
        chapterText(ctx, api, 'One model slot', 965, 705, 35, themeColors.muted);
        chapterText(ctx, api, chosen ? winner.name + '   ' + winner.tool : '?', 965, 792, 54,
          chosen ? themeColors.cyan : themeColors.yellow);
        if (clock.after('tu-rank-missing-tool'))
          chapterText(ctx, api, 'Status read missing   /   task incomplete', 965, 899, 36, themeColors.yellow);
        else if (clock.started('rank-slot'))
          chapterText(ctx, api, 'Can the task finish?', 965, 899, 36, themeColors.yellow);
      });
    }
    footer(
      ctx,
      api,
      currentBeat < 2 ? 'Hand-picked coordinates for this example.' : 'Both permitted tool vectors lie in this plane.',
    );
  });
}
export default {
  id: 'permission-before-ranking',
  draw: drawPermissionBeforeRanking,
  cues: [
    'tu-permission-before-ranking-1',
    'tu-rank-permission',
    'tu-permission-before-ranking-2',
    'tu-rank-dot',
    'tu-rank-norm',
    'tu-rank-zero',
    'rank-query', 'rank-project-a', 'rank-score-a', 'rank-project-b', 'rank-score-b', 'rank-slot',
    'tu-rank-top-one',
    'tu-rank-missing-tool',
  ],
};
