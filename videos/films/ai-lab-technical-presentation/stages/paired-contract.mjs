import { chapterText, focusTargets, footer, panel, sheet } from '../defaults.mjs';
export function drawPairedContract(ctx, scene, state, api) {
  const { C: theme, teaching: teaching } = api,
    themeColors = {
      ...theme,
      purple: '#b7a2f7',
    },
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    if (currentBeat === 0) {
      chapterText(
        ctx,
        api,
        'One query · top-five result identities',
        960,
        285,
        32,
        themeColors.ink,
        'center',
      );
      const retrieved = ['A', 'C', 'D', 'E', 'F'],
        relevant = progress < 0.45 ? ['A'] : ['A', 'B', 'C'];
      retrieved.forEach((id, i) => {
        panel(
          ctx,
          api,
          180 + i * 320,
          420,
          245,
          135,
          relevant.includes(id) ? themeColors.green : themeColors.muted,
        );
        chapterText(
          ctx,
          api,
          id,
          302 + i * 320,
          500,
          42,
          relevant.includes(id) ? themeColors.green : themeColors.muted,
          'center',
        );
      });
      chapterText(
        ctx,
        api,
        `Relevant labels: {${relevant.join(', ')}}`,
        960,
        665,
        33,
        themeColors.cyan,
        'center',
      );
      const found = relevant.filter((id) => retrieved.includes(id)).length;
      focusTargets(ctx, api, ['retrieval-recall'], () => {
        chapterText(
          ctx,
          api,
          `Hit@5 = ${Number(found > 0)}`,
          530,
          805,
          41,
          themeColors.green,
          'center',
        );
        chapterText(
          ctx,
          api,
          `Recall@5 = ${found}/${relevant.length}`,
          1400,
          805,
          41,
          found === relevant.length ? themeColors.green : themeColors.yellow,
          'center',
        );
      });
      chapterText(
        ctx,
        api,
        'Illustrative label-set change · result positions remain fixed',
        960,
        920,
        27,
        themeColors.muted,
        'center',
      );
    } else if (currentBeat === 1) {
      focusTargets(ctx, api, ['paired-inputs'], () => {
        sheet(ctx, api, 180, 350, 1560, 535, 'Paired experiment identity', themeColors.blue);
        ['query text + IDs', 'relevance labels', 'corpus revision', 'tenant permissions'].forEach(
          (v, i) => {
            chapterText(ctx, api, v, 245, 490 + i * 88, 32, themeColors.cyan);
            chapterText(ctx, api, 'same before / after', 1185, 490 + i * 88, 29, themeColors.muted);
          },
        );
      });
    } else {
      focusTargets(ctx, api, ['paired-regressions'], () => {
        teaching.grid({
          x: 450,
          y: 370,
          width: 1100,
          height: 370,
          rows: 2,
          columns: 2,
          labels: [
            ['140 both', '8 regressions'],
            ['22 improvements', '30 neither'],
          ],
          fontSize: 38,
          textColor: themeColors.ink,
          fill: themeColors.panel,
          stroke: themeColors.muted,
          highlights: [
            {
              row: 0,
              column: 1,
              fill: '#ef9ac82b',
              stroke: themeColors.pink,
            },
          ],
        });
        chapterText(
          ctx,
          api,
          '148 = 140 + 8       162 = 140 + 22',
          960,
          830,
          35,
          themeColors.yellow,
          'center',
        );
        chapterText(
          ctx,
          api,
          'Net change = 22 improvements − 8 regressions',
          960,
          920,
          30,
          themeColors.yellow,
          'center',
        );
      });
    }
    footer(ctx, api, 'Frozen labels and permissions define the comparison population');
  }
}
export default {
  id: 'paired-contract',
  draw: drawPairedContract,
  cues: ['retrieval-recall', 'paired-inputs', 'paired-regressions'],
};
