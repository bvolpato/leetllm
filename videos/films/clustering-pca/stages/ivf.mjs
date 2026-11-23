import {
  centroids,
  coarseDistances,
  exactNearestIndex,
  labels,
  messages,
  query,
  xy,
} from '../fixtures.mjs';
import { distance, unit } from '../arithmetic.mjs';
import { directed, retrievalFrame } from '../model.mjs';
import {
  originalEquation,
  originalFocus,
  originalFooter,
  originalLine,
  originalPlot,
  originalPoint,
  originalText,
} from '../defaults.mjs';
export function drawIvf(ctx, scene, state, api) {
  return api.focus.target('ivf-construction', () => {
    {
      const { C: themeColors } = api,
        currentBeat = state.beat ?? 0;
      const phase = (id, beat) => directed(state, id, beat);
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      const labelOffsets = [
        [-28, 30],
        [-28, -22],
        [-25, -25],
        [28, 35],
        [-28, 35],
        [28, -24],
      ];
      let labelExclusions = [];
      {
        const q = originalPlot(ctx, api),
          frame = retrievalFrame(state),
          route = phase('ivf-route', 0);
        labelExclusions = xy.map((p, i) => {
          const at = q.point(...p);
          return {
            x: at.x + labelOffsets[i][0] - 20,
            y: at.y + labelOffsets[i][1] - 29,
            width: 40,
            height: 39,
          };
        });
        originalFocus(ctx, api, 'routing-distances', () =>
          centroids.forEach((p, k) => {
            originalLine(
              ctx,
              api,
              labelExclusions,
              q,
              query,
              p,
              route,
              k === 1 ? themeColors.yellow : themeColors.muted,
              3,
            );
            const at = q.point(...p);
            api.circle(ctx, at.x, at.y, 17, 'transparent', colors[k], 4);
          }),
        );
        originalFocus(ctx, api, 'search-candidates', () => {
          xy.forEach((p, i) => {
            if (frame.candidates.includes(i))
              originalLine(ctx, api, labelExclusions, q, query, p, 1, colors[labels[i]], 3);
          });
          xy.forEach((p, i) =>
            originalPoint(
              ctx,
              api,
              ids,
              labelOffsets,
              q,
              i,
              p,
              colors[labels[i]],
              currentBeat === 0 ? 1 : frame.candidates.includes(i) ? 1 : 0.24,
            ),
          );
        });
        originalFocus(ctx, api, 'flat-reference', () => {
          const reference = phase('ivf-reference', 1);
          if (currentBeat === 1 && reference > 0 && reference < 1)
            xy.forEach((p, i) =>
              originalLine(
                ctx,
                api,
                labelExclusions,
                q,
                query,
                p,
                unit(6 * reference - i),
                themeColors.green,
                2,
              ),
            );
          if (frame.referenceKnown) {
            const at = q.point(...xy[exactNearestIndex]);
            api.circle(ctx, at.x, at.y, 23, 'transparent', themeColors.green, 4);
          }
          if (currentBeat > 0) {
            originalText(
              ctx,
              api,
              frame.referenceKnown
                ? 'Flat search: B · duplicate payment'
                : 'Flat-search reference: pending',
              1515,
              755,
              27,
              frame.referenceKnown ? themeColors.green : themeColors.muted,
              'center',
            );
            if (frame.referenceKnown)
              originalEquation(
                ctx,
                api,
                'd(Q,B)=' + distance(query, xy[1]).toFixed(3),
                820,
                themeColors.green,
                34,
              );
          }
        });
        const at = q.point(...query);
        api.circle(ctx, at.x, at.y, 13, themeColors.yellow);
        originalText(ctx, api, 'Q', at.x - 32, at.y - 24, 28, themeColors.yellow, 'center');
        originalText(
          ctx,
          api,
          'Stored lists: C₀ [A,B]     C₁ [C,D]     C₂ [E,F]',
          460,
          245,
          26,
          themeColors.muted,
        );
        originalText(
          ctx,
          api,
          'Please undo my duplicate charge.',
          1515,
          325,
          28,
          themeColors.yellow,
          'center',
        );
        if (currentBeat === 0) {
          originalText(ctx, api, 'Query → center', 1515, 440, 30, themeColors.muted, 'center');
          if (route === 1) {
            originalEquation(
              ctx,
              api,
              'd(Q,C_1)=' + coarseDistances[1].toFixed(3),
              550,
              themeColors.cyan,
              37,
            );
            originalEquation(
              ctx,
              api,
              'd(Q,C_0)=' + coarseDistances[0].toFixed(3),
              650,
              themeColors.blue,
              37,
            );
          }
          originalFocus(ctx, api, 'retrieval-result', () =>
            originalText(
              ctx,
              api,
              'Opened-list winner: ?',
              1515,
              820,
              34,
              themeColors.yellow,
              'center',
            ),
          );
        } else {
          originalText(
            ctx,
            api,
            frame.probes +
              ' list' +
              (frame.probes === 1 ? '' : 's') +
              ' · ' +
              frame.candidates.length +
              ' / 6 documents',
            1515,
            425,
            32,
            themeColors.cyan,
            'center',
          );
          originalFocus(ctx, api, 'retrieval-result', () => {
            originalText(
              ctx,
              api,
              frame.resultKnown
                ? 'Winner: ' + ids[frame.selected] + ' · ' + messages[frame.selected].text
                : 'Scanned winner: pending',
              1515,
              560,
              29,
              frame.selected === exactNearestIndex ? themeColors.green : themeColors.pink,
              'center',
            );
            if (frame.resultKnown)
              originalEquation(
                ctx,
                api,
                'd(Q,' +
                  ids[frame.selected] +
                  ')=' +
                  distance(query, xy[frame.selected]).toFixed(3),
                650,
                themeColors.ink,
                35,
              );
          });
        }
        originalFocus(ctx, api, 'retrieval-work', () => {
          if (currentBeat === 2)
            originalText(
              ctx,
              api,
              frame.workKnown
                ? '3 centers + 4 documents = 7 comparisons'
                : 'Count routing and scanned documents',
              1515,
              935,
              25,
              themeColors.yellow,
              'center',
            );
        });
        originalFooter(
          ctx,
          api,
          currentBeat === 2
            ? 'Flat reference: 6 document comparisons · ANN recall@1 is agreement with that reference.'
            : 'Candidate pruning and semantic relevance are separate checks.',
        );
      }
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
  id: 'ivf',
  draw: drawIvf,
  cues: [
    'ivf-route',
    'ivf-predict',
    'cp-ivf-0-0',
    'cp-ivf-0-1',
    'cp-ivf-0-2',
    'cp-ivf-0-3',
    'cp-ivf-0-4',
    'ivf-one',
    'ivf-reference',
    'cp-ivf-1-0',
    'cp-ivf-1-1',
    'cp-ivf-1-2',
    'cp-ivf-1-3',
    'cp-ivf-1-4',
    'ivf-two',
    'ivf-work',
    'cp-ivf-2-0',
    'cp-ivf-2-1',
    'cp-ivf-2-2',
    'cp-ivf-2-3',
    'cp-ivf-2-4',
  ],
};
