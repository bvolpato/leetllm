import { priceMicroDollars, standard } from '../fixtures.mjs';
import { cueProgress } from '../construction.mjs';
import { text } from '../defaults.mjs';
import { usd } from '../forecast-calendar.mjs';

export default {
  id: 'cold-reservation',
  cues: ['cold-receipts', 'reserve-limit', 'longer-input', 'refuse-call', 'reasoning-cap'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0,
      p = state.beatP ?? 0;
    if (beat === 0) {
      const progress = cueProgress(state, 'cold-receipts', p);
      text(ctx, api, 'Observed calls and the lab’s half-cent ceiling', 960, 274, 41, C.ink);
      api.focus.target('observed', () => {
        const rows = [
          ['Policy · warm', 1800, 1280, 180],
          ['Policy · cold', 1800, 0, 180],
          ['Concise exception · cold', 2200, 0, 130],
        ];
        rows.forEach(([label, input, reads, output], i) => {
          const cost = priceMicroDollars(input, reads, output);
          const y = 403 + 157 * i;
          text(ctx, api, label, 180, y + 40, 34, i ? C.cyan : C.yellow, 'left');
          const fraction = i ? api.clamp(progress * 2 - (i - 1)) : 1;
          if (fraction > 0)
            api.rect(
              ctx,
              672,
              y,
              (cost / 8000) * 790 * fraction,
              57,
              i ? C.cyan : C.yellow,
              undefined,
              1,
            );
          if (fraction === 1) text(ctx, api, usd(cost, 5), 1715, y + 42, 37, C.ink, 'right');
        });
      });
      const ceilingX = 672 + (790 * 5000) / 8000;
      api.line(ctx, ceilingX, 364, ceilingX, 817, C.pink, 4);
      text(ctx, api, '$0.005 ceiling', ceilingX, 883, 33, C.pink);
      return;
    }
    if (beat < 4) {
      const longer = beat >= 3 || (beat === 2 && cueProgress(state, 'longer-input', p) > 0);
      const input = longer ? 2300 : 2200,
        cap = 300;
      const inputCost = input * standard.input,
        outputCost = cap * standard.output;
      const total = inputCost + outputCost,
        ceiling = 10000;
      const resolved =
        beat === 1
          ? cueProgress(state, 'reserve-limit', p) === 1
          : beat === 3 && cueProgress(state, 'refuse-call', p) > 0;
      api.focus.target('reservation', () => {
        text(
          ctx,
          api,
          'Cold input: ' + input.toLocaleString('en-US') + ' tokens',
          220,
          363,
          42,
          C.cyan,
          'left',
        );
        text(ctx, api, 'Output cap sent: 300 tokens', 1010, 363, 42, C.pink, 'left');
        text(ctx, api, usd(inputCost, 5) + ' input', 220, 446, 44, C.cyan, 'left');
        text(ctx, api, usd(outputCost, 5) + ' output', 1010, 446, 44, C.pink, 'left');
        const x = 220,
          scale = 0.132;
        api.rect(ctx, x, 562, inputCost * scale, 83, C.cyan, undefined, 0);
        api.rect(ctx, x + inputCost * scale, 562, outputCost * scale, 83, C.pink, undefined, 0);
        api.line(ctx, x + ceiling * scale, 529, x + ceiling * scale, 692, C.yellow, 5);
        text(ctx, api, '$0.010 ceiling', x + ceiling * scale, 751, 31, C.yellow);
        text(ctx, api, 'worst <= CEILING', 220, 766, 35, C.muted, 'left');
        const verdict = total <= ceiling ? 'start' : 'refuse';
        text(
          ctx,
          api,
          resolved
            ? input + ' input: reserve ' + (total / 1e6).toFixed(6) + ' USD, ' + verdict
            : 'May this call start?',
          960,
          916,
          43,
          resolved && total > ceiling ? C.pink : C.ink,
        );
      });
      return;
    }

    const used = Math.round(300 * cueProgress(state, 'reasoning-cap', p));
    api.focus.target('output-cap', () => {
      text(ctx, api, 'Output allowance for this call', 230, 340, 43, C.ink, 'left');
      api.rect(ctx, 230, 460, 1460, 114, C.panel, C.muted, 0);
      if (used > 0) api.rect(ctx, 230, 460, (1460 * used) / 300, 114, C.yellow, undefined, 0);
      text(
        ctx,
        api,
        used + ' / 300 billed output tokens used for reasoning',
        230,
        674,
        37,
        C.yellow,
        'left',
      );
      text(ctx, api, 'Visible answer: 0 tokens', 230, 772, 40, C.ink, 'left');
      if (used === 300)
        text(ctx, api, 'Output cap reached  ·  incomplete answer', 230, 898, 40, C.pink, 'left');
    });
  },
};
