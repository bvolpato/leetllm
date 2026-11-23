import { CLUSTER_EDGES } from '../fixtures.mjs';
import { modularityTerms } from '../model.mjs';
import { arrow, card, dot, footer, line, text } from '../defaults.mjs';
export function drawCommunityConstruction(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const done = (id) => state.cues?.['community-construction-' + id]?.phase === 'after';
  api.focus.target('community-construction-mechanism', () => {
    if (currentBeat < 4) {
      const id = scene.id,
        C = themeColors;
      const write = (s, x, y, z, color, align = 'left') =>
        text(ctx, api, id, s, x, y, z, color, align);
      const all = currentBeat === 3 && (state.cues?.[id + '-merge']?.progress ?? 0) > 0;
      const degreeView = currentBeat > 0;
      const groups = [
        ['A', 'B', 'C', 'D'],
        ['E', 'F'],
      ];
      const terms = modularityTerms(all ? [groups.flat()] : groups, CLUSTER_EDGES);
      const degree = (n) => CLUSTER_EDGES.filter((e) => e.includes(n)).length;
      const pos = {
        A: [245, 412],
        B: [570, 412],
        C: [570, 683],
        D: [245, 683],
        E: [955, 412],
        F: [955, 683],
      };
      const color = (n) => (all ? C.blue : groups[0].includes(n) ? C.cyan : C.yellow);
      api.focus.target(id + '-graph', () => {
        if (all) api.rect(ctx, 115, 305, 965, 488, C.panel, C.blue, 14);
        else {
          api.rect(ctx, 115, 305, 585, 488, C.panel, C.cyan, 14);
          api.rect(ctx, 823, 305, 257, 488, C.panel, C.yellow, 14);
        }
        CLUSTER_EDGES.forEach(([a, b]) => {
          const [x1, y1] = pos[a],
            [x2, y2] = pos[b];
          const len = Math.hypot(x2 - x1, y2 - y1),
            dx = (49 * (x2 - x1)) / len,
            dy = (49 * (y2 - y1)) / len;
          line(ctx, api, x1 + dx, y1 + dy, x2 - dx, y2 - dy, color(a), 5);
        });
        for (const [name, [x, y]] of Object.entries(pos))
          dot(ctx, api, id, degreeView ? degree(name) : name, x, y, color(name), 45);
        write(
          degreeView ? 'Number in a node = its degree' : 'Two components in the clustering graph',
          595,
          871,
          35,
          C.ink,
          'center',
        );
      });
      api.focus.target(id + '-score', () => {
        const x = 1180;
        write(all ? 'One group' : 'Two groups', x, 286, 48, C.ink);
        if (currentBeat === 0) {
          write('Cache group', x, 432, 38, C.cyan);
          write('5 internal edges', x, 492, 37, C.ink);
          write('Eval group', x, 641, 38, C.yellow);
          write('1 internal edge', x, 701, 37, C.ink);
        } else {
          write('6 edges   /   12 edge ends', x, 366, 35, C.ink);
          if (currentBeat === 1) {
            write('For each group', x, 477, 34, C.muted);
            write('Internal edges / 6', x, 567, 42, C.ink);
            write('− (group degree / 12)²', x, 645, 42, C.ink);
            write('Sum the group contributions.', x, 790, 32, C.muted);
          } else if (!all) {
            if (done('cache-term')) {
              write('Cache group', x, 442, 32, C.cyan);
              write('5/6 − (10/12)² = 5/36', x, 502, 39, C.ink);
              write('= ' + terms[0].contribution.toFixed(4), x, 557, 35, C.cyan);
              write('(rounded)', x + 198, 557, 29, C.muted);
            }
            if (done('eval-term')) {
              write('Eval: 1/6 − (2/12)²', x, 652, 39, C.yellow);
              write('= 5/36', x, 714, 36, C.ink);
            }
            if (done('modularity-result')) {
              const q = terms.reduce((sum, t) => sum + t.contribution, 0);
              write('Q = 5/18 ≈ ' + q.toFixed(3), x, 837, 42, C.green);
            }
          } else {
            write('All six edges are internal.', x, 475, 33, C.ink);
            write('All twelve ends are inside.', x, 534, 33, C.ink);
            write('6/6 − (12/12)²', x, 677, 48, C.blue);
            if (done('all-one'))
              write('One community: 1 − 1² = ' + terms[0].contribution, x, 813, 38, C.green);
          }
        }
      });
    } else {
      const nodes = [
        ['Serving', 480, 340, themeColors.blue],
        ['Eval', 1440, 340, themeColors.yellow],
        ['Cache', 300, 590, themeColors.cyan],
        ['Queue', 670, 590, themeColors.green],
        ['Metric', 1440, 590, themeColors.yellow],
        ['Small cache', 200, 815, themeColors.cyan],
        ['Large cache', 450, 815, themeColors.cyan],
      ];
      [
        [480, 395, 300, 535],
        [480, 395, 670, 535],
        [1440, 395, 1440, 535],
        [300, 645, 200, 760],
        [300, 645, 450, 760],
      ].forEach((v) => arrow(ctx, api, ...v, themeColors.muted, 3));
      nodes.forEach(([s, x, y, col]) =>
        card(ctx, api, 'community-construction', s, x - 120, y - 45, 240, 90, col, 28),
      );
      text(
        ctx,
        api,
        'community-construction',
        'Level 0 · multiple roots',
        960,
        250,
        30,
        themeColors.muted,
        'center',
      );
      text(
        ctx,
        api,
        'community-construction',
        'Deeper level → subdivision',
        1120,
        850,
        31,
        themeColors.ink,
        'center',
      );
      footer(
        ctx,
        api,
        'community-construction',
        'Forest depth differs by branch · report impact 0–10 is not relevance, frequency or support',
      );
    }
  });
}
export default {
  id: 'community-construction',
  draw: drawCommunityConstruction,
  cues: [
    'projection',
    'degrees',
    'cache-term',
    'eval-term',
    'modularity-result',
    'merge',
    'all-one',
    'forest',
  ].map((name) => 'community-construction-' + name),
};
