import { localMemorySpills } from '../arithmetic.mjs';
import { accEvent } from '../construction.mjs';
import { drawArrow, drawBar, drawCard, drawCenteredText, drawPanel } from '../defaults.mjs';
export function drawNkiLifetimes(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    ev = (name, beat) => accEvent(scene, state, name, beat),
    B = (name, beat) => ev(name, beat) > 0;
  api.focus.target('nki-lifetimes-mechanism', () => {
    const owners = [
      {
        name: 'HBM',
        x: 130,
        col: themeColors.blue,
      },
      {
        name: 'SBUF',
        x: 730,
        col: themeColors.cyan,
      },
      {
        name: 'PSUM',
        x: 1330,
        col: themeColors.yellow,
      },
    ];
    drawCenteredText(
      ctx,
      api,
      'Trainium2   ·   Where each tile lives',
      960,
      285,
      33,
      themeColors.yellow,
    );
    owners.forEach((o) => {
      drawPanel(ctx, api, o.x, 380, 460, 380, o.col);
      drawCenteredText(ctx, api, o.name, o.x + 230, 435, 38, o.col);
    });
    if (currentBeat === 0) {
      drawCard(ctx, api, 'Kernel inputs / outputs', 160, 520, 400, 160, themeColors.blue, 30);
      drawCard(ctx, api, 'Internal engine data', 760, 520, 400, 160, themeColors.cyan, 30);
      drawCard(ctx, api, 'Matrix accumulation', 1360, 520, 400, 160, themeColors.yellow, 30);
    } else if (currentBeat === 1) {
      const phase = B('store', 1) ? 2 : B('accumulate', 1) ? 1 : 0,
        progress = phase === 2 ? ev('store', 1) : phase === 1 ? ev('accumulate', 1) : ev('load', 1);
      const x =
        phase === 0
          ? api.lerp(190, 790, progress)
          : phase === 1
            ? api.lerp(790, 1390, progress)
            : progress < 0.35
              ? api.lerp(1390, 790, progress / 0.35)
              : progress <= 0.65
                ? 790
                : api.lerp(790, 190, (progress - 0.65) / 0.35);
      drawCard(
        ctx,
        api,
        phase === 2 ? 'Completed Y' : phase === 1 ? 'Owned partial Y' : 'Input tile A/B',
        x,
        835,
        330,
        85,
        [themeColors.blue, themeColors.yellow, themeColors.green][phase],
        29,
      );
      if (phase === 2)
        drawCenteredText(
          ctx,
          api,
          'Completed output path: PSUM → SBUF → HBM',
          960,
          335,
          30,
          themeColors.green,
        );
      if (B('prefetch', 1))
        drawCenteredText(
          ctx,
          api,
          'A next tile may prefetch while the owned current tile computes',
          960,
          975,
          28,
          themeColors.cyan,
        );
    } else {
      const split = B('split', 2),
        psum = split ? 3 : 4 + 2 * ev('psum', 2),
        sbuf = split ? 6 : 4 + 3 * ev('sbuf', 2),
        m = localMemorySpills({
          psumLive: psum,
          sbufLive: sbuf,
        });
      [
        ['SBUF demand', m.sbufTotal, 8, 790, 610, themeColors.cyan],
        ['PSUM demand', m.psumLive, 4, 1390, 610, themeColors.yellow],
      ].forEach(([label, value, cap, x, y, col]) => {
        drawBar(ctx, api, x, y, 330, value, cap, col);
        drawCenteredText(
          ctx,
          api,
          label + ' ' + value.toFixed(1) + ' / ' + cap,
          x + 165,
          y + 105,
          28,
          col,
        );
      });
      drawCenteredText(
        ctx,
        api,
        'Example capacity   ·   SBUF holds 8 units   ·   PSUM holds 4',
        960,
        335,
        28,
        themeColors.muted,
      );
      if (m.psumToSbuf > 0) {
        drawArrow(ctx, api, 1310, 830, 1130, 830, themeColors.yellow);
        drawCenteredText(
          ctx,
          api,
          m.psumToSbuf.toFixed(1) + ' PSUM → SBUF',
          1230,
          905,
          27,
          themeColors.yellow,
        );
      }
      if (m.sbufToHbm > 0) {
        drawArrow(ctx, api, 710, 830, 540, 830, themeColors.pink);
        drawCenteredText(
          ctx,
          api,
          m.sbufToHbm.toFixed(1) + ' SBUF → HBM',
          590,
          905,
          27,
          themeColors.pink,
        );
      }
      if (split)
        drawCenteredText(
          ctx,
          api,
          'Split live set · no overflow in either local tier',
          960,
          960,
          33,
          themeColors.green,
        );
    }
  });
}
export default {
  id: 'nki-lifetimes',
  draw: drawNkiLifetimes,
  cues: [
    'ag-nki-lifetimes-tiers',
    'ag-nki-lifetimes-load',
    'ag-nki-lifetimes-accumulate',
    'ag-nki-lifetimes-store',
    'ag-nki-lifetimes-prefetch',
    'ag-nki-lifetimes-psum',
    'ag-nki-lifetimes-sbuf',
    'ag-nki-lifetimes-split',
  ],
};
