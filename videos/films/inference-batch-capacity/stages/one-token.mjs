import { capacityEvent, clamp } from '../construction.mjs';
import { drawArrow, drawCapacityCard, drawCenteredText, drawFooter } from '../defaults.mjs';
export function drawOneToken(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => capacityEvent(scene, state, name, beat),
    done = (name, beat) => ev(name, beat) === 1;
  api.focus.target('one-token-mechanism', () => {
    api.focus.target('one-token-readout', () => {
      api.focus.target('one-token-readout-2', () =>
        drawCenteredText(
          ctx,
          api,
          'Retain position t · its checkpoint defines every dimension',
          960,
          285,
          32,
          themeColors.yellow,
        ),
      );
      if (currentBeat === 0) {
        drawCapacityCard(ctx, api, 'position t', 140, 470, 280, 120, themeColors.yellow, 34);
        const p = ev('arrays', 0);
        if (p > 0) {
          drawArrow(ctx, api, 450, 530, 680, 420, themeColors.blue);
          drawArrow(ctx, api, 450, 530, 680, 690, themeColors.green);
          teaching.grid({
            x: 720,
            y: 350,
            width: 900,
            height: 150,
            rows: 2,
            columns: 8,
            fill: themeColors.panel,
            stroke: themeColors.blue,
          });
          teaching.grid({
            x: 720,
            y: 620,
            width: 900,
            height: 150,
            rows: 2,
            columns: 8,
            fill: themeColors.panel,
            stroke: themeColors.green,
          });
          drawCenteredText(
            ctx,
            api,
            'K[t] · keys retained for later queries',
            1170,
            560,
            30,
            themeColors.blue,
          );
          drawCenteredText(
            ctx,
            api,
            'V[t] · values retained for later queries',
            1170,
            840,
            30,
            themeColors.green,
          );
        }
      } else {
        const p = ev('factors', 1),
          count = Math.min(5, Math.floor(p * 5 + 1e-8));
        const labels = [
          ['K and V', '2', themeColors.blue],
          ['layers', '32', themeColors.cyan],
          ['KV heads', '8', themeColors.green],
          ['head width', '128', themeColors.pink],
          ['bytes/value', '2', themeColors.yellow],
        ];
        labels.forEach(([label, value, color], i) => {
          const x = 140 + i * 335;
          drawCapacityCard(
            ctx,
            api,
            i < count ? value : '?',
            x,
            395,
            280,
            100,
            i < count ? color : themeColors.muted,
            40,
          );
          drawCenteredText(ctx, api, label, x + 140, 560, 27, themeColors.muted);
        });
        api.focus.target('one-token-equation', () => {
          if (done('payload', 1))
            drawCenteredText(
              ctx,
              api,
              '2 × 32 × 8 × 128 × 2 = 131,072 B = 128 KiB / position',
              960,
              705,
              37,
              themeColors.yellow,
            );
          else
            drawCenteredText(
              ctx,
              api,
              'Multiply only the retained dimensions',
              960,
              705,
              32,
              themeColors.muted,
            );
        });
        {
          const p = state.cues?.['history-payload']
            ? state.cues['history-payload'].phase === 'after'
              ? 1
              : state.cues['history-payload'].phase === 'before'
                ? 0
                : state.cues['history-payload'].progress
            : currentBeat === 1
              ? clamp((state.beatP - 0.7) / 0.25)
              : 1;
          api.focus.target('one-token-equation-2', () => {
            const n = Math.floor(16 * p);
            for (let i = 0; i < n; i++) {
              api.rect(ctx, 170 + i * 97, 805, 40, 95, themeColors.blue, undefined, 0);
              api.rect(ctx, 210 + i * 97, 805, 40, 95, themeColors.green, undefined, 0);
            }
            drawCenteredText(
              ctx,
              api,
              'Each block holds K and V for 256 retained positions',
              960,
              775,
              25,
              themeColors.muted,
            );
            if (p === 1)
              drawCenteredText(
                ctx,
                api,
                '4,096 retained positions × 128 KiB = 0.50 GiB / request',
                960,
                960,
                35,
                themeColors.green,
              );
            else
              drawCenteredText(
                ctx,
                api,
                n > 0
                  ? (n * 256).toLocaleString() + ' positions built'
                  : 'Extend the same payload through its retained history',
                960,
                960,
                31,
                themeColors.muted,
              );
          });
        }
      }
      drawFooter(
        ctx,
        api,
        'Raw full-attention payload; runtime and allocator overhead are separate',
      );
    });
  });
}
export default {
  id: 'one-token',
  draw: drawOneToken,
  cues: [
    'kv-factors',
    'checkpoint-dimensions',
    'ic-one-token-arrays',
    'token-payload',
    'history-payload',
    'ic-one-token-factors',
    'ic-one-token-payload',
    'independent-payloads',
    'stored-geometry',
  ],
};
