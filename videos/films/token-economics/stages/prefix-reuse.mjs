import { cueProgress } from '../construction.mjs';
import { coldMicro, prefixMicro, standard } from '../fixtures.mjs';
import { text } from '../defaults.mjs';
import { usd } from '../forecast-calendar.mjs';

export default {
  id: 'prefix-reuse',
  cues: ['read-prefix', 'price-suffix', 'keep-output'],
  draw(ctx, scene, state, api) {
    const { C } = api;
    const beat = state.beat ?? 0,
      p = state.beatP ?? 0;
    const read = beat > 0 ? 1 : cueProgress(state, 'read-prefix', p);
    const origin = 220,
      w = 1440,
      prefixW = (w * 1280) / 1800;
    text(ctx, api, '1,800 input tokens in both calls', origin, 300, 44, C.ink, 'left');
    api.focus.target('input-strip', () => {
      api.rect(ctx, origin, 381, w, 91, C.cyan, undefined, 0);
      if (read > 0) api.rect(ctx, origin, 381, prefixW * read, 91, C.yellow, undefined, 0);
      text(ctx, api, 'Policy prefix  ·  1,280', origin + prefixW / 2, 441, 41, C.bg);
      text(ctx, api, 'Order details  ·  520', origin + (w + prefixW) / 2, 441, 35, C.bg);
      if (read === 1)
        text(
          ctx,
          api,
          'Read  ' + usd(1280 * standard.cached, 5),
          origin,
          544,
          38,
          C.yellow,
          'left',
        );
      text(
        ctx,
        api,
        'Ordinary  ' + usd(520 * standard.input, 5),
        origin + w,
        544,
        38,
        C.cyan,
        'right',
      );
    });
    const output = 180 * standard.output;
    api.focus.target('generation-receipt', () => {
      text(ctx, api, 'Cold call', 210, 688, 36, C.ink, 'left');
      text(ctx, api, 'With prefix read', 210, 831, 36, C.ink, 'left');
      const start = 660,
        scale = 0.13;
      for (const [i, cost] of [coldMicro, prefixMicro].entries()) {
        const y = 649 + 142 * i;
        if (i && beat < 1) continue;
        const input = cost - output;
        // Fix the output to the right so its width and position survive the price change.
        const split = start + (coldMicro - output) * scale;
        const ordinary = i ? 520 * standard.input : input;
        if (i)
          api.rect(
            ctx,
            split - input * scale,
            y,
            (input - ordinary) * scale,
            57,
            C.yellow,
            undefined,
            0,
          );
        api.rect(ctx, split - ordinary * scale, y, ordinary * scale, 57, C.cyan, undefined, 0);
        api.rect(ctx, split, y, output * scale, 57, C.pink, undefined, 0);
        text(ctx, api, usd(cost, 5), 1810, y + 41, 34, C.ink, 'right');
      }
      text(
        ctx,
        api,
        '180 new output tokens in both calls  ·  ' + usd(output, 5) + ' each',
        960,
        957,
        35,
        C.pink,
      );
    });
  },
};
