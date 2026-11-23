import { ticketTexts } from '../fixtures.mjs';
import { fixed } from '../arithmetic.mjs';
import { trained } from '../model.mjs';
import { math, panel, target, text, withMpsRootFrame } from '../defaults.mjs';
export function paintBatchUpdate(ctx, scene, state, api, C, c, t, s) {
  if (s.step === 0) {
    text(ctx, api, C, 'The same calculation for all four tickets', 960, 270, 38, C.ink, 'center');
    for (let i = 0; i < 4; i++) {
      const y = 345 + i * 127;
      panel(ctx, api, C, c, 215, y, 1490, 100, i < s.count ? C.cyan : C.muted);
      text(ctx, api, C, 'T' + (i + 1), 250, y + 64, 30, i < s.count ? C.cyan : C.muted);
      text(ctx, api, C, ticketTexts[i], 350, y + 64, 34, C.ink);
      if (i < s.count)
        target(ctx, api, 'individual-losses', () =>
          text(
            ctx,
            api,
            C,
            'loss ' + fixed(trained.losses[i]),
            1645,
            y + 64,
            35,
            C.yellow,
            'right',
          ),
        );
    }
    target(ctx, api, 'batch-loss', () =>
      math(
        ctx,
        api,
        C,
        s.count === 4 ? `L_{batch}=\\frac{L_1+L_2+L_3+L_4}{4}=${fixed(s.loss)}` : 'L_{batch}=?',
        960,
        960,
        49,
        C.yellow,
      ),
    );
  } else {
    target(ctx, api, 'weight-update', () => {
      text(ctx, api, C, 'One weight receives the batch gradient', 960, 310, 38, C.ink, 'center');
      math(
        ctx,
        api,
        C,
        'w\\leftarrow w-\\eta\\frac{\\partial L}{\\partial w}',
        960,
        460,
        70,
        C.yellow,
      );
      math(
        ctx,
        api,
        C,
        `${fixed(trained.firstWeightUpdate.before)}\\longrightarrow ${fixed(s.weight)}`,
        960,
        640,
        92,
        C.green,
      );
    });
    target(ctx, api, 'loss-change', () => {
      text(
        ctx,
        api,
        C,
        'Same four tickets · recompute after the update',
        960,
        790,
        31,
        C.muted,
        'center',
      );
      math(
        ctx,
        api,
        C,
        `L:\\;${fixed(s.loss)}\\longrightarrow ${s.lossCompared ? fixed(s.currentLoss) : '?'}`,
        960,
        905,
        65,
        C.cyan,
      );
    });
  }
}
function selectStage(ctx, scene, state, api, C, c, t, s) {
  paintBatchUpdate(ctx, scene, state, api, C, c, t, s);
}
export function drawBatchUpdateStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, selectStage);
}
export default {
  id: 'batch-update',
  draw: drawBatchUpdateStage,
  cues: ['batch-loss', 'optimizer-update', 'recompute-loss'],
};
