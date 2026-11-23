import { LINKS } from '../fixtures.mjs';
import { q } from '../construction.mjs';
import {
  drawChapterCard,
  drawChapterFooter,
  drawChapterLine,
  drawChapterRectangle,
  drawChapterText,
} from '../defaults.mjs';
export function drawGraphCost(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cue = state.cues?.['ds-graph-cost-' + currentBeat],
    u = cue ? api.clamp(cue.progress) : api.clamp(progress / 0.82);
  api.focus.target('ds-graph-cost-mechanism', () => {
    if (currentBeat === 0) {
      drawChapterText(
        ctx,
        api,
        'Same support links · stored neighbor order',
        960,
        315,
        35,
        themeColors.ink,
      );
      const events = [
          ['V', 0],
          ['E', 0, 2],
          ['E', 0, 3],
          ['V', 2],
          ['E', 2, 3],
          ['V', 3],
          ['E', 3, 0],
        ],
        n = Math.floor(u * events.length + 1e-9),
        past = events.slice(0, n),
        visited = new Set(past.filter((e) => e[0] === 'V').map((e) => e[1]));
      for (let i = 0; i < 4; i++) {
        drawChapterText(
          ctx,
          api,
          'M' + i + ' → [' + (LINKS[i] ?? []).map((id) => 'M' + id).join(', ') + ']',
          430,
          450 + i * 120,
          31,
          visited.has(i) ? themeColors.green : themeColors.muted,
        );
        for (let j = 0; j < 4; j++) {
          const exists = LINKS[i].includes(j),
            inspected = past.some((e) => e[0] === 'E' && e[1] === i && e[2] === j);
          drawChapterRectangle(
            ctx,
            api,
            1050 + j * 130,
            405 + i * 120,
            105,
            90,
            inspected ? themeColors.yellow : themeColors.muted,
          );
          drawChapterText(
            ctx,
            api,
            exists ? 1 : 0,
            1102 + j * 130,
            465 + i * 120,
            34,
            inspected ? themeColors.yellow : exists ? themeColors.cyan : themeColors.muted,
          );
        }
      }
      drawChapterText(
        ctx,
        api,
        'Expanded ' + visited.size + ' reachable vertices',
        500,
        935,
        31,
        themeColors.green,
      );
      drawChapterText(
        ctx,
        api,
        'Inspected ' + past.filter((e) => e[0] === 'E').length + ' edges',
        1370,
        935,
        31,
        themeColors.yellow,
      );
    } else {
      drawChapterText(ctx, api, 'Search for 3', 450, 315, 34, themeColors.yellow);
      drawChapterText(ctx, api, 'Prefix: charg', 1350, 315, 34, themeColors.yellow);
      const prefix = q(state, 'graph-prefix', 1, 0.4, 0.59);
      const endings = q(state, 'graph-completions', 1, 0.66, 0.81);
      const nodes = [
        {
          v: 2,
          x: 450,
          y: 420,
        },
        {
          v: 1,
          x: 220,
          y: 620,
        },
        {
          v: 3,
          x: 680,
          y: 620,
        },
      ];
      drawChapterLine(ctx, api, 450, 470, 220, 620, themeColors.cyan);
      drawChapterLine(ctx, api, 450, 470, 680, 620, themeColors.yellow);
      for (const n of nodes)
        drawChapterCard(
          ctx,
          api,
          n.v,
          n.x - 70,
          n.y,
          n.v === 3 && u > 0.3 ? themeColors.yellow : themeColors.cyan,
          140,
        );
      drawChapterText(
        ctx,
        api,
        u === 1 ? 'Found 3 in two comparisons' : 'Find 3',
        470,
        840,
        29,
        themeColors.cyan,
      );
      const chars = ['c', 'h', 'a', 'r', 'g'];
      for (let i = 0; i < 5; i++) {
        drawChapterCard(
          ctx,
          api,
          chars[i],
          1010 + i * 145,
          425,
          prefix * chars.length >= i + 1 ? themeColors.green : themeColors.muted,
          110,
        );
        if (i < 4)
          drawChapterLine(ctx, api, 1120 + i * 145, 463, 1155 + i * 145, 463, themeColors.muted, 3);
      }
      ['charge', 'charged', 'charges'].forEach((term, i) => {
        if (endings * 3 >= i + 1)
          drawChapterText(ctx, api, term + ' [end]', 1300, 650 + 85 * i, 29, themeColors.green);
      });
      drawChapterText(
        ctx,
        api,
        '5 prefix symbols, then suffix and output work',
        1330,
        935,
        28,
        themeColors.yellow,
      );
    }
    drawChapterFooter(
      ctx,
      api,
      currentBeat === 0
        ? 'Expected O(V + E) with O(1) queue or stack operations and expected O(1) discovery checks'
        : 'Sorting neighbors, hashing long keys and producing strings can add work.',
    );
    return;
  });
}
export default {
  id: 'graph-cost',
  draw: drawGraphCost,
  cues: ['ds-graph-cost-0', 'ds-graph-cost-1', 'graph-prefix', 'graph-completions'],
};
