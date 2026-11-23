import { cueProgress } from '../construction.mjs';
import { retainedSceneSnapshot, retainedTrace } from '../model.mjs';
import { card, detailText, text } from '../defaults.mjs';
export function drawHierarchyBeam(ctx, scene, state, api) {
  const { C: themeColors, teaching } = api, beat = state.beat ?? 0;
  if (drawRetainedQueues(ctx, scene, state, api)) return;
  {
    if (beat === 0) {
      api.focus.target('graph-search', () =>
        teaching.flowGraph({
          nodes: [
            {
              id: 'eTop',
              label: 'E: sparse layer',
              x: 230,
              y: 330,
              width: 340,
              height: 85,
              color: themeColors.blue,
            },
            {
              id: 'aTop',
              label: 'A: sparse layer',
              x: 1250,
              y: 330,
              width: 340,
              height: 85,
              color: themeColors.green,
            },
            {
              id: 'eBase',
              label: 'E: base layer',
              x: 230,
              y: 680,
              width: 340,
              height: 85,
              color: themeColors.blue,
            },
            {
              id: 'cBase',
              label: 'C: base layer',
              x: 740,
              y: 680,
              width: 340,
              height: 85,
              color: themeColors.cyan,
            },
            {
              id: 'aBase',
              label: 'A: base layer',
              x: 1250,
              y: 680,
              width: 340,
              height: 85,
              color: themeColors.green,
            },
          ],
          edges: [
            {
              from: 'eTop',
              to: 'aTop',
              progress: cueProgress(state, 'upper-hop'),
            },
            {
              from: 'aTop',
              to: 'aBase',
              progress: cueProgress(state, 'descend-at-a'),
            },
            {
              from: 'eBase',
              to: 'cBase',
            },
            {
              from: 'cBase',
              to: 'aBase',
            },
          ],
        }),
      );
    } else {
      const { current } = retainedSceneSnapshot(state),
        names = ['entry', 'bridge', 'best'];
      api.focus.target('graph-search', () =>
        teaching.flowGraph({
          nodes: [
            {
              id: 'start',
              label: 'entry · score 1.0',
              x: 180,
              y: 400,
              width: 390,
              height: 100,
              color: themeColors.blue,
            },
            {
              id: 'bridge',
              label: 'bridge · score 2.0',
              x: 765,
              y: 400,
              width: 390,
              height: 100,
              color:
                current.discarded === 1
                  ? themeColors.pink
                  : current.visited.includes(1)
                    ? themeColors.yellow
                    : themeColors.muted,
            },
            {
              id: 'best',
              label: current.visited.includes(2) ? 'H · score 0.1' : 'H · unscored',
              x: 1350,
              y: 400,
              width: 390,
              height: 100,
              color: current.visited.includes(2) ? themeColors.green : themeColors.muted,
            },
          ],
          edges: [
            {
              from: 'start',
              to: 'bridge',
              progress: current.visited.includes(1) ? 1 : 0,
            },
            {
              from: 'bridge',
              to: 'best',
              progress: current.visited.includes(2) ? 1 : 0,
            },
          ],
        }),
      );
      api.focus.target('retained-set', () =>
        card(
          ctx,
          api,
          'Retained: ' + current.retained.map((i) => names[i]).join(' · '),
          270,
          605,
          1380,
          themeColors.cyan,
          85,
          29,
        ),
      );
      api.focus.target('search-work', () =>
        text(
          ctx,
          api,
          'Distance evaluations: ' + current.comparisons + ' / 3',
          960,
          765,
          34,
          themeColors.yellow,
          'center',
        ),
      );
      if (beat === 2) api.focus.target('search-work', () =>
        text(ctx, api, 'Narrow run: 1 retained slot, 2 distances scored', 960, 970, 32, themeColors.muted, 'center'));
      text(
        ctx,
        api,
        current.discarded === 1
          ? 'Bridge evaluated, then discarded before expansion'
          : current.visited.includes(2)
            ? 'Retained bridge exposes the best node'
            : 'Retain candidates before choosing the next expansion',
        960,
        855,
        32,
        current.discarded === 1 ? themeColors.pink : themeColors.green,
        'center',
      );
    }
  }
}
function drawRetainedQueues(ctx, scene, state, api) {
  const ext = (state.beat ?? 0) === 3;
  if (!ext) return false;
  const { C: themeColors } = api,
    progress = api.clamp(state.beatP ?? 0, 0, 1);
  const target = 'hierarchy-beam-extension';
  api.focus.target(target, () => {
    {
      const history = retainedTrace(3),
        ix = Math.min(history.length - 1, Math.floor(progress * history.length)),
        s = history[ix],
        names = ['E  d²=1', 'M  d²=2', 'H  d²=0.1'];
      detailText(
        ctx,
        api,
        'Nearest-first expansion queue',
        520,
        300,
        36,
        themeColors.cyan,
        'center',
      );
      detailText(
        ctx,
        api,
        'Worst-first retained results',
        1420,
        300,
        36,
        themeColors.yellow,
        'center',
      );
      [
        s.queue.slice().sort((a, b) => [1, 2, 0.1][a] - [1, 2, 0.1][b]),
        s.retained.slice().sort((a, b) => [1, 2, 0.1][b] - [1, 2, 0.1][a]),
      ].forEach((rows, j) =>
        rows.forEach((id, i) => {
          api.rect(
            ctx,
            220 + j * 900,
            380 + i * 150,
            600,
            100,
            themeColors.panel,
            j ? themeColors.yellow : themeColors.cyan,
            3,
            12,
          );
          detailText(
            ctx,
            api,
            names[id],
            520 + j * 900,
            443 + i * 150,
            40,
            j ? themeColors.yellow : themeColors.cyan,
            'center',
          );
        }),
      );
      detailText(
        ctx,
        api,
        'Pop nearest candidate · compare against farthest retained result',
        960,
        925,
        34,
        themeColors.ink,
        'center',
      );
      detailText(
        ctx,
        api,
        'Result capacity 3 · queue and visited work have separate sizes',
        960,
        1000,
        29,
        themeColors.muted,
        'center',
      );
    }
  });
  return true;
}
export default {
  id: 'hierarchy-beam',
  draw: drawHierarchyBeam,
  cues: [
    'hierarchy-beam-b1-1', 'upper-hop', 'descend-at-a',
    'hierarchy-beam-b2-1',
    'narrow-discards-bridge',
    'wide-retained-bridge',
    'hierarchy-beam-b3-1',
    'reach-hidden',
    'hierarchy-beam-b3-extension',
  ],
};
