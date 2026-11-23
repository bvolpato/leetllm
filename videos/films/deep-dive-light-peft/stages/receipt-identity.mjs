import {
  chapterArrow,
  chapterFooter,
  chapterLine,
  chapterPanel,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawReceiptIdentity(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      beat === 2
        ? 'Resolve the commands before comparing costs'
        : 'Saved scores need an owned model and data identity',
    );
    if (beat === 0)
      focusScope(ctx, api, 'lp-files', () => {
        const names = [
          'attention masks · .npy',
          'FFN masks · .npy',
          'module / rank importance · pickle',
          'adapter weights · checkpoint',
        ];
        chapterPanel(
          ctx,
          api,
          themeColors,
          'estimate run R17',
          150,
          495,
          320,
          110,
          themeColors.blue,
        );
        names.forEach((s, i) => {
          chapterPanel(
            ctx,
            api,
            themeColors,
            s,
            720,
            330 + i * 150,
            850,
            88,
            i < 2 ? themeColors.cyan : themeColors.purple,
            31,
          );
          chapterArrow(
            ctx,
            api,
            themeColors,
            490,
            550,
            680,
            374 + i * 150,
            i < 2 ? themeColors.cyan : themeColors.purple,
          );
        });
      });
    if (beat === 1)
      focusScope(ctx, api, 'lp-receipt', () => {
        const rows = [
          ['source / base', '7b10c220… / revision R17'],
          ['data / tokenizer', 'task + revision + preprocessing'],
          ['resolved recipe', 'seed · precision · targets · commands'],
          ['artifact identity', 'hash every record + adapter bytes'],
          ['selected axes', 'original IDs → actual tensor shapes'],
        ];
        rows.forEach(([k, v], i) => {
          chapterText(ctx, api, themeColors, k, 200, 380 + i * 110, 28, themeColors.blue);
          chapterText(
            ctx,
            api,
            themeColors,
            v,
            700,
            380 + i * 110,
            30,
            i >= 3 ? themeColors.yellow : themeColors.ink,
          );
          chapterLine(
            ctx,
            api,
            themeColors,
            200,
            410 + i * 110,
            1700,
            410 + i * 110,
            themeColors.muted,
            1,
          );
        });
      });
    if (beat === 2)
      focusScope(ctx, api, 'lp-shells', () => {
        chapterText(
          ctx,
          api,
          themeColors,
          'published vanilla default',
          460,
          390,
          31,
          themeColors.blue,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'published estimate / continuation',
          1370,
          390,
          31,
          themeColors.purple,
          'center',
        );
        chapterPanel(ctx, api, themeColors, 'MNLI', 200, 470, 520, 100, themeColors.blue, 36);
        chapterPanel(ctx, api, themeColors, 'SST-2', 1110, 470, 520, 100, themeColors.purple, 36);
        chapterText(
          ctx,
          api,
          themeColors,
          'query + value targets',
          460,
          655,
          30,
          themeColors.blue,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'larger target set + other policies',
          1370,
          655,
          30,
          themeColors.purple,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'Align task, data, placement, optimizer and full budget first',
          960,
          865,
          33,
          themeColors.yellow,
          'center',
        );
      });
    chapterFooter(
      ctx,
      api,
      themeColors,
      'A familiar filename and equal row count do not identify the same run.',
    );
  }
}
export default {
  id: 'receipt-identity',
  draw: drawReceiptIdentity,
  cues: ['lp-write', 'lp-pickles', 'lp-bind', 'lp-selected', 'lp-shells'],
};
