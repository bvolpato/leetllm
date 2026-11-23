import { mix } from '../arithmetic.mjs';
import { sqlCueStep } from '../construction.mjs';
import { active, joinedRows, sourceCounts } from '../model.mjs';
import {
  drawExtendedSqlCard,
  drawExtendedSqlFooter,
  drawExtendedSqlGrid,
  drawExtendedSqlHeading,
  drawExtendedSqlText,
  withSqlFade,
} from '../defaults.mjs';

const harborRows = joinedRows().filter((row) => row.source.workspace === 'w01');
const minimumCount = 2;
const groups = sourceCounts().map((source, index) => ({
  ...source,
  y: 400 + 320 * index,
  members: harborRows.filter((row) => row.document === source.id),
}));

function groupColor(colors, group, having) {
  if (having && group && group.count < minimumCount) return colors.muted;
  return group?.id === 'd9' ? colors.blue : colors.cyan;
}

export function drawAggregateOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    stepProgress = (beat, i = 0) => sqlCueStep('aggregate-order', state, beat, i),
    stepComplete = (beat, i = 0) => stepProgress(beat, i) === 1;
  api.focus.target('aggregate-order-construction', () => {
    drawExtendedSqlHeading(
      ctx,
      api,
      currentBeat === 0
        ? 'Harbor  /  August 12, 2026  /  Which sources have at least two current paragraphs?'
        : 'An empty parent keeps a NULL child placeholder',
    );
    if (currentBeat === 0) {
      const filter = stepProgress(0);
      const groupTravel = filter === 1 ? stepProgress(0, 1) : 0;
      const having = stepComplete(0, 3);
      if (groupTravel === 0) {
        for (const [label, x] of [
          ['Paragraph → document', 465],
          ['Source title', 985],
          ['Valid from', 1335],
          ['Valid until', 1650],
        ]) {
          drawExtendedSqlText(ctx, api, label, x, 342, 28, themeColors.muted, 'center');
        }
      }
      harborRows.forEach((row, i) => {
        const current = active(row.source);
        if (!current && filter === 1) return;
        const group = groups.find((source) => source.id === row.document);
        const inputY = 376 + i * 135;
        const targetY = group ? group.y + group.members.indexOf(row) * 115 : inputY;
        const drawRow = () => {
          drawExtendedSqlCard(
            ctx, api, row.id + ' → ' + row.document,
            mix(150, 1040, groupTravel), mix(inputY, targetY, groupTravel),
            630, 85, groupColor(themeColors, group, having), 33,
          );
          if (groupTravel === 0) {
            const baseline = inputY + 53;
            for (const [value, x] of [
              [row.source.title, 985],
              [row.source.from.slice(0, 10), 1335],
              [row.source.to?.slice(0, 10) ?? 'Open', 1650],
            ]) {
              drawExtendedSqlText(ctx, api, value, x, baseline, 32, themeColors.ink, 'center');
            }
          }
        };
        if (current) drawRow();
        else api.focus.target('retired-edition', () => withSqlFade(ctx, api, 1 - filter, drawRow));
      });
      if (stepComplete(0, 2)) {
        for (const group of groups) {
          const label = group.id + ' · ' + group.title + ' · COUNT = ' + group.count;
          drawExtendedSqlCard(
            ctx, api, label, 150, group.y, 630, 85, groupColor(themeColors, group, having), 33,
          );
          if (having && group.count < minimumCount) {
            drawExtendedSqlText(ctx, api, group.id + ' excluded by HAVING', 465, group.y + 145, 29, themeColors.muted, 'center');
          }
        }
      }
      if (having) {
        const kept = groups.filter((group) => group.count >= minimumCount);
        drawExtendedSqlText(
          ctx,
          api,
          'HAVING COUNT(*) >= ' + minimumCount + '   →   ' + kept.map((group) => group.id).join(', '),
          960,
          940,
          33,
          themeColors.green,
          'center',
        );
      }
      if (filter === 1)
        drawExtendedSqlFooter(ctx, api, 'WHERE removed the retired paragraph before the count.');
    } else {
      drawExtendedSqlGrid(
        ctx,
        api,
        [
          ['parent', 'joined child.id'],
          ['d-empty', 'NULL'],
        ],
        220,
        380,
        1480,
        200,
        themeColors.blue,
        34,
      );
      if (stepProgress(1, 2) > 0) {
        drawExtendedSqlCard(
          ctx,
          api,
          'COUNT(child.id) = 0',
          180,
          750,
          720,
          100,
          themeColors.green,
          37,
        );
        drawExtendedSqlCard(ctx, api, 'COUNT(*) = 1', 1030, 750, 720, 100, themeColors.yellow, 37);
      }
      if (stepProgress(1, 3) > 0)
        drawExtendedSqlText(
          ctx,
          api,
          'Child filter belongs in ON when empty parents must remain',
          960,
          950,
          30,
          themeColors.cyan,
          'center',
        );
      drawExtendedSqlFooter(ctx, api, 'WHERE selects rows · GROUP BY forms identities · HAVING selects aggregates');
    }
  });
}
export default {
  id: 'aggregate-order',
  draw: drawAggregateOrder,
  cues: [
    'aggregate-order-b1',
    'aggregate-order-voice-1',
    'aggregate-order-step-0-1',
    'aggregate-order-step-0-2',
    'aggregate-order-step-0-3',
    'aggregate-order-b2',
    'aggregate-order-voice-2',
    'aggregate-order-step-1-1',
    'aggregate-order-step-1-2',
    'aggregate-order-step-1-3',
    'aggregate-order-step-1-4',
  ],
};
