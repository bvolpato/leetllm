import { clamp, motion, sandboxCapacity } from '../arithmetic.mjs';
import { drawCell, drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawCapacityArithmetic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-capacity-arithmetic-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-capacity-arithmetic-' + name);
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
    cueProgress = (n, i) => cue(n, i).q,
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-capacity-arithmetic-mechanism', () => {
    const m = sandboxCapacity();
    drawText(ctx, api, 'Supplied memory worksheet', 180, 285, 33, themeColors.blue);
    const totalW = 1500,
      reservedW = (totalW * 32) / 256;
    drawRectangle(ctx, api, 180, 335, totalW, 120, themeColors.blue);
    drawRectangle(ctx, api, 180, 335, reservedW, 120, themeColors.pink, themeColors.pink);
    drawText(ctx, api, '32 reserved', 195, 410, 27, themeColors.bg);
    drawText(ctx, api, '256 GiB total', 1310, 410, 30, themeColors.blue);
    if (resultComplete('pool', 0)) {
      drawText(
        ctx,
        api,
        '224 GiB × 1024 = ' + m.poolMiB + ' MiB',
        180,
        530,
        34,
        themeColors.yellow,
      );
    }
    if (currentBeat === 0) {
      const q = cueProgress('full', 0);
      for (let i = 0; i < 112; i++)
        drawRectangle(
          ctx,
          api,
          185 + (i % 28) * 53,
          620 + Math.floor(i / 28) * 60,
          43,
          45,
          i < 112 * q ? themeColors.cyan : themeColors.muted,
        );
      if (resultComplete('full', 0))
        drawText(
          ctx,
          api,
          'floor(229376 / 2048) = ' + m.fullSlots + ' full-footprint slots',
          180,
          925,
          35,
          themeColors.green,
        );
    } else if (currentBeat === 1) {
      const q = cueProgress('private', 1);
      for (let i = 0; i < 72; i++) {
        const n = Math.max(0, Math.min(64, m.privateSlots - i * 64));
        drawRectangle(
          ctx,
          api,
          185 + (i % 18) * 83,
          620 + Math.floor(i / 18) * 65,
          70,
          50,
          i < 72 * q ? themeColors.cyan : themeColors.muted,
        );
        if (i < 72 * q)
          drawText(
            ctx,
            api,
            n,
            220 + (i % 18) * 83,
            654 + Math.floor(i / 18) * 65,
            21,
            themeColors.cyan,
            'center',
          );
      }
      if (resultComplete('private', 1))
        drawText(
          ctx,
          api,
          'floor(229376 / 50) = ' + m.privateSlots + ' memory-only slots',
          180,
          925,
          35,
          themeColors.green,
        );
    } else {
      const sessions = resultComplete('sessions', 2),
        mean = resultComplete('mean', 2),
        queue = resultComplete('queue', 2);
      drawCell(
        ctx,
        api,
        'Configured sessions',
        sessions ? m.sessions : '128 cores × 30',
        180,
        600,
        480,
        themeColors.blue,
      );
      drawCell(
        ctx,
        api,
        'Expected active demand',
        mean ? m.mean.toFixed(1) + ' cores' : 'sessions × 0.03',
        730,
        600,
        480,
        themeColors.green,
      );
      drawCell(
        ctx,
        api,
        'Synchronized queue',
        queue ? m.queued : 'sessions − 128 admitted',
        1280,
        600,
        480,
        themeColors.pink,
      );
      if (queue) {
        drawRectangle(ctx, api, 190, 815, 1480, 55, themeColors.pink);
        drawRectangle(
          ctx,
          api,
          190,
          815,
          (1480 * 128) / 3840,
          55,
          themeColors.green,
          themeColors.green,
        );
        drawText(ctx, api, '128 admitted', 195, 950, 28, themeColors.green);
        drawText(ctx, api, '3712 queued', 1300, 950, 28, themeColors.pink);
      }
    }
    drawFooter(
      ctx,
      api,
      'Memory-only arithmetic excludes unmeasured overhead; average CPU demand does not bound a burst.',
    );
  });
}
export default {
  id: 'capacity-arithmetic',
  draw: drawCapacityArithmetic,
  cues: [
    'sp-capacity-arithmetic-0',
    'sp-capacity-arithmetic-pool',
    'sp-capacity-arithmetic-full',
    'sp-capacity-arithmetic-1',
    'sp-capacity-arithmetic-private',
    'sp-capacity-arithmetic-2',
    'sp-capacity-arithmetic-sessions',
    'sp-capacity-arithmetic-mean',
    'sp-capacity-arithmetic-queue',
  ],
};
