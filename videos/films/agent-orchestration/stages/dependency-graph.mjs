import { readSchedule } from '../arithmetic.mjs';
import { focusTarget, graphText } from '../defaults.mjs';
export function drawDependencyGraph(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching, phase } = api,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0,
    q = phase(progress, 0.05, 0.88);
  const graph = (cycle = false) => {
    const elapsed = beat === 0 ? api.focus.progress('read-branches', q) * 3.5 : 3.5,
      schedule = readSchedule(elapsed);
    const result = teaching.flowGraph({
      nodes: [
        {
          id: 'triage',
          focusTarget: 'release-request',
          label: 'Triage request',
          x: 160,
          y: 500,
          width: 340,
          height: 110,
          color: themeColors.yellow,
        },
        ...schedule.branches.map((row, i) => ({
          id: row.id,
          focusTarget: row.id.toLowerCase() + '-read',
          label: row.id + (row.complete ? ' receipt ready' : ' read running'),
          x: 760,
          y: 290 + i * 220,
          width: 360,
          height: 100,
          color: row.complete
            ? themeColors.green
            : [themeColors.blue, themeColors.pink, themeColors.green][i],
          fontSize: 29,
        })),
        {
          id: 'merge',
          focusTarget: 'validated-merge',
          label: schedule.mergeComplete
            ? 'Validated merge ready'
            : schedule.allReads
              ? 'Merging receipts'
              : 'Wait for all 3 reads',
          x: 1430,
          y: 500,
          width: 350,
          height: 110,
          color: schedule.mergeComplete ? themeColors.green : themeColors.yellow,
          fontSize: 28,
        },
      ],
      edges: ['Eval', 'Health', 'Policy'].flatMap((id, i) => [
        {
          from: 'triage',
          to: id,
          focusTarget: 'read-routes',
          color: [themeColors.blue, themeColors.pink, themeColors.green][i],
          gap: 35,
        },
        {
          from: id,
          to: 'merge',
          focusTarget: 'receipt-routes',
          color: schedule.branches[i].complete ? themeColors.green : themeColors.muted,
          gap: 35,
        },
      ]),
    });
    if (cycle) {
      const pts = [
        {
          x: 1605,
          y: 635,
        },
        {
          x: 1605,
          y: 860,
        },
        {
          x: 330,
          y: 860,
        },
        {
          x: 330,
          y: 635,
        },
      ];
      focusTarget(ctx, api, 'review-cycle', () => {
        api.path(ctx, pts, {
          color: themeColors.yellow,
          width: 3,
        });
        api.arrow(ctx, 330, 710, 330, 635, themeColors.yellow, 3);
        graphText(
          ctx,
          api,
          'Re-review creates a cycle',
          960,
          915,
          30,
          themeColors.yellow,
          'center',
        );
      });
    } else
      graphText(
        ctx,
        api,
        'Supplied read clock ' + elapsed.toFixed(1) + ' s',
        960,
        885,
        28,
        themeColors.muted,
        'center',
      );
    return result;
  };
  {
    graph(beat === 2);
  }
}
export default {
  id: 'dependency-graph',
  draw: drawDependencyGraph,
  cues: ['read-branches', 'merge-ready', 'operation-node', 'deterministic-merge', 'review-cycle'],
};
