import { decodeRepetition, decodeSoftmax } from '../arithmetic.mjs';
import { coreFoot, coreText, coreTitle, coreVector } from '../defaults.mjs';
export function drawCenteringOrder(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = api.clamp(state.beatP ?? 0),
    operation = state.cues?.[`dec-centering-order-${currentBeat + 1}`],
    u =
      operation?.phase === 'before'
        ? 0
        : operation?.phase === 'after'
          ? 1
          : (operation?.progress ?? progress2);
  const done = (id) => state.cues?.['dec-' + id]?.phase === 'after';
  api.focus.target('dec-centering-order-mechanism', () => {
    coreTitle(
      ctx,
      api,
      currentBeat === 0
        ? 'Penalty first, then numerical centering'
        : currentBeat === 1
          ? 'Centering first changes this sign-aware operation'
          : 'A lower raw logit can receive higher normalized probability',
    );
    if (currentBeat < 2) {
      const raw = [2.4, 2.1, 1.2, 0.3],
        centered = raw.map((v) => v - 2.4),
        input = currentBeat ? centered : raw,
        out = decodeRepetition(input, [0], 1.2),
        ready = done(currentBeat ? 'center-first' : 'penalty-first');
      coreVector(ctx, api, raw, ['seen A', 'B', 'C', 'D'], 200, 380, 1520);
      coreText(
        ctx,
        api,
        currentBeat
          ? 'Subtract max first → ' + centered.map((v) => v.toFixed(1)).join(', ')
          : 'Apply penalty 1.2 to raw A',
        960,
        585,
        31,
        themeColors.cyan,
      );
      api.arrow(ctx, 960, 630, 960, 700, themeColors.cyan, 4);
      coreVector(
        ctx,
        api,
        ready ? out : [null, null, null, null],
        null,
        200,
        770,
        1520,
        ready
          ? out.map((v) => (v === Math.max(...out) ? themeColors.green : themeColors.cyan))
          : [],
      );
      if (ready)
        coreText(
          ctx,
          api,
          'Mode: ' + ['A', 'B', 'C', 'D'][out.indexOf(Math.max(...out))],
          960,
          970,
          36,
          themeColors.green,
        );
    } else {
      const raw = [2, 10, 0],
        out = decodeRepetition(raw, [0, 1], 2),
        before = decodeSoftmax(raw),
        after = decodeSoftmax(out);
      coreVector(ctx, api, raw, ['seen A', 'seen B', 'unseen C'], 230, 395, 1460);
      coreVector(ctx, api, out, null, 230, 620, 1460);
      coreText(ctx, api, 'A: logit 2 → 1', 470, 850, 34, themeColors.cyan);
      coreText(
        ctx,
        api,
        done('probability-rise')
          ? 'P(A): ' + before[0].toFixed(5) + ' → ' + after[0].toFixed(5)
          : 'Normalize both complete rows before comparing P(A)',
        1200,
        850,
        31,
        themeColors.yellow,
      );
    }
    coreFoot(
      ctx,
      api,
      'A shared offset preserves softmax alone. It does not preserve this sign-sensitive preprocessing.',
    );
    return;
  });
}
export default {
  id: 'centering-order',
  draw: drawCenteringOrder,
  cues: [
    'dec-centering-order-1',
    'dec-penalty-first',
    'dec-centering-order-2',
    'dec-center-first',
    'dec-centering-order-3',
    'dec-probability-rise',
  ],
};
