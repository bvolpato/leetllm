import { standard } from '../fixtures.mjs';
import { answerPriceConstruction } from '../construction.mjs';
import { card, equation, text } from '../defaults.mjs';
export function drawOneAnswer(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0);
  {
    const frame = answerPriceConstruction(state);
    if (state.cues) {
      frame.inputVisible = api.focus.visible('input-output-counts');
      frame.outputVisible = frame.inputVisible;
      frame.productsVisible = api.focus.visible('multiply-rates');
      frame.chargeProgress = api.focus.progress('multiply-rates', 0);
      frame.totalVisible = frame.chargeProgress === 1;
    }
    const rows = [
      {
        name: 'input',
        tokens: 1800,
        dollars: 0.0045,
        color: themeColors.cyan,
      },
      {
        name: 'output',
        tokens: 180,
        dollars: 0.0027,
        color: themeColors.pink,
      },
    ];
    rows.forEach((row, i) => {
      const y = 490 + i * 175;
      const visible = i === 0 ? frame.inputVisible : frame.outputVisible;
      api.focus.target('usage-receipts', () =>
        card(
          ctx,
          api,
          visible ? `${row.name} · ${row.tokens.toLocaleString()} tokens` : `${row.name} receipt`,
          180,
          y,
          row.color,
          500,
          90,
        ),
      );
      const rate = i === 0 ? standard.input : standard.output;
      api.focus.target('dated-rates', () =>
        text(ctx, api, `$${rate.toFixed(2)} / million`, 940, y - 20, 29, row.color),
      );
      if (frame.productsVisible)
        api.focus.target('category-products', () =>
          equation(
            ctx,
            api,
            `${row.tokens} \\times ${rate} \\div 10^6`,
            1040,
            y + 62,
            33,
            row.color,
          ),
        );
      const w = ((490 * row.dollars) / 0.0045) * frame.chargeProgress;
      if (w > 0)
        api.focus.target('category-charges', () =>
          api.rect(ctx, 1270, y + 20, w, 34, row.color, undefined, 12),
        );
      if (frame.chargeProgress > 0)
        api.focus.target('category-charges', () =>
          api.teaching.changeCue(
            {
              x: 1445,
              y: y + 65,
              width: 315,
              height: 55,
              from: 0,
              to: row.dollars,
              progress: frame.chargeProgress,
              color: row.color,
              emphasis: frame.chargeProgress < 1 ? 1 : 0,
            },
            () =>
              text(
                ctx,
                api,
                `$${(row.dollars * frame.chargeProgress).toFixed(4)}`,
                1600,
                y + 107,
                34,
                row.color,
              ),
          ),
        );
    });
    api.focus.target('dated-rates', () =>
      text(
        ctx,
        api,
        'checked GPT-5.4 standard rate card · 2026-09-21',
        960,
        365,
        29,
        themeColors.muted,
      ),
    );
    if (frame.totalVisible)
      api.focus.target('total-charge', () =>
        equation(ctx, api, String.raw`C=0.0045+0.0027=0.0072`, 960, 875, 54, themeColors.yellow),
      );
    text(ctx, api, 'price = token count × rate ÷ one million', 960, 930, 30, themeColors.ink);
  }
}
export default {
  id: 'one-answer',
  draw: drawOneAnswer,
  cues: ['dated-rate-card', 'input-output-counts', 'multiply-rates', 'one-answer-total'],
};
