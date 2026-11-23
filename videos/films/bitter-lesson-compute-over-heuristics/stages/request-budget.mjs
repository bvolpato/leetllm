import { mechanismBox, mechanismFocus, mechanismText } from '../defaults.mjs';
export function drawRequestBudget(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = Math.max(0, Math.min(1, state.beatP ?? 0));
  const { C: themeColors } = api;
  mechanismFocus(ctx, api, 'request-budget-mechanism', () => {
    if (currentBeat === 0) {
      mechanismText(
        ctx,
        api,
        'Request-time search keeps the deployed weights fixed',
        960,
        275,
        38,
        themeColors.cyan,
        'center',
      );
      for (let i = 0; i < 16; i++)
        api.rect(
          ctx,
          280 + (i % 4) * 95,
          370 + Math.floor(i / 4) * 95,
          65,
          65,
          themeColors.panel,
          themeColors.muted,
          2,
        );
      mechanismText(ctx, api, 'Frozen checkpoint W', 450, 850, 34, themeColors.muted, 'center');
      for (let i = 0; i < 3; i++) {
        const y = 400 + i * 180;
        api.arrow(ctx, 800, 550, 1100, y + 40, themeColors.blue, 3);
        mechanismBox(ctx, api, 1160, y, 490, 85, themeColors.blue);
        mechanismText(
          ctx,
          api,
          'candidate ' + (i + 1),
          1405,
          y + 55,
          33,
          themeColors.blue,
          'center',
        );
      }
      mechanismText(
        ctx,
        api,
        'SFT or RL training changes a future checkpoint instead',
        960,
        1030,
        31,
        themeColors.yellow,
        'center',
      );
    } else if (currentBeat === 1) {
      mechanismText(
        ctx,
        api,
        'A weak verifier can reward an unsupported action',
        960,
        275,
        38,
        themeColors.yellow,
        'center',
      );
      [
        ['Trace and block', themeColors.green],
        ['Delete evaluation report', themeColors.pink],
      ].forEach(([name, col], i) => {
        const y = 440 + i * 260;
        mechanismText(ctx, api, name, 400, y, 34, col, 'center');
        mechanismText(
          ctx,
          api,
          'run R42 + citation precision',
          1170,
          y,
          32,
          themeColors.blue,
          'center',
        );
        mechanismText(ctx, api, 'ID score 2', 1170, y + 100, 38, col, 'center');
      });
      mechanismText(
        ctx,
        api,
        'Evidence IDs do not establish action support or permission',
        960,
        1030,
        31,
        themeColors.yellow,
        'center',
      );
    } else {
      mechanismText(
        ctx,
        api,
        'Supplied work-unit ledger · not a metered FLOP count',
        960,
        275,
        36,
        themeColors.yellow,
        'center',
      );
      const parts = [
        ['input', 12],
        ['difficulty / routing', 3],
        ['all candidates', 40],
        ['verification', 8],
        ['visible output', 7],
      ];
      let x = 240,
        sum = 0;
      parts.forEach(([name, value], i) => {
        const w = value * 20;
        api.rect(
          ctx,
          x,
          440,
          w,
          110,
          [
            themeColors.blue,
            themeColors.cyan,
            themeColors.pink,
            themeColors.yellow,
            themeColors.green,
          ][i],
        );
        mechanismText(ctx, api, value, x + w / 2, 510, 35, themeColors.bg, 'center');
        mechanismText(
          ctx,
          api,
          name,
          280 + i * 345,
          730,
          28,
          [
            themeColors.blue,
            themeColors.cyan,
            themeColors.pink,
            themeColors.yellow,
            themeColors.green,
          ][i],
          'center',
        );
        x += w;
        sum += value;
      });
      mechanismText(
        ctx,
        api,
        'Total = ' + sum + ' supplied units',
        960,
        900,
        42,
        themeColors.green,
        'center',
      );
      mechanismText(
        ctx,
        api,
        'Compare untouched tasks, failures, useful outcomes, latency and total cost',
        960,
        1030,
        30,
        themeColors.muted,
        'center',
      );
    }
  });
  return;
}
export default {
  id: 'request-budget',
  draw: drawRequestBudget,
  cues: ['request-budget-b1', 'request-budget-b2', 'request-budget-b3'],
};
