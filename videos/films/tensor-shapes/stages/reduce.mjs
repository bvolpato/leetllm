import { sentenceWords, sequence0, sequence1, tokenMean } from '../fixtures.mjs';
import { clamp, count } from '../construction.mjs';
import { reductionFrame } from '../model.mjs';
import { caption, equation, numberGrid, target, text, vertical, wordNames } from '../defaults.mjs';
export function drawReduce(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  {
    const v = reductionFrame(state);
    if (currentBeat < 2) {
      const axis = currentBeat === 0 ? 1 : 2,
        selected = v.selected,
        term = v.selectedTermCount;
      target(ctx, api, 'reduction-input', () => {
        for (let batch = 0; batch < 2; batch++) {
          const x = 300 + batch * 900,
            color = batch ? themeColors.pink : themeColors.blue,
            rows = batch ? sequence1 : sequence0;
          text(ctx, api, 'Sentence ' + batch, x + 240, 280, 30, color, 'center');
          wordNames(ctx, api, sentenceWords[batch], x - 25, 345, 90, color);
          numberGrid(ctx, api, rows, x, 345, 480, 270, color, 'reduce-source-' + batch, {
            highlights:
              axis === 1
                ? Array.from(
                    {
                      length: 3,
                    },
                    (_, r) => ({
                      row: r,
                      column: selected,
                      stroke: themeColors.yellow,
                      fill: themeColors.panel,
                    }),
                  )
                : Array.from(
                    {
                      length: 4,
                    },
                    (_, d) => ({
                      row: selected,
                      column: d,
                      stroke: themeColors.yellow,
                      fill: themeColors.panel,
                    }),
                  ),
          });
          const values = axis === 1 ? rows.map((row) => row[selected]) : rows[selected];
          if (term === values.length) {
            text(
              ctx,
              api,
              axis === 1 ? 'Feature column ' + selected : 'Word: ' + sentenceWords[batch][selected],
              x + 240,
              650,
              23,
              themeColors.muted,
              'center',
            );
            equation(
              ctx,
              api,
              String.raw`\frac{${values.join('+')}}{${values.length}}=${v.means[batch][selected]}`,
              x + 240,
              715,
              32,
              themeColors.yellow,
            );
          } else {
            const shown = values.slice(0, term);
            text(
              ctx,
              api,
              shown.length
                ? shown.join(' + ')
                : 'Follow the highlighted ' + (axis === 1 ? 'column' : 'row'),
              x + 240,
              690,
              28,
              themeColors.yellow,
              'center',
            );
          }
        }
      });
      target(ctx, api, 'reduction-output', () => {
        for (let batch = 0; batch < 2; batch++) {
          const x = 300 + batch * 900,
            values = v.means[batch];
          numberGrid(
            ctx,
            api,
            [values.map((value, i) => (i < v.completed ? value : ''))],
            x,
            770,
            480,
            100,
            themeColors.green,
            'reduce-result-' + batch,
          );
        }
      });
      equation(
        ctx,
        api,
        axis === 1
          ? String.raw`\operatorname{mean}(x,\mathrm{axis}=1)\ :\ (2,3,4)\to(2,4)`
          : String.raw`\operatorname{mean}(x,\mathrm{axis}=2)\ :\ (2,3,4)\to(2,3)`,
        960,
        950,
        37,
        themeColors.cyan,
      );
      caption(
        ctx,
        api,
        axis === 1
          ? 'Each completed column sum divides by three words · one feature vector per sentence'
          : 'Each completed row sum divides by four features · one scalar per word',
      );
    } else {
      text(ctx, api, 'Original · first sentence', 460, 285, 31, themeColors.blue, 'center');
      text(ctx, api, 'Centered · first sentence', 1440, 285, 31, themeColors.green, 'center');
      wordNames(ctx, api, sentenceWords[0], 195, 380, 100, themeColors.blue);
      ctx.save();
      ctx.globalAlpha *= 0.72;
      numberGrid(ctx, api, sequence0, 220, 380, 480, 300, themeColors.blue, 'center-original');
      ctx.restore();
      target(ctx, api, 'centered-values', () => {
        const n = count(12, v.progress);
        numberGrid(
          ctx,
          api,
          v.centered[0].map((row, t) => row.map((value, d) => (t * 4 + d < n ? value : ''))),
          1200,
          380,
          480,
          300,
          themeColors.green,
          'centered-result',
        );
        if (n < 12 && v.keep > 0) {
          const t = Math.floor(n / 4),
            d = n % 4;
          equation(
            ctx,
            api,
            String.raw`${sequence0[t][d]}-${tokenMean[0][d]}`,
            960,
            520,
            37,
            themeColors.yellow,
          );
        } else if (n === 12)
          text(
            ctx,
            api,
            'Each feature column now has mean 0',
            1440,
            910,
            28,
            themeColors.green,
            'center',
          );
      });
      target(ctx, api, 'mean-singleton-slot', () => {
        text(
          ctx,
          api,
          v.keep > 0
            ? 'Sentence mean  ·  token axis retained'
            : 'Sentence mean  ·  token axis removed',
          460,
          770,
          28,
          themeColors.yellow,
          'center',
        );
        numberGrid(ctx, api, [tokenMean[0]], 220, 810, 480, 86, themeColors.yellow, 'kept-mean');
        if (v.keep > 0) vertical(ctx, api, 170, 810, 86, '1', themeColors.yellow);
      });
      equation(
        ctx,
        api,
        v.keep > 0
          ? String.raw`(2,1,4)\ \to\ (2,3,4)`
          : String.raw`(2,4)\quad\text{against}\quad(2,3,4)`,
        1250,
        805,
        35,
        v.keep > 0 ? themeColors.cyan : themeColors.pink,
      );
      caption(
        ctx,
        api,
        v.keep > 0
          ? 'keepdims=True  ·  one mean per sentence, shared across its words'
          : 'Right alignment puts batch size 2 under token count 3.',
      );
    }
  }
}
export default {
  id: 'reduce',
  draw: drawReduce,
  cues: ['pool-token-column', 'pool-feature-row', 'retain-mean-token-slot', 'subtract-kept-mean'],
};
