import { contractText, cueComplete, cueProgress, rectangle } from '../defaults.mjs';
export function drawHistoricalEvidence(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.focus.target('historical-evidence-mechanism', () => {
    if (currentBeat === 0) {
      contractText(
        ctx,
        api,
        'Paper v3 · 11 May 2026 · separate benchmark slices',
        960,
        285,
        34,
        themeColors.muted,
      );
      const groups = [
        ['GPT-5 · OOLONG-Pairs F1', [58, 76], [1, 3], 'paper-depth'],
        ['Qwen3-Coder · CodeQA accuracy', [66, 56], [0, 1], 'paper-repl'],
        ['GPT-5 · CodeQA accuracy', [58, 66, 58], [0, 2, 3], 'paper-nonmonotonic'],
      ];
      groups.forEach(([name, values, depths, cue], i) => {
        const x = 340 + i * 620;
        contractText(ctx, api, name, x, 390, 29, themeColors.blue);
        values.forEach((v, j) => {
          const w = 420 / values.length,
            a = x - 190 + j * w;
          contractText(
            ctx,
            api,
            'Depth ' + depths[j],
            a + (w - 20) / 2,
            923,
            27,
            themeColors.muted,
          );
          rectangle(
            ctx,
            api,
            a,
            810 - v * 4 * cueProgress(ctx, api, cue),
            w - 20,
            v * 4 * cueProgress(ctx, api, cue),
            j ? themeColors.cyan : themeColors.blue,
          );
          if (cueComplete(ctx, api, cue))
            contractText(
              ctx,
              api,
              String(v),
              a + (w - 20) / 2,
              875,
              33,
              j ? themeColors.cyan : themeColors.blue,
            );
        });
      });
    } else if (currentBeat === 1) {
      contractText(
        ctx,
        api,
        'Historical GPT-5 average API costs · dollars',
        960,
        300,
        35,
        themeColors.muted,
      );
      [
        ['CodeQA', 0.13, 0.11],
        ['OOLONG-Pairs', 0.16, 0.33],
      ].forEach(([name, base, rlm], i) => {
        const x = 500 + i * 940;
        const cue = i ? 'paper-cost' : 'code-cost';
        contractText(ctx, api, name, x, 415, 35, themeColors.blue);
        [base, rlm].forEach((v, j) => {
          contractText(
            ctx,
            api,
            j ? 'Depth 1' : 'Base',
            x - 115 + j * 230,
            860,
            28,
            themeColors.muted,
          );
          rectangle(
            ctx,
            api,
            x - 200 + j * 230,
            820 - v * 1000 * cueProgress(ctx, api, cue),
            170,
            v * 1000 * cueProgress(ctx, api, cue),
            j ? themeColors.cyan : themeColors.blue,
          );
          if (cueComplete(ctx, api, cue))
            contractText(
              ctx,
              api,
              v.toFixed(2),
              x - 115 + j * 230,
              905,
              33,
              j ? themeColors.cyan : themeColors.blue,
            );
        });
      });
      contractText(
        ctx,
        api,
        'Base window failures + sequential provider calls limit the comparison',
        960,
        965,
        29,
        themeColors.pink,
      );
    } else if (currentBeat === 2) {
      contractText(
        ctx,
        api,
        '750 tasks → 2,250 candidate trajectories',
        960,
        300,
        35,
        themeColors.blue,
      );
      rectangle(ctx, api, 250, 430, 1400, 80, themeColors.panel);
      rectangle(
        ctx,
        api,
        250,
        430,
        1400 * (1 - (1 - 1072 / 2250) * cueProgress(ctx, api, 'training-filter')),
        80,
        themeColors.blue,
      );
      if (cueComplete(ctx, api, 'training-filter'))
        contractText(ctx, api, '1,072 trajectories retained', 960, 620, 39, themeColors.green);
      if (cueComplete(ctx, api, 'training-turns'))
        contractText(
          ctx,
          api,
          'Then filter root turns + repair protocol → SFT examples',
          960,
          770,
          32,
          themeColors.yellow,
        );
      if (cueComplete(ctx, api, 'relative-gain'))
        contractText(
          ctx,
          api,
          '28.3% median relative improvement across four tasks',
          960,
          925,
          30,
          themeColors.pink,
        );
    } else {
      const known = cueComplete(ctx, api, 'relative-example');
      const base = 40,
        gain = base * 0.25;
      contractText(
        ctx,
        api,
        'Separate example · one task starts at 40',
        960,
        330,
        41,
        themeColors.blue,
      );
      rectangle(ctx, api, 360, 465, base * 20, 90, themeColors.blue);
      const growth = api.focus.progress('relative-quarter', api.phase(state.beatP, 0.28, 0.53));
      if (growth > 0)
        rectangle(ctx, api, 360 + base * 20, 465, gain * 20 * growth, 90, themeColors.cyan);
      contractText(ctx, api, 'Starting score  40', 760, 650, 37, themeColors.blue);
      if (growth > 0) contractText(ctx, api, '+25% of 40', 1260, 650, 32, themeColors.cyan);
      contractText(
        ctx,
        api,
        known ? '40 + 10 = ' + (base + gain) : 'New score  ?',
        960,
        850,
        50,
        themeColors.yellow,
      );
    }
  });
}
export default {
  id: 'historical-evidence',
  draw: drawHistoricalEvidence,
  cues: [
    'paper-depth',
    'paper-repl',
    'paper-nonmonotonic',
    'code-cost',
    'paper-cost',
    'training-filter',
    'training-turns',
    'relative-gain',
    'relative-quarter',
    'relative-example',
  ],
};
