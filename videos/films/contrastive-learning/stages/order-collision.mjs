import { formatValue } from '../arithmetic.mjs';
import { drawCells, drawNote, drawPill, drawText } from '../defaults.mjs';
export function drawOrderCollision(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  api.clamp(state.beatP ?? 0, 0, 1);
  const cue = (k) => state.cues?.['cl-order-collision-' + k],
    resultComplete = (k) => cue(k)?.phase === 'after',
    B = (k) => {
      const v = cue(k);
      return !!v && v.phase !== 'before';
    };
  api.focus.target('order-collision-mechanism', () => {
    const words = [
        ['compiler', 'calls', 'linker'],
        ['linker', 'calls', 'compiler'],
      ],
      vecs = {
        compiler: [0.9, 0.1, 0],
        calls: [0.8, 0.2, 0.1],
        linker: [0.7, 0.1, 0.2],
      };
    drawText(
      ctx,
      api,
      currentBeat
        ? 'Context can enter before pooling'
        : 'Static lookup: same summands, changed order',
      960,
      285,
      35,
      themeColors.yellow,
    );
    words.forEach((row, i) => {
      const y = 400 + i * 245;
      row.forEach((v, j) => {
        const x = 260 + j * 390;
        drawPill(ctx, api, v, x + 150, y, 310, themeColors.blue);
        if (B('tokens') || currentBeat > 0)
          drawText(
            ctx,
            api,
            vecs[v].map((v) => formatValue(v, 2)).join(' / '),
            x + 150,
            y + 95,
            28,
            themeColors.muted,
          );
      });
      if (currentBeat === 0 && resultComplete('mean'))
        drawCells(ctx, api, [0.8, 2 / 15, 0.1], 1430, y - 30, 110, 75, themeColors.cyan);
      if (currentBeat > 0) {
        const contextual = i
          ? ['depends on linker', 'calls → compiler']
          : ['depends on compiler', 'calls → linker'];
        drawText(ctx, api, contextual[0], 1520, y + 10, 25, themeColors.cyan);
        drawText(ctx, api, contextual[1], 1520, y + 95, 25, themeColors.cyan);
      }
    });
    if (currentBeat > 0 && B('diagnose')) {
      drawPill(
        ctx,
        api,
        'Mask / repeated vectors / matrix axes',
        960,
        905,
        1300,
        themeColors.yellow,
      );
    }
    drawNote(
      ctx,
      api,
      currentBeat
        ? 'Contextual means require task evaluation · raw CLS is a separate choice'
        : 'Addition is commutative · an index cannot recover the lost roles',
    );
  });
}
export default {
  id: 'order-collision',
  draw: drawOrderCollision,
  cues: [
    'cl-order-collision-tokens',
    'cl-order-collision-mean',
    'cl-order-collision-context',
    'cl-order-collision-diagnose',
  ],
};
