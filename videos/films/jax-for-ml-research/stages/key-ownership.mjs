import { drawArrow, drawBox, drawMatrix, drawText, footer, mark } from '../defaults.mjs';
export function drawKeyOwnership(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    cueProgress = (id) => (state.cues?.[id] ? api.focus.progress(id, 0) : 0),
    resultComplete = (id) => cueProgress(id) === 1,
    U = cueProgress('jx-key-ownership-b' + currentBeat);
  const paint = () => {
    drawText(
      ctx,
      api,
      currentBeat === 0
        ? 'One owner splits before calling independent helpers'
        : 'Stable identities belong to the derivation',
      960,
      275,
      34,
      themeColors.yellow,
    );
    drawBox(ctx, api, 'parent key K0', 720, 340, 480, 90, themeColors.pink);
    const duplicate =
      currentBeat === 0 && cueProgress('key-duplicate') > 0 && !resultComplete('key-continue');
    if (currentBeat === 0)
      drawText(
        ctx,
        api,
        duplicate
          ? 'Each helper splits the same K0'
          : 'Owner splits K0 into continuation, dropout and augmentation',
        960,
        325,
        26,
        duplicate ? themeColors.pink : themeColors.yellow,
      );
    if (currentBeat === 0) {
      for (let i = 0; i < 2; i++) {
        const x = 250 + i * 1000;
        drawArrow(ctx, api, 960, 450, x + 210, 550, themeColors.pink);
        drawBox(
          ctx,
          api,
          i ? 'augmentation helper' : 'dropout helper',
          x,
          575,
          430,
          100,
          themeColors.cyan,
        );
        drawMatrix(ctx, api, [duplicate ? 'child A' : i ? 'child B' : 'child A'], x + 30, 770, {
          cw: 370,
          ch: 85,
          color: duplicate ? themeColors.pink : themeColors.green,
        });
      }
      if (resultComplete('key-continue'))
        drawBox(ctx, api, 'retained continuation K1', 675, 890, 570, 80, themeColors.yellow);
      else if (duplicate)
        drawText(
          ctx,
          api,
          'Both helpers split K0 → matching first child',
          960,
          930,
          32,
          themeColors.pink,
        );
    } else {
      drawMatrix(ctx, api, ['process 0', 'process 1'], 220, 535, {
        cw: 350,
        ch: 100,
        color: themeColors.blue,
        label: 'two processes can both have local device 0',
      });
      drawMatrix(ctx, api, ['global replica 0', 'global replica 1'], 1100, 535, {
        cw: 320,
        ch: 100,
        color: resultComplete('key-global') ? themeColors.green : themeColors.muted,
        label: 'fold-in global replica + step',
      });
      drawText(
        ctx,
        api,
        'experimental RBG vmap can use the first input key',
        960,
        830,
        31,
        themeColors.yellow,
      );
      drawText(
        ctx,
        api,
        'Ref-backed RNG has separate transformation limits',
        960,
        920,
        29,
        themeColors.muted,
      );
    }
    footer(
      ctx,
      api,
      'Equal small outputs are compatible with independent streams; inspect key identity and ownership',
    );
  };
  mark(ctx, api, 'jx-key-ownership-mechanism', paint);
}
export default {
  id: 'key-ownership',
  draw: drawKeyOwnership,
  cues: [
    'jx-key-ownership-b0',
    'key-duplicate',
    'key-continue',
    'jx-key-ownership-b1',
    'key-global',
  ],
};
