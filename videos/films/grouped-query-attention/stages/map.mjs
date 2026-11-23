import { HEADS } from '../fixtures.mjs';
import { TRACKS } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawMap(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api;
  const beat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  const phaseForBeat = (from = 0.08, to = 0.82) => api.phase(progress, from, to);
  const snap = {
    ...TRACKS['map'].sample({
      beat,
      beatP: progress,
    }).snapshot,
  };
  void state.cues;
  const GROUP_COLORS = [themeColors.cyan, themeColors.pink];
  {
    const qLabels = [
      Array.from(
        {
          length: HEADS.queries,
        },
        (_, head) => `Q${head}`,
      ),
    ];
    const visible = beat === 0 ? Math.min(8, Math.floor(9 * phaseForBeat(0.05, 0.82))) : 8;
    const groupHighlights = Array.from(
      {
        length: HEADS.queries,
      },
      (_, column) => ({
        row: 0,
        column,
        fill: GROUP_COLORS[snap.assignments[column]],
        opacity: visible > column ? 0.55 : 0.16,
      }),
    );
    const qgrid = teaching.grid({
      cellFocusTarget: (_row, column) => 'query-group-' + Math.floor(column / 4),
      x: 230,
      y: 385,
      width: 1460,
      height: 102,
      rows: 1,
      columns: 8,
      fill: themeColors.panel,
      stroke: themeColors.border,
      lineWidth: 2,
      labels: qLabels,
      highlights: groupHighlights,
      fontSize: 28,
      textColor: themeColors.ink,
    });
    api.focus.target('map-eight-independent-query-heads', () =>
      text(ctx, api, 'Eight independent query heads', 960, 335, 30, themeColors.ink, 'center'),
    );
    const groupXs = [440, 1060];
    for (let group = 0; group < 2; group += 1) {
      const active = snap.activeGroup === group || snap.activeGroup === -1;
      const start = group * 4,
        end = start + 3;
      const cell0 = qgrid.cell(0, start),
        cell3 = qgrid.cell(0, end);
      const yRail = 555;
      if (visible > start) {
        api.line(
          ctx,
          cell0.x + cell0.width / 2,
          yRail,
          cell3.x + cell3.width / 2,
          yRail,
          GROUP_COLORS[group],
          4,
        );
        for (let head = start; head <= end && head < visible; head++) {
          const cell = qgrid.cell(0, head);
          api.line(
            ctx,
            cell.x + cell.width / 2,
            cell.y + cell.height,
            cell.x + cell.width / 2,
            yRail,
            GROUP_COLORS[group],
            4,
          );
        }
        api.line(
          ctx,
          groupXs[group] + 210,
          yRail,
          groupXs[group] + 210,
          620,
          GROUP_COLORS[group],
          4,
        );
      }
      const kv = api.focus.target('stored-group-' + group, () =>
        card(
          ctx,
          api,
          'map',
          `KV group ${group} · K and V history`,
          groupXs[group],
          635,
          420,
          92,
          GROUP_COLORS[group],
          active ? 1 : 0.62,
          25,
        ),
      );
      api.focus.target('map-readout', () =>
        text(
          ctx,
          api,
          `Queries ${start}–${end} share this stored pair`,
          groupXs[group] + 210,
          785,
          25,
          GROUP_COLORS[group],
          'center',
        ),
      );
      void kv;
    }
    api.focus.target('map-equation', () =>
      equation(ctx, api, String.raw`G=H_q/H_{kv}=8/2=4`, 960, 900, 36, themeColors.yellow),
    );
  }
}
export default {
  id: 'map',
  draw: drawMap,
  cues: [
    'group-size',
    'first-group',
    'distinct-queries',
    'shared-stored-pair',
    'grouping-rule',
    'four-readers',
  ],
};
