import { transferDocuments } from '../fixtures.mjs';
import { directed, transferFrame } from '../model.mjs';
import { originalFocus, originalFooter, originalLine, originalText } from '../defaults.mjs';
export function drawTakeaway(ctx, scene, state, api) {
  return api.focus.target('takeaway-construction', () => {
    const { C: themeColors, teaching: teaching } = api,
      currentBeat = state.beat ?? 0;
    const phase = (id, beat) => directed(state, id, beat);
    let labelExclusions = [];
    {
      const frame = transferFrame(state),
        q = teaching.axes({
          x: 210,
          y: 330,
          width: 1000,
          height: 545,
          xDomain: [-22, 22],
          yDomain: [-5, 5],
          xTicks: [-20, 0, 20],
          yTicks: [-3, 0, 3],
          xLabel: 'constructed coordinate 1',
          yLabel: 'coordinate 2',
          fontSize: 27,
          equalUnits: true,
        });
      labelExclusions = frame.points.map((row) => {
        const at = q.point(...row.current),
          x = at.x + (row.id === 'L' ? 45 : row.id === 'R' ? -90 : row.id === 'B' ? -35 : 0),
          y = at.y + (['L', 'R'].includes(row.id) ? 0 : 40);
        return {
          x: x - 22,
          y: y - 31,
          width: 44,
          height: 42,
        };
      });
      const colorById = {
        P: themeColors.blue,
        B: themeColors.blue,
        L: themeColors.cyan,
        D: themeColors.pink,
        R: themeColors.muted,
      };
      originalFocus(ctx, api, 'transfer-cloud', () => {
        if (frame.amount > 0)
          originalLine(ctx, api, labelExclusions, q, [-21, 0], [21, 0], 1, themeColors.yellow, 3);
        frame.points.forEach((row) => {
          originalLine(
            ctx,
            api,
            labelExclusions,
            q,
            row.point,
            row.current,
            1,
            colorById[row.id],
            3,
          );
        });
        frame.points.forEach((row) => {
          const at = q.point(...row.current),
            tied = frame.amount === 1 && ['B', 'L', 'R'].includes(row.id),
            r = tied
              ? {
                  B: 9,
                  L: 16,
                  R: 23,
                }[row.id]
              : 10;
          api.circle(
            ctx,
            at.x,
            at.y,
            r,
            tied ? 'transparent' : colorById[row.id],
            colorById[row.id],
            3,
          );
          if (!tied)
            originalText(
              ctx,
              api,
              row.id,
              at.x + (row.id === 'L' ? 45 : row.id === 'R' ? -90 : row.id === 'B' ? -35 : 0),
              at.y + (row.id === 'L' ? 0 : row.id === 'R' ? 0 : 40),
              27,
              colorById[row.id],
              'center',
            );
        });
      });
      originalFocus(ctx, api, 'transfer-reference', () => {
        if (phase('transfer-query', 0) > 0) {
          const at = q.point(...frame.currentQuery);
          api.circle(
            ctx,
            at.x,
            at.y,
            frame.amount === 1 ? 31 : 21,
            'transparent',
            themeColors.yellow,
            4,
          );
          if (frame.amount !== 1)
            originalText(ctx, api, 'Q', at.x + 100, at.y - 22, 28, themeColors.yellow, 'center');
        }
      });
      originalText(
        ctx,
        api,
        'Why does my sign-in code fail?',
        1515,
        335,
        30,
        themeColors.yellow,
        'center',
      );
      originalText(
        ctx,
        api,
        'Storage order [P, B, L, D, R] · first minimum wins',
        960,
        255,
        27,
        themeColors.muted,
        'center',
      );
      originalText(
        ctx,
        api,
        'One-component variance: ' + (100 * frame.varianceKept).toFixed(1) + '%',
        1515,
        430,
        30,
        themeColors.cyan,
        'center',
      );
      if (frame.referenceKnown) {
        originalText(ctx, api, 'Distance to query', 1515, 520, 28, themeColors.muted, 'center');
        for (const [i, id] of ['L', 'B', 'R'].entries()) {
          const j = frame.points.findIndex((row) => row.id === id);
          originalText(
            ctx,
            api,
            id + ' · ' + transferDocuments[j].text,
            1280,
            610 + i * 85,
            26,
            colorById[id],
          );
          originalText(
            ctx,
            api,
            frame.distances[j].toFixed(2),
            1770,
            610 + i * 85,
            34,
            colorById[id],
            'right',
          );
        }
      }
      originalFocus(ctx, api, 'transfer-result', () => {
        const answer =
          currentBeat === 0
            ? frame.referenceKnown
              ? 'Full-space winner: L'
              : 'Answer pending'
            : currentBeat === 1
              ? frame.tieKnown
                ? 'Compressed result: three-way tie'
                : 'Projecting to one coordinate'
              : frame.answerKnown
                ? 'Restored winner: L · sign-in code help'
                : 'Restoring the second component';
        originalText(
          ctx,
          api,
          answer,
          1515,
          950,
          29,
          currentBeat === 1 ? themeColors.pink : themeColors.green,
          'center',
        );
        if (currentBeat === 1 && directed(state, 'cp-takeaway-1-4', 1) === 1)
          originalText(
            ctx,
            api,
            'Returned B · billing help',
            1515,
            875,
            29,
            themeColors.pink,
            'center',
          );
        if (currentBeat === 2 && frame.answerKnown)
          originalText(
            ctx,
            api,
            'Returned L · sign-in code help',
            1515,
            875,
            29,
            themeColors.green,
            'center',
          );
      });
      originalFooter(
        ctx,
        api,
        frame.answerKnown
          ? 'Preserve the distinction the reviewed query needs.'
          : currentBeat === 1
            ? frame.tieKnown
              ? 'Three retained identities occupy one coordinate; storage order can break the tie.'
              : 'Project the query and documents with the same fitted direction.'
            : 'Separate five-document stress test · the query is excluded from the PCA fit.',
      );
    }
  });
}
export default {
  id: 'takeaway',
  draw: drawTakeaway,
  cues: [
    'transfer-documents',
    'transfer-query',
    'transfer-predict',
    'cp-takeaway-0-0',
    'cp-takeaway-0-1',
    'cp-takeaway-0-2',
    'cp-takeaway-0-3',
    'cp-takeaway-0-4',
    'cp-takeaway-0-5',
    'transfer-project',
    'transfer-tie',
    'cp-takeaway-1-0',
    'cp-takeaway-1-1',
    'cp-takeaway-1-2',
    'cp-takeaway-1-3',
    'cp-takeaway-1-4',
    'transfer-restore',
    'transfer-answer',
    'cp-takeaway-2-0',
    'cp-takeaway-2-1',
    'cp-takeaway-2-2',
    'cp-takeaway-2-3',
  ],
};
