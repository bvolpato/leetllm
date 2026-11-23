import { centerText, cueProgress, equation, line, note, rectangle } from '../defaults.mjs';
export function drawSpendBudget(ctx, scene, state, api) {
  const { C: themeColors } = api,
    rawBeat = state.beat ?? 0,
    currentBeat = rawBeat,
    done = (id) => cueProgress(ctx, api, id) === 1;
  api.focus.target('spend-budget-mechanism', () => {
    if (currentBeat === 0) {
      const n = 3 + 6 * cueProgress(ctx, api, 'retry-layers');
      if (cueProgress(ctx, api, 'retry-cube') > 0) {
        for (let layer = 0; layer < 4; layer++)
          for (let i = 0; i < 16; i++) {
            const x = 250 + (layer % 2) * 340 + (i % 4) * 65,
              y = 365 + Math.floor(layer / 2) * 270 + Math.floor(i / 4) * 55;
            rectangle(ctx, api, x, y, 45, 35, themeColors.blue);
          }
        centerText(ctx, api, '4 ×4 ×4 possible sends', 600, 945, 31, themeColors.blue);
      } else
        for (let row = 0; row < 3; row++)
          for (let col = 0; col < 3; col++)
            rectangle(
              ctx,
              api,
              340 + col * 150,
              430 + row * 130,
              110,
              80,
              row * 3 + col < n ? themeColors.blue : themeColors.panel,
            );
      centerText(ctx, api, '3 attempts = initial +2 retries', 1300, 430, 35, themeColors.blue);
      if (done('retry-layers'))
        centerText(
          ctx,
          api,
          '2 layers ×3 attempts → bound9 sends',
          1300,
          610,
          33,
          themeColors.yellow,
        );
      if (done('retry-cube'))
        equation(ctx, api, String.raw`(1+3)^3=64`, 1300, 800, 47, themeColors.pink);
      note(ctx, api, 'Configured upper bounds · instrument actual sends; assign one retry owner');
    } else if (currentBeat === 1) {
      const show = cueProgress(ctx, api, 'token-prompts'),
        counts = [100, 150, 200, 250],
        arrived = Math.min(4, Math.floor(show * 4 + 1e-9)),
        total = counts.slice(0, arrived).reduce((a, x) => a + x, 0);
      counts.forEach((n, i) => {
        const y = 375 + i * 125;
        centerText(ctx, api, 'turn' + (i + 1), 250, y + 38, 31, themeColors.muted);
        if (i < arrived) {
          rectangle(ctx, api, 380, y, n * 3, 65, themeColors.blue);
          centerText(ctx, api, String(n), 380 + n * 3 + 70, y + 43, 32, themeColors.blue);
        }
      });
      for (let i = 0; i < 14; i++)
        rectangle(
          ctx,
          api,
          1370,
          335 + i * 39,
          220,
          28,
          i < total / 50 ? themeColors.cyan : themeColors.panel,
        );
      centerText(ctx, api, 'each slice 50 tokens', 1480, 285, 29, themeColors.cyan);
      if (done('token-total'))
        centerText(ctx, api, 'submitted inputs = 700', 1460, 925, 37, themeColors.green);
      equation(ctx, api, String.raw`nh+\frac{sn(n-1)}{2}`, 760, 935, 42);
      note(
        ctx,
        api,
        'Each prompt owns a context limit; cumulative input and output need separate accounting',
      );
    } else {
      centerText(ctx, api, 'Remaining run balance 150 tokens', 960, 285, 38, themeColors.yellow);
      rectangle(ctx, api, 270, 405, 900, 80, themeColors.panel);
      rectangle(ctx, api, 270, 405, 150 * 6, 80, themeColors.blue);
      const reserve = cueProgress(ctx, api, 'reserve-total');
      rectangle(ctx, api, 270, 610, 120 * 6 * reserve, 65, themeColors.cyan);
      rectangle(ctx, api, 990, 610, 80 * 6 * reserve, 65, themeColors.pink);
      centerText(ctx, api, 'input 120', 630, 740, 32, themeColors.cyan);
      centerText(ctx, api, 'output cap 80', 1230, 740, 32, themeColors.pink);
      line(ctx, api, 1170, 365, 1170, 710, themeColors.yellow, 4);
      if (done('reserve-total'))
        centerText(ctx, api, '200 > 150 → reject before dispatch', 960, 860, 40, themeColors.pink);
      note(
        ctx,
        api,
        'Atomic shared reservations · unknown usage stays reserved · compaction cannot refund earlier calls',
      );
    }
  });
}
export default {
  id: 'spend-budget',
  draw: drawSpendBudget,
  cues: ['retry-layers', 'retry-cube', 'token-total', 'token-prompts', 'reserve-total'],
};
