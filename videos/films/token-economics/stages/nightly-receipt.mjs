import {
  batch,
  budgetMicro,
  coldEvaluationMicro,
  coldNightExtraMicro,
  evaluationMicro,
  headroomMicro,
  monthlyMicro,
  nightlyCalls,
  priceMicroDollars,
} from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { drawForecastCalendar, usd } from '../forecast-calendar.mjs';

export default {
  id: 'nightly-receipt',
  cues: ['reprice-prefix', 'price-night', 'mark-nights', 'divide-cushion'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0;
    if (beat >= 3) {
      const p = state.beatP ?? 0;
      const marked = beat === 3 ? Math.ceil(12 * cueProgress(state, 'mark-nights', p)) : 12;
      const divided =
        beat === 4 && cueProgress(state, 'divide-cushion', api.phase(p, 0, 0.25)) === 1;
      const allowance = usd(headroomMicro / 12, 3);
      drawForecastCalendar(ctx, api, {
        marked,
        allowance: marked ? (divided ? allowance : '?') : undefined,
        calculation: marked
          ? usd(headroomMicro) + ' available ÷ 12 nights = ' + (divided ? allowance : '?')
          : usd(budgetMicro) +
            ' budget − ' +
            usd(monthlyMicro) +
            ' forecast = ' +
            usd(headroomMicro),
        note: divided
          ? 'One cold night adds ' + usd(coldNightExtraMicro) + ' to the bill.'
          : 'Same 2,000 checks each night',
      });
      return;
    }
    const reprice =
      beat > 1 ? 1 : beat === 1 ? cueProgress(state, 'reprice-prefix', state.beatP ?? 0) : 0;
    const scale = beat >= 2 ? cueProgress(state, 'price-night', state.beatP ?? 0) : 0;
    const left = 190,
      top = 388;
    const prefixWidth = 768,
      suffixWidth = 312;
    const warm = priceMicroDollars(1800, 1280, 80, batch);
    const cold = priceMicroDollars(1800, 0, 80, batch);
    text(ctx, api, 'One evaluation call', left, 264, 44, C.ink, 'left');
    text(
      ctx,
      api,
      'Estimated GPT-5.4 Batch rates in USD per million tokens',
      left,
      321,
      30,
      C.muted,
      'left',
    );
    api.focus.target('prefix-price', () => {
      api.rect(ctx, left, top, prefixWidth, 88, C.yellow, undefined, 0);
      if (reprice > 0) api.rect(ctx, left, top, prefixWidth * reprice, 88, C.cyan, undefined, 0);
      text(ctx, api, '1,280 policy tokens', left + prefixWidth / 2, top + 57, 39, C.bg);
      text(
        ctx,
        api,
        reprice === 1
          ? 'Ordinary input × $1.25'
          : reprice === 0
            ? 'Cache read × $0.125'
            : 'Repricing as ordinary input',
        574,
        541,
        32,
        reprice ? C.cyan : C.yellow,
      );
      if (reprice === 0 || reprice === 1)
        text(ctx, api, usd(1280 * (reprice ? batch.input : batch.cached), 6), 574, 601, 38, C.ink);
    });
    api.rect(ctx, left + prefixWidth + 6, top, suffixWidth, 88, C.cyan, undefined, 0);
    text(ctx, api, '520 new', 1120, top + 57, 39, C.bg);
    text(ctx, api, 'Input × $1.25', 1120, 541, 32, C.cyan);
    text(ctx, api, usd(520 * batch.input, 6), 1120, 601, 38, C.ink);
    api.rect(ctx, 1400, top, 310, 88, C.panel, C.pink, 6);
    text(ctx, api, '80 output', 1555, top + 57, 39, C.pink);
    text(ctx, api, 'Output × $7.50', 1555, 541, 32, C.pink);
    text(ctx, api, usd(80 * batch.output, 6), 1555, 601, 38, C.ink);
    const atNight = beat >= 2;
    api.focus.target('night-cost', () => {
      const n = atNight ? 1 + Math.round((nightlyCalls - 1) * scale) : 1;
      text(
        ctx,
        api,
        n === 1 ? 'Generation per call' : n.toLocaleString('en-US') + ' evaluation calls',
        left,
        754,
        37,
        C.ink,
        'left',
      );
      text(
        ctx,
        api,
        'With reads  ' + usd(n * warm, n === nightlyCalls ? 2 : 6),
        left,
        848,
        40,
        C.yellow,
        'left',
      );
      if (reprice === 1)
        text(
          ctx,
          api,
          'Without reads  ' + usd(n * cold, n === nightlyCalls ? 2 : 6),
          1010,
          848,
          40,
          C.cyan,
          'left',
        );
      if (scale === 1)
        text(
          ctx,
          api,
          usd(coldEvaluationMicro) +
            ' − ' +
            usd(evaluationMicro) +
            ' = ' +
            usd(coldNightExtraMicro) +
            ' extra per cold night',
          960,
          975,
          42,
          C.ink,
        );
      if (beat === 0)
        text(ctx, api, 'If the read misses, which charge changes?', 960, 975, 41, C.ink);
    });
  },
};
