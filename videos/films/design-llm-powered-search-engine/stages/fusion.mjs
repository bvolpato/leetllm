import { sampleModel } from '../model.mjs';
import { originalText } from '../defaults.mjs';
export function drawFusion(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('fusion', state);
  {
    const colors = [themeColors.blue, themeColors.cyan, themeColors.pink];
    modelState.lists.forEach((list, i) => {
      originalText(ctx, api, ['Lexical', 'Dense', 'Rewrite'][i], 170, 350 + i * 150, 31, colors[i]);
      api.focus.target('fusion-list-map-doc-rank-doc-rank-1-1-61-rank', () =>
        api.focus.target('fusion-' + ['lexical', 'dense', 'rewrite'][i] + '-list', () =>
          teaching.grid({
            x: 550,
            y: 295 + i * 150,
            width: 1150,
            height: 105,
            rows: 1,
            columns: 2,
            labels: [list.map((doc, rank) => doc + '\nrank ' + (rank + 1) + ' → 1/' + (61 + rank))],
            fill: themeColors.panel,
            stroke: colors[i],
            textColor: themeColors.ink,
            fontSize: 27,
          }),
        ),
      );
    });
    const current = modelState.active.at(-1);
    originalText(
      ctx,
      api,
      current
        ? 'Current contribution: ' +
            ['Lexical', 'Dense', 'Rewrite'][current.branch] +
            ' / ' +
            current.doc +
            ' / 1/' +
            (60 + current.rank)
        : 'Accumulate each ranked-list contribution once',
      960,
      790,
      29,
      themeColors.muted,
      'center',
    );
    ['Policy', 'Exception'].forEach((doc, i) =>
      api.focus.target('fusion-' + doc.toLowerCase() + '-total', () => {
        const x = 250 + i * 850;
        let cursor = x;
        for (const row of modelState.active.filter((row) => row.doc === doc)) {
          const width = (row.value / 0.05) * 650;
          api.rect(ctx, cursor, 845, width, 45, colors[row.branch]);
          cursor += width;
        }
        originalText(
          ctx,
          api,
          doc + ' ' + modelState.scores[doc].toFixed(5),
          x + 325,
          945,
          36,
          themeColors.yellow,
          'center',
        );
      }),
    );
    const leader = modelState.scores.Policy > modelState.scores.Exception ? 'Policy' : 'Exception';
    const branch = ['lexical', 'dense', 'authorized rewrite'][modelState.active.at(-1)?.branch];
    originalText(
      ctx,
      api,
      !modelState.count
        ? 'Add each rank contribution once'
        : modelState.count % 2
          ? 'Partial branch sum · next rank contribution pending'
          : Math.abs(modelState.scores.Policy - modelState.scores.Exception) < 1e-12
            ? 'Tie after the current complete branches'
            : `${leader} ranks first after the ${branch} branch`,
      960,
      1030,
      26,
      themeColors.muted,
      'center',
    );
  }
}

// These local models mirror the article fixtures; no provider or retrieval service runs here.
export default {
  id: 'fusion',
  draw: drawFusion,
  cues: [
    'fusion-beat-1-focus-1',
    'fusion-beat-1-focus-2',
    'fusion-beat-2-focus-1',
    'fusion-beat-2-focus-2',
  ],
};
