import { common } from '../arithmetic.mjs';
import { a, z } from '../fixtures.mjs';
import { cueComplete, cueProgress, sgComplete } from '../construction.mjs';
import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawRadix(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('radix', state),
    currentBeat = modelState.b;
  {
    const split =
        currentBeat > 1
          ? 1
          : currentBeat === 1
            ? cueProgress(state.cues, 'radix-beat-2-focus-2', modelState.q)
            : 0,
      tracked = common(a, z),
      edgeWidth = 1180 + (540 - 1180) * split;
    api.focus.target('radix-query', () =>
      text(
        ctx,
        api,
        'Query: ' + modelState.query.join(' '),
        960,
        285,
        36,
        themeColors.yellow,
        'center',
      ),
    );
    const root = api.focus.target('radix-root', () =>
      card(ctx, api, 'Root', 130, 500, 210, themeColors.muted),
    );
    const prefix = api.focus.target('radix-common-edge', () => {
      if (split === 0 || split === 1)
        api.rect(ctx, 550, 480, edgeWidth, 110, themeColors.panel, themeColors.cyan, 8);
      a.slice(0, tracked).forEach((word, i) => {
        const x = 550 + (i + 0.5) * (1180 / 7) * (1 - split) + (i + 0.5) * (540 / 4) * split;
        text(ctx, api, word, x, 535, 28, themeColors.cyan, 'center');
      });
      return {
        x: 550,
        y: 480,
        width: edgeWidth,
        height: 110,
      };
    });
    api.circle(ctx, 540, 535, 6, themeColors.cyan);
    api.arrow(ctx, 350, 550, 525, 535, themeColors.cyan, 3);
    api.focus.target('radix-existing-suffix', () => {
      if (split === 1) api.rect(ctx, 1320, 390, 450, 110, themeColors.panel, themeColors.blue, 8);
      a.slice(tracked).forEach((word, i) => {
        const x = (550 + ((i + tracked + 0.5) * 1180) / 7) * (1 - split) + (1395 + i * 150) * split,
          y = 535 + (445 - 535) * split;
        text(ctx, api, word, x, y, 28, themeColors.blue, 'center');
      });
      return {
        x: 1320,
        y: 390,
        width: 450,
        height: 110,
      };
    });
    if (currentBeat > 0) {
      const branch = api.focus.target('radix-new-suffix', () => {
        if (split === 1) api.rect(ctx, 1320, 680, 450, 110, themeColors.panel, themeColors.pink, 8);
        z.slice(tracked).forEach((word, i) => {
          text(
            ctx,
            api,
            word,
            1395 + i * 150,
            860 + (735 - 860) * split,
            28,
            split > 0 ? themeColors.pink : themeColors.muted,
            'center',
          );
        });
        return {
          x: 1320,
          y: 680,
          width: 450,
          height: 110,
        };
      });
      if (split === 1) {
        api.arrow(ctx, 1105, 535, 1310, 445, themeColors.blue, 3);
        api.arrow(ctx, 1105, 550, 1310, 735, themeColors.pink, 3);
      }
    }
    if (currentBeat > 0) {
      teaching.grid({
        x: 550,
        y: 635,
        width: 540,
        height: 58,
        rows: 1,
        columns: 4,
        labels: [['p0', 'p1', 'p2', 'p3']],
        fontSize: 25,
        fill: themeColors.panel,
        stroke: themeColors.cyan,
        textColor: themeColors.cyan,
      });
      teaching.grid({
        x: 550,
        y: 730,
        width: 540,
        height: 58,
        rows: 1,
        columns: 4,
        labels: [['KV12', 'KV13', 'KV14', 'KV15']],
        fontSize: 23,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        textColor: themeColors.blue,
      });
      for (let i = 0; i < 4; i++)
        api.arrow(ctx, 617 + i * 135, 698, 617 + i * 135, 722, themeColors.cyan, 2);
    }
    const matchReady =
      currentBeat === 0
        ? sgComplete(state, 'radix-match-four')
        : currentBeat === 1 || sgComplete(state, 'radix-match-one');
    const namespaceReady = cueComplete(state.cues, 'radix-beat-3-focus-2');
    api.focus.target('radix-match-count', () =>
      text(
        ctx,
        api,
        (currentBeat === 1 && split === 1
          ? 'Post-insertion lookup: '
          : 'Existing leading match: ') +
          (matchReady
            ? currentBeat === 1 && split < 1
              ? tracked
              : modelState.matched
            : 'pending'),
        960,
        875,
        37,
        matchReady ? themeColors.green : themeColors.muted,
        'center',
      ),
    );
    if (currentBeat === 1)
      text(
        ctx,
        api,
        'Same shared positions ' + tracked + ' · source references12–15 survive the split',
        960,
        940,
        29,
        themeColors.cyan,
        'center',
      );
    if (currentBeat === 2)
      api.focus.target('radix-cache-namespace', () =>
        card(
          ctx,
          api,
          'Stored namespace: model R7 / adapter A · request adapter ' +
            (modelState.namespaceChanged ? 'B' : 'A') +
            ' → ' +
            (namespaceReady ? modelState.compatibleMatched + ' reusable tokens' : 'reuse pending'),
          150,
          955,
          1620,
          namespaceReady
            ? modelState.namespaceChanged
              ? themeColors.pink
              : themeColors.green
            : themeColors.muted,
          80,
        ),
      );
    else
      text(
        ctx,
        api,
        'Constructed one-word tokens · compatible cache namespace',
        960,
        1020,
        29,
        themeColors.muted,
        'center',
      );
  }
}
export default {
  id: 'radix',
  draw: drawRadix,
  cues: [
    'radix-beat-1-focus-1',
    'sg-radix-match-four',
    'sg-radix-match-one',
    'radix-beat-2-focus-1',
    'radix-beat-2-focus-2',
    'radix-insert-path',
    'radix-beat-3-focus-1',
    'radix-beat-3-focus-2',
  ],
};
