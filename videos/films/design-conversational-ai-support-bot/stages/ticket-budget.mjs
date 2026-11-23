import { supportCost } from '../arithmetic.mjs';
import {
  drawSupportFooter,
  drawSupportHeading,
  drawSupportLine,
  drawSupportRectangle,
  drawSupportText,
  supportCueProgress,
  supportCueVisible,
  withSupportFocus,
} from '../defaults.mjs';
export function drawTicketBudget(ctx, scene, state, api) {
  const currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => state.cues?.[id]?.phase === 'after',
    begun = (id) => Boolean(state.cues?.[id] && state.cues[id].phase !== 'before');
  const { C: themeColors } = api;
  {
    const bills = [supportCost(2000, 1280, 130), supportCost(2170, 1920, 130)];
    if (currentBeat === 0) {
      drawSupportHeading(ctx, api, 'A separate supplied budget fixture · dated rates');
      drawSupportText(
        ctx,
        api,
        'Task cap $0.020 · per generation $0.010 · 2 attempts · 2500 ms',
        960,
        355,
        30,
        themeColors.yellow,
        'center',
      );
      withSupportFocus(ctx, api, 'budget-inputs', () => {
        const active = supportCueVisible(ctx, api, 'budget-inputs');
        [
          ['Fresh input', '$2.50 / million', themeColors.blue],
          ['Cached input', '$0.25 / million', themeColors.cyan],
          ['Output', '$15.00 / million', themeColors.pink],
        ].forEach(([name, rate, col], i) => {
          drawSupportRectangle(
            ctx,
            api,
            150 + i * 570,
            440,
            480,
            235,
            active ? col : themeColors.muted,
          );
          drawSupportText(
            ctx,
            api,
            name,
            390 + i * 570,
            510,
            31,
            active ? col : themeColors.muted,
            'center',
          );
          if (active) drawSupportText(ctx, api, rate, 390 + i * 570, 600, 32, col, 'center');
        });
      });
      withSupportFocus(ctx, api, 'fresh-minus-cache', () => {
        if (supportCueVisible(ctx, api, 'fresh-minus-cache')) {
          drawSupportText(
            ctx,
            api,
            'Fresh = total input − cached reads',
            960,
            790,
            40,
            themeColors.yellow,
            'center',
          );
          drawSupportText(
            ctx,
            api,
            'Charge = (fresh × 2.50 + cached × 0.25 + output × 15) / 1,000,000',
            960,
            900,
            29,
            themeColors.ink,
            'center',
          );
        }
      });
      drawSupportFooter(
        ctx,
        api,
        'These rates are fixture inputs. Actual provider usage still needs reconciliation.',
      );
    } else if (currentBeat === 1) {
      drawSupportHeading(ctx, api, 'Construct each charge from disjoint token categories');
      const x = 650,
        scale = 100000;
      ['First draft', 'One revision'].forEach((name, i) => {
        const y = 380 + i * 180,
          show = done(i ? 'revision-bill' : 'first-bill'),
          bill = bills[i];
        drawSupportText(ctx, api, name, 160, y + 50, 31, themeColors.ink);
        drawSupportText(
          ctx,
          api,
          show
            ? i
              ? '2170 − 1920 cached = 250 fresh'
              : '2000 − 1280 cached = 720 fresh'
            : i
              ? '2170 input · 1920 cached · 130 output'
              : '2000 input · 1280 cached · 130 output',
          160,
          y + 100,
          24,
          themeColors.muted,
        );
        let offset = x;
        [
          [bill.freshCost, themeColors.blue],
          [bill.cacheCost, themeColors.cyan],
          [bill.outputCost, themeColors.pink],
        ].forEach(([v, col]) => {
          if (supportCueProgress(ctx, api, i ? 'revision-bill' : 'first-bill') > 0)
            drawSupportRectangle(
              ctx,
              api,
              offset,
              y + 15,
              v * scale * supportCueProgress(ctx, api, i ? 'revision-bill' : 'first-bill'),
              55,
              col,
              col,
            );
          offset += v * scale * supportCueProgress(ctx, api, i ? 'revision-bill' : 'first-bill');
        });
        withSupportFocus(ctx, api, i ? 'revision-bill' : 'first-bill', () => {
          if (begun(i ? 'revision-bill' : 'first-bill'))
            drawSupportText(
              ctx,
              api,
              show ? '$' + bill.total.toFixed(6) : 'Computing charge',
              offset + 35,
              y + 57,
              show ? 31 : 27,
              show ? themeColors.green : themeColors.muted,
            );
        });
      });
      if (
        (begun('first-bill') && !done('first-bill')) ||
        (begun('revision-bill') && !done('revision-bill'))
      )
        drawSupportText(
          ctx,
          api,
          'Constructing charge · bars are partial until the spoken result ends',
          960,
          715,
          24,
          themeColors.muted,
          'center',
        );
      drawSupportText(ctx, api, 'Fresh input', 725, 760, 24, themeColors.blue, 'center');
      drawSupportText(ctx, api, 'Cached reads', 1000, 760, 24, themeColors.cyan, 'center');
      drawSupportText(ctx, api, 'Output', 1220, 760, 24, themeColors.pink, 'center');
      withSupportFocus(ctx, api, 'total-bill', () => {
        if (done('total-bill'))
          drawSupportText(
            ctx,
            api,
            'Actual supplied total: $' + (bills[0].total + bills[1].total).toFixed(6),
            960,
            835,
            34,
            themeColors.yellow,
            'center',
          );
        else if (begun('total-bill'))
          drawSupportText(
            ctx,
            api,
            'Combining the two charges',
            960,
            835,
            30,
            themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'reserve-bill', () => {
        if (done('reserve-bill'))
          drawSupportText(
            ctx,
            api,
            'Conservative holds: $0.009500 + $0.009925 < $0.020000',
            960,
            900,
            29,
            themeColors.blue,
            'center',
          );
        else if (begun('reserve-bill'))
          drawSupportText(
            ctx,
            api,
            'Computing conservative input/output holds',
            960,
            900,
            29,
            themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'budget-time', () => {
        if (done('budget-time'))
          drawSupportText(
            ctx,
            api,
            '180 + 940 + 10 + 940 + 10 = 2080 ms · 420 ms remain',
            960,
            955,
            28,
            themeColors.cyan,
            'center',
          );
        else if (begun('budget-time'))
          drawSupportText(
            ctx,
            api,
            'Building the elapsed-time sum',
            960,
            955,
            28,
            themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'monthly-bill', () => {
        if (done('monthly-bill'))
          drawSupportFooter(ctx, api, 'Revision only: $0.003055 × 50 × 30 = $4.5825');
        else if (begun('monthly-bill'))
          drawSupportFooter(ctx, api, 'Monthly revision allocation pending');
      });
    } else {
      drawSupportHeading(ctx, api, 'A timeout keeps its uncertain spend reserved');
      const reserved = done('unknown-reserve'),
        fallback = done('fallback-bill'),
        total = done('fallback-total'),
        time = done('fallback-time');
      drawSupportText(
        ctx,
        api,
        'Task ceiling $0.020000',
        960,
        355,
        31,
        themeColors.yellow,
        'center',
      );
      drawSupportLine(ctx, api, 240, 470, 1680, 470, themeColors.muted, 4);
      drawSupportRectangle(ctx, api, 240, 430, 1440, 80, themeColors.muted);
      withSupportFocus(ctx, api, 'unknown-reserve', () => {
        if (reserved) {
          drawSupportRectangle(ctx, api, 240, 430, 684, 80, themeColors.yellow, themeColors.yellow);
          drawSupportText(
            ctx,
            api,
            'Unknown usage · hold $0.009500',
            580,
            585,
            30,
            themeColors.yellow,
            'center',
          );
        } else if (begun('unknown-reserve'))
          drawSupportText(
            ctx,
            api,
            'Unknown spend · reservation amount pending',
            580,
            585,
            27,
            themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'fallback-bill', () => {
        if (fallback) {
          drawSupportRectangle(ctx, api, 924, 430, 500.4, 80, themeColors.blue, themeColors.blue);
          drawSupportText(
            ctx,
            api,
            'Fallback charge · $0.006950',
            1290,
            650,
            30,
            themeColors.blue,
            'center',
          );
        } else if (begun('fallback-bill'))
          drawSupportText(
            ctx,
            api,
            'Computing fallback charge',
            1290,
            650,
            29,
            themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'fallback-total', () => {
        if (total)
          drawSupportText(
            ctx,
            api,
            'Reserved + observed = $0.016450 · do not release the unknown hold',
            960,
            760,
            32,
            themeColors.yellow,
            'center',
          );
        else if (begun('fallback-total'))
          drawSupportText(
            ctx,
            api,
            'Combining held and observed spend',
            960,
            760,
            30,
            themeColors.muted,
            'center',
          );
      });
      withSupportFocus(ctx, api, 'fallback-time', () => {
        if (time) {
          drawSupportText(
            ctx,
            api,
            '180 + 940 + 1100 + 10 = 2230 ms',
            960,
            860,
            34,
            themeColors.cyan,
            'center',
          );
          drawSupportText(
            ctx,
            api,
            '2 / 2 attempts used · no repair call remains',
            960,
            940,
            31,
            themeColors.pink,
            'center',
          );
        } else if (begun('fallback-time'))
          drawSupportText(
            ctx,
            api,
            'Building fallback elapsed-time sum',
            960,
            860,
            30,
            themeColors.muted,
            'center',
          );
      });
      drawSupportFooter(
        ctx,
        api,
        'Token-cache hits do not guarantee total latency; tools and specialist labor add costs.',
      );
    }
  }
}
export default {
  id: 'ticket-budget',
  draw: drawTicketBudget,
  cues: [
    'budget-inputs',
    'fresh-minus-cache',
    'first-bill',
    'revision-bill',
    'total-bill',
    'reserve-bill',
    'budget-time',
    'monthly-bill',
    'unknown-reserve',
    'fallback-bill',
    'fallback-total',
    'fallback-time',
  ],
};
