import { messages, xy } from '../fixtures.mjs';
import { mix, unit, visibleLineSegments } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import { extensionNote, extensionText } from '../defaults.mjs';
export function drawAuditLabels(ctx, scene, state, api) {
  return api.focus.target('audit-labels-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const labelBoxes = [],
        pendingSegments = [];
      const cueProgress = (beat, sentence) =>
          directed(state, `cp-audit-labels-${beat}-${sentence}`, beat),
        resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      {
        const split = currentBeat > 0 ? cueProgress(1, 2) : 0,
          spread = unit(split / 0.6),
          collapse = unit((split - 0.6) / 0.4);
        xy.forEach((p, i) => {
          const group = Math.floor(i / 2),
            x = mix(380 + group * 560, 170 + i * 300, spread),
            y = 500 + (i % 2) * 130 * (1 - collapse);
          api.rect(ctx, x - 120, y - 55, 240, 110, themeColors.panel, colors[group], 2);
          extensionText(ctx, api, labelBoxes, ids[i], x, y - 10, 29, colors[group]);
          extensionText(ctx, api, labelBoxes, messages[i].text, x, y + 30, 24, colors[group]);
        });
        if (currentBeat === 0) {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Run 7 · read message examples before naming groups',
            960,
            295,
            33,
            themeColors.cyan,
          );
          if (cueProgress(0, 1) > 0)
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Nearest pairs  /  center examples  /  boundary cases',
              960,
              835,
              31,
              themeColors.yellow,
            );
          if (resultComplete(0, 4))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Run 8 may permute cluster integers; message IDs persist',
              960,
              940,
              30,
              themeColors.green,
            );
        } else {
          extensionText(
            ctx,
            api,
            labelBoxes,
            split === 1
              ? 'Six singleton clusters'
              : split === 0
                ? 'Three reviewed pairs'
                : 'Separate the same six messages',
            960,
            290,
            35,
            themeColors.cyan,
          );
          if (resultComplete(1, 1))
            extensionText(
              ctx,
              api,
              labelBoxes,
              split === 1
                ? '1 / 1 = 1 purity in each singleton'
                : split === 0
                  ? '2 / 2 = 1 purity in each pair'
                  : 'Pure topics survive this regrouping',
              960,
              770,
              36,
              themeColors.green,
            );
          if (resultComplete(1, 3))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Keep size, topic coverage and boundary examples',
              960,
              875,
              31,
              themeColors.yellow,
            );
          if (resultComplete(1, 4))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Final benchmark stays untouched',
              960,
              955,
              30,
              themeColors.pink,
            );
        }
        extensionNote(
          ctx,
          api,
          labelBoxes,
          'Reviewed words justify topic names; geometry contributes a partition and testable neighborhoods.',
        );
      }
      for (const { q, a, z, color, width } of pendingSegments)
        for (const points of visibleLineSegments(a, z, labelBoxes))
          api.path(ctx, points, {
            color,
            width,
            clip: q.bounds,
          });
    }
    {
      const { C } = api;
      [
        'A · charged twice',
        'B · duplicate payment',
        'C · reset link',
        'D · two-factor code',
        'E · release runbook',
        'F · release approval',
      ].forEach((v, i) => api.text(ctx, v, 130 + i * 282, 196, 22, C.muted, 'left'));
    }
  });
}
export default {
  id: 'audit-labels',
  draw: drawAuditLabels,
  cues: [
    'cp-audit-labels-0-0',
    'cp-audit-labels-0-1',
    'cp-audit-labels-0-2',
    'cp-audit-labels-0-3',
    'cp-audit-labels-0-4',
    'cp-audit-labels-1-0',
    'cp-audit-labels-1-1',
    'cp-audit-labels-1-2',
    'cp-audit-labels-1-3',
    'cp-audit-labels-1-4',
  ],
};
