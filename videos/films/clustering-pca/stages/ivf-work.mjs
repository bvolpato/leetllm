import { xy } from '../fixtures.mjs';
import { distance, visibleLineSegments } from '../arithmetic.mjs';
import { directed } from '../model.mjs';
import { extensionMath, extensionNote, extensionText } from '../defaults.mjs';
export function drawIvfWork(ctx, scene, state, api) {
  return api.focus.target('ivf-work-construction', () => {
    {
      const { C: themeColors, teaching: teaching } = api,
        currentBeat = state.beat ?? 0;
      const labelBoxes = [],
        pendingSegments = [];
      const cueProgress = (beat, sentence) =>
          directed(state, `cp-ivf-work-${beat}-${sentence}`, beat),
        resultComplete = (beat, sentence) => cueProgress(beat, sentence) === 1;
      const colors = [themeColors.blue, themeColors.cyan, themeColors.pink, themeColors.green],
        ids = ['A', 'B', 'C', 'D', 'E', 'F'];
      {
        const uneven = currentBeat === 1 && cueProgress(1, 3) > 0,
          lists = uneven
            ? [[0], [1, 2, 3, 4], [5]]
            : [
                [0, 1],
                [2, 3],
                [4, 5],
              ],
          lengths = lists.map((v) => v.length),
          open = currentBeat === 0 ? Math.floor(3 * cueProgress(0, 1)) : currentBeat === 1 ? 2 : 3;
        extensionText(
          ctx,
          api,
          labelBoxes,
          uneven ? 'Separate uneven-list worksheet' : 'Explicit posting lists · full-vector mode',
          550,
          280,
          34,
          themeColors.cyan,
        );
        lists.forEach((list, k) => {
          const y = 405 + k * 165;
          extensionText(ctx, api, labelBoxes, 'C' + k, 160, y, 32, colors[k]);
          for (const [i, id] of list.entries()) {
            const x = 320 + i * 180;
            api.rect(
              ctx,
              x,
              y - 45,
              155,
              100,
              k < open ? themeColors.panel : 'transparent',
              k < open ? colors[k] : themeColors.muted,
              2,
            );
            extensionText(
              ctx,
              api,
              labelBoxes,
              ids[id],
              x + 77,
              y - 8,
              28,
              k < open ? colors[k] : themeColors.muted,
            );
            extensionText(
              ctx,
              api,
              labelBoxes,
              '[' + xy[id].join(',') + ']',
              x + 77,
              y + 33,
              22,
              themeColors.muted,
            );
          }
        });
        if (currentBeat === 0) {
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Open ' + open + ' / 3 lists',
            1490,
            375,
            36,
            themeColors.yellow,
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            open === 3 ? 'All 6 candidate IDs recovered' : 'Open lists contain candidate IDs',
            1490,
            535,
            29,
            themeColors.cyan,
          );
          if (resultComplete(0, 2))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Compressed-code errors can still change ranking',
              1490,
              725,
              28,
              themeColors.pink,
            );
        } else if (currentBeat === 1) {
          extensionMath(
            ctx,
            api,
            String.raw`N_{\rm scan}=N\,n_{\rm probe}/K`,
            1450,
            355,
            42,
            themeColors.cyan,
          );
          if (resultComplete(1, 1))
            extensionMath(
              ctx,
              api,
              String.raw`W=K+N_{\rm scan}`,
              1450,
              495,
              43,
              themeColors.yellow,
            );
          if (resultComplete(1, 2))
            extensionText(
              ctx,
              api,
              labelBoxes,
              '16 / 4096 = ' + ((100 * 16) / 4096).toFixed(4) + '%',
              1450,
              630,
              35,
              themeColors.green,
            );
          if (cueProgress(1, 3) > 0)
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Uneven lists: ' +
                lengths.slice(0, open).join(' + ') +
                ' = ' +
                lengths.slice(0, open).reduce((a, v) => a + v, 0),
              1450,
              785,
              31,
              themeColors.yellow,
            );
          if (resultComplete(1, 4))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Fixed K and probes: work ∝ N',
              1450,
              925,
              29,
              themeColors.muted,
            );
        } else {
          const q = [4.1, 4.1],
            near = distance(q, xy[2]),
            reviewed = distance(q, xy[1]);
          extensionText(
            ctx,
            api,
            labelBoxes,
            'Separate supplied query [4.1,4.1]',
            1430,
            265,
            29,
            themeColors.yellow,
          );
          extensionText(
            ctx,
            api,
            labelBoxes,
            'User asks: duplicate charge',
            1430,
            325,
            29,
            themeColors.yellow,
          );
          if (resultComplete(2, 0))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'ANN returns C · exact neighbor C',
              1450,
              395,
              32,
              themeColors.green,
            );
          if (resultComplete(2, 1))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'Reviewed relevant reply: B',
              1450,
              490,
              32,
              themeColors.blue,
            );
          if (resultComplete(2, 2))
            extensionText(
              ctx,
              api,
              labelBoxes,
              'ANN recall 1/1 · semantic recall 0/1',
              1450,
              590,
              30,
              themeColors.pink,
            );
          teaching.bars({
            x: 1210,
            y: 720,
            width: 540,
            height: 175,
            values: [near, reviewed],
            labels: ['C · reset link', 'B · duplicate'],
            colors: [themeColors.cyan, themeColors.blue],
            max: 4,
            showValues: true,
            format: (v) => v.toFixed(3),
            fontSize: 24,
            gap: 90,
            progress: 1,
          });
        }
        extensionNote(
          ctx,
          api,
          labelBoxes,
          'List enumeration and distance precision are separate; work counts do not establish measured latency.',
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
  id: 'ivf-work',
  draw: drawIvfWork,
  cues: [
    'cp-ivf-work-0-0',
    'cp-ivf-work-0-1',
    'cp-ivf-work-0-2',
    'cp-ivf-work-0-3',
    'cp-ivf-work-1-0',
    'cp-ivf-work-1-1',
    'cp-ivf-work-1-2',
    'cp-ivf-work-1-3',
    'cp-ivf-work-1-4',
    'cp-ivf-work-2-0',
    'cp-ivf-work-2-1',
    'cp-ivf-work-2-2',
    'cp-ivf-work-2-3',
  ],
};
