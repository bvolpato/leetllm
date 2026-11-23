import { clamp, mix, motion } from '../arithmetic.mjs';
import { drawArrow, drawFooter, drawPage, drawRectangle, drawText } from '../defaults.mjs';
export function drawFaultHandler(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-fault-handler-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-fault-handler-' + name);
      return q
        ? {
            q: q.phase === 'before' ? 0 : q.phase === 'after' ? 1 : q.progress,
            done: q.phase === 'after',
          }
        : {
            q: currentBeat < index ? 0 : currentBeat > index ? 1 : motion(progress),
            done: currentBeat > index || (currentBeat === index && progress > 0.8),
          };
    },
    cueProgress = (n, i) => cue(n, i).q;
  api.focus.target('sp-fault-handler-mechanism', () => {
    const q =
      currentBeat === 0
        ? cueProgress('file', 0)
        : currentBeat === 1
          ? cueProgress('delegate', 1)
          : 0;
    drawRectangle(ctx, api, 180, 325, 420, 160, themeColors.blue);
    drawText(ctx, api, 'Guest access', 210, 385, 32, themeColors.blue);
    drawText(
      ctx,
      api,
      currentBeat < 2 && q === 1 ? 'page 2 resident' : 'missing page 2',
      210,
      445,
      29,
      themeColors.yellow,
    );
    drawRectangle(ctx, api, 1280, 325, 440, 160, themeColors.cyan);
    drawText(ctx, api, 'Validated backing', 1310, 385, 30, themeColors.cyan);
    drawText(ctx, api, 'page 2 → value 30', 1310, 445, 28, themeColors.cyan);
    const px = mix(1340, 260, q);
    drawRectangle(
      ctx,
      api,
      700,
      325,
      420,
      160,
      currentBeat === 2 ? themeColors.pink : themeColors.yellow,
    );
    drawText(
      ctx,
      api,
      currentBeat === 0 ? 'Host fault path' : 'Userspace handler',
      730,
      385,
      30,
      themeColors.yellow,
    );
    drawText(
      ctx,
      api,
      currentBeat === 2
        ? 'stalled / access blocked'
        : q === 1
          ? 'page supplied'
          : 'page supply pending',
      730,
      445,
      28,
      currentBeat === 2 ? themeColors.pink : themeColors.muted,
    );
    if (currentBeat < 2) {
      drawPage(ctx, api, 30, px, 650, themeColors.cyan, 'page 2');
      drawArrow(ctx, api, 1600, 830, 330, 830, themeColors.cyan);
      drawText(
        ctx,
        api,
        q === 1 ? 'Supplied page unblocks access' : 'Access waits for its page',
        200,
        880,
        32,
        q === 1 ? themeColors.green : themeColors.yellow,
      );
    } else {
      drawRectangle(ctx, api, 690, 630, 440, 140, themeColors.pink);
      drawText(ctx, api, 'No page supplied', 725, 690, 31, themeColors.pink);
      drawText(ctx, api, 'Guest instruction cannot finish', 725, 745, 25, themeColors.pink);
      drawText(
        ctx,
        api,
        'Stop admission; reconcile retirement before reclaiming',
        190,
        900,
        30,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Cold read faults load clean data; private writes allocate a different ownership path.',
    );
  });
}
export default {
  id: 'fault-handler',
  draw: drawFaultHandler,
  cues: [
    'sp-fault-handler-0',
    'sp-fault-handler-file',
    'sp-fault-handler-1',
    'sp-fault-handler-delegate',
    'sp-fault-handler-2',
    'sp-fault-handler-stall',
  ],
};
