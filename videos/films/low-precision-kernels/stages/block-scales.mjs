import { phase } from '../encoding.mjs';
import { blockContraction } from '../model.mjs';
import { sampleOriginalModel } from '../construction.mjs';
import { equation, originalText } from '../defaults.mjs';
export function drawBlockScales(ctx, scene, state, api) {
  {
    const { C, components: c, teaching: t } = api,
      s = sampleOriginalModel('block-scales', state),
      b = s.step;
    {
      originalText(
        ctx,
        api,
        'Two generic contraction blocks · explicit positive reconstruction scales',
        140,
        260,
        31,
      );
      s.blocks.forEach((block, i) => {
        if (b === 0 && i === 1) return;
        const x = 150 + i * 970;
        api.focus.target('block-scales-panel-block-scales', () =>
          c.panel(
            {
              x,
              y: 350,
              width: 650,
              height: 405,
              fill: C.panel,
              stroke: i ? C.pink : C.blue,
              padding: 16,
            },
            () => {
              originalText(ctx, api, `K block ${i}`, x + 35, 405, 32, i ? C.pink : C.blue);
              originalText(ctx, api, 'qX', x + 30, 490, 28, C.muted);
              originalText(ctx, api, 'qW', x + 30, 590, 28, C.muted);
              api.focus.target('block-scales-block-x-block-w', () =>
                c.matrix({
                  values: [block.x, block.w],
                  x: x + 135,
                  y: 435,
                  cellSize: 100,
                  gap: 8,
                  style: {
                    fontSize: 32,
                    fill: C.panel,
                    stroke: C.muted,
                    textColor: C.ink,
                  },
                }),
              );
              originalText(ctx, api, 'inner dot', x + 420, 485, 28, C.muted);
              originalText(
                ctx,
                api,
                b > i || (b === i && s.q >= 0.35) ? String(s.partials[i]) : '?',
                x + 470,
                555,
                43,
                C.ink,
                'center',
              );
              api.focus.target(
                'block-scales-math-s-ready-i-string-raw-s-partials-i-s-products-i-s-contributions-i-str',
                () =>
                  equation(
                    ctx,
                    api,
                    s.ready > i
                      ? String.raw`${s.partials[i]}\times${s.products[i]}=${s.contributions[i]}`
                      : String.raw`S_X S_W=${s.products[i]}`,
                    x + 325,
                    710,
                    39,
                    s.ready > i ? C.green : C.yellow,
                  ),
              );
            },
          ),
        );
      });
      if (b < 2)
        originalText(
          ctx,
          api,
          s.ready
            ? `Reconstructed contributions accumulated: ${s.running}`
            : 'Compute and scale each partial',
          960,
          885,
          34,
          C.green,
          'center',
        );
      else {
        api.focus.target('block-scales-math-2-imes5-3-imes8', () =>
          equation(ctx, api, String.raw`2\times5+3\times8=${s.correct}`, 535, 885, 43, C.green),
        );
        api.focus.target('block-scales-math-5-2-3', () =>
          equation(ctx, api, String.raw`5(2+3)=${s.wrong}`, 1435, 885, 43, C.pink),
        );
      }
      originalText(
        ctx,
        api,
        b === 2
          ? 'A scale varying with the K block stays inside that outer sum'
          : 'First inner product, then that block’s scale, then accumulate',
        960,
        980,
        28,
        C.muted,
        'center',
      );
    }
  }
  const { C: themeColors } = api,
    currentBeat = state.beat,
    progress = phase(state.beatP),
    T = (v, x, y, size = 25, color = themeColors.muted, align = 'left') =>
      api.text(ctx, v, x, y, size, color, align);
  if (currentBeat < 2 && progress > 0.6 && progress < 0.9) {
    const i = currentBeat,
      fixture = blockContraction(),
      u = (progress - 0.6) / 0.3,
      x = 475 + i * 970 + (960 - (475 + i * 970)) * u,
      y = 800 + 40 * u;
    T(
      fixture.partials[i] + ' × ' + fixture.products[i] + ' = ' + fixture.contributions[i],
      x,
      y,
      27,
      i ? themeColors.pink : themeColors.blue,
      'center',
    );
  }
  return;
}
export default {
  id: 'block-scales',
  draw: drawBlockScales,
  cues: [
    'block-scales-beat-1-focus-1',
    'block-scales-beat-1-focus-2',
    'block-scales-beat-2-focus-1',
    'block-scales-beat-2-focus-2',
    'block-scales-beat-3-focus-1',
  ],
};
