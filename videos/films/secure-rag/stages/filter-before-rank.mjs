import { filterConstructionState } from '../construction.mjs';
import { drawOriginalCard, drawOriginalText } from '../defaults.mjs';
export function drawFilterBeforeRank(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  {
    const current = filterConstructionState(currentBeat, progress);
    components.panel({
      x: 105,
      y: 280,
      width: 1160,
      height: 610,
      fill: themeColors.panel,
      stroke: themeColors.blue,
      padding: 10,
    });
    drawOriginalText(
      ctx,
      api,
      'Trusted store · tenant A · operations grant',
      685,
      335,
      31,
      themeColors.blue,
    );
    drawOriginalText(ctx, api, 'Stored metadata', 345, 385, 27, themeColors.muted);
    drawOriginalText(ctx, api, 'Policy decision', 735, 385, 27, themeColors.muted);
    drawOriginalText(
      ctx,
      api,
      current.handoff ? 'Eligible queue sent' : 'Internal eligible queue',
      1060,
      440,
      25,
      themeColors.green,
    );
    current.storeOrder.forEach((record, index) => {
      const result = current.evaluated[index],
        active = index === current.inspected - 1,
        color = result
          ? result.allowed
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted,
        y = 420 + index * 63;
      api.focus.target('candidate-metadata', () =>
        drawOriginalCard(
          ctx,
          api,
          record.id + ' · ' + record.tenant + ' · ' + record.grant,
          135,
          y,
          420,
          color,
          1,
          54,
          26,
        ),
      );
      if (result)
        api.focus.target('policy-decisions', () =>
          drawOriginalCard(ctx, api, result.reason, 585, y, 290, color, 1, 54, 24),
        );
      if (active && currentBeat === 0)
        api.arrow(ctx, 115, y + 27, 130, y + 27, themeColors.yellow, 3);
    });
    current.eligible.forEach((record, index) => {
      const side = index === 0 ? 1 : -1,
        rank = current.rank,
        lateral = rank < 0.25 ? rank * 4 : rank > 0.75 ? (1 - rank) * 4 : 1,
        vertical = rank < 0.25 ? 0 : rank > 0.75 ? 1 : (rank - 0.25) / 0.5;
      const x = 1460 + side * 140 * lateral,
        y = 535 + index * 120 + side * 120 * vertical;
      const color = current.returned ? themeColors.green : themeColors.yellow,
        label = record.id + ' · ' + record.score.toFixed(2);
      if (current.handoff < 1)
        api.focus.target('eligible-queue', () =>
          drawOriginalCard(
            ctx,
            api,
            label,
            900,
            535 + index * 120,
            260,
            color,
            1 - current.handoff,
            70,
            29,
          ),
        );
      if (current.handoff > 0) {
        api.focus.target('ranked-queue', () =>
          drawOriginalCard(ctx, api, label, x, y, 260, color, current.handoff, 70, 29),
        );
        if (current.handoff < 1)
          api.arrow(ctx, 1180, 570 + index * 120, 1440, 570 + index * 120, themeColors.green, 3);
      }
    });
    if (current.handoff === 1) {
      drawOriginalText(
        ctx,
        api,
        current.rank === 1 ? 'Ranked eligible IDs' : 'Rank only this permitted queue',
        1480,
        430,
        28,
        themeColors.yellow,
      );
      if (current.returned) {
        drawOriginalText(ctx, api, 'R6 · Incident checklist', 1495, 790, 28, themeColors.green);
        drawOriginalText(ctx, api, 'R7 · Operations runbook', 1495, 845, 28, themeColors.green);
      }
    }
    drawOriginalText(
      ctx,
      api,
      current.inspected + '/7 records checked · ' + current.eligible.length + ' eligible',
      685,
      950,
      31,
      themeColors.yellow,
    );
  }
}
export default {
  id: 'filter-before-rank',
  draw: drawFilterBeforeRank,
  cues: [
    'filter-before-rank-b1-1',
    'filter-before-rank-b1-2',
    'filter-before-rank-b2-1',
    'filter-before-rank-b2-2',
    'filter-before-rank-b3-1',
  ],
};
