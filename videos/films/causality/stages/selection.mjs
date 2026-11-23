import { auditSelectionState } from '../model.mjs';
import { optionalFocusTarget, text } from '../defaults.mjs';
export function drawSelection(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.86) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  const F = api.components.fade;
  {
    const selection = api.focus
        ? api.focus.progress('selection-audit-filter', phaseForBeat(0))
        : phaseForBeat(0),
      current = auditSelectionState(selection),
      rule = api.focus
        ? api.focus.progress('selection-beat-1-focus-1', phaseForBeat(0))
        : phaseForBeat(0);
    api.teaching.flowGraph({
      nodes: [
        {
          focusTarget: 'selection-node-a',
          id: 'a',
          label: 'assistant used',
          x: 230,
          y: 290,
          width: 350,
          height: 95,
          color: themeColors.cyan,
        },
        {
          focusTarget: 'selection-node-y',
          id: 'y',
          label: 'ticket failed',
          x: 1320,
          y: 290,
          width: 350,
          height: 95,
          color: themeColors.pink,
        },
        {
          focusTarget: 'selection-node-audit',
          id: 'audit',
          label: 'enters audit',
          x: 780,
          y: 570,
          width: 350,
          height: 95,
          color: themeColors.yellow,
        },
      ],
      edges: [
        {
          from: 'a',
          to: 'audit',
          progress: rule,
          color: themeColors.cyan,
        },
        {
          from: 'y',
          to: 'audit',
          progress: rule,
          color: themeColors.pink,
        },
      ],
      fill: themeColors.panel,
      textColor: themeColors.ink,
    });
    text(ctx, api, 'All tickets: 50% vs 50% resolved', 960, 235, 30, themeColors.ink, 'center');
    optionalFocusTarget(ctx, api, 'selection-audit-population', () =>
      current.rows.forEach((row, i) => {
        const y = 735 + i * 120;
        text(
          ctx,
          api,
          row.arm === 'assistant'
            ? 'Assistant · all audited'
            : selection === 1
              ? 'Control · failed only'
              : selection > 0
                ? 'Control · applying filter'
                : 'Control · all initially',
          180,
          y + 48,
          29,
          row.arm === 'assistant' ? themeColors.cyan : themeColors.pink,
        );
        row.tickets.forEach((ticket, j) =>
          api.components.card({
            label: ticket.id + ' · ' + (ticket.resolved ? 'resolved' : 'failed'),
            x: 600 + j * 205,
            y,
            width: 190,
            height: 78,
            fill: themeColors.panel,
            stroke: ticket.included
              ? ticket.resolved
                ? themeColors.green
                : themeColors.pink
              : themeColors.muted,
            textColor: ticket.included ? themeColors.ink : themeColors.muted,
            fontSize: 24,
            padding: 8,
            opacity: ticket.included ? 1 : 0.25,
          }),
        );
        text(
          ctx,
          api,
          row.included + ' tickets · ' + Math.round(row.rate * 100) + '% resolved',
          1530,
          y + 49,
          27,
          themeColors.yellow,
        );
      }),
    );
    if (selection === 1)
      optionalFocusTarget(ctx, api, 'selection-audit-result', () =>
        text(
          ctx,
          api,
          'Audit only: 50% assistant vs 0% control',
          960,
          1010,
          34,
          themeColors.yellow,
          'center',
        ),
      );
  }
}
export default {
  id: 'selection',
  draw: drawSelection,
  cues: [
    'selection-beat-1-focus-1',
    'selection-audit-filter',
    'selection-audit-advantage',
    'selection-beat-2-focus-1',
    'selection-beat-3-focus-1',
  ],
};
