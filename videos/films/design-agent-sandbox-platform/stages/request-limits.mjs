import { clamp, motion } from '../arithmetic.mjs';
import { drawArrow, drawCell, drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawRequestLimits(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-request-limits-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-request-limits-' + name);
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
  api.focus.target('sp-request-limits-mechanism', () => {
    const q = cueProgress('identity', 0);
    drawCell(ctx, api, 'Tenant', 'tenant-A', 155, 300, 390, themeColors.blue);
    drawCell(ctx, api, 'Sandbox / generation', 'S8 / g4', 155, 455, 390, themeColors.blue);
    const names = ['placement', 'command session', 'writable backing', 'capability'];
    names.forEach((n, i) => {
      const y = 300 + i * 145;
      drawRectangle(ctx, api, 900, y, 800, 100, i < q * 4 ? themeColors.cyan : themeColors.muted);
      drawText(ctx, api, n, 930, y + 60, 31);
      if (i < q * 4) drawText(ctx, api, 'S8 / g4', 1450, y + 60, 29, themeColors.cyan);
      drawArrow(ctx, api, 555, 505, 870, y + 50, themeColors.muted);
    });
    if (currentBeat === 1) {
      drawCell(ctx, api, 'vCPU allowance', '1–4', 155, 660, 390, themeColors.yellow);
      drawCell(ctx, api, 'Configured guest memory', '0.5–8 GiB', 155, 810, 390, themeColors.yellow);
      drawText(ctx, api, 'Scratch limit: 5 GiB', 930, 925, 31, themeColors.yellow);
    }
    if (currentBeat === 2) {
      drawCell(
        ctx,
        api,
        'Configured allowance',
        '8 GiB address space',
        155,
        660,
        600,
        themeColors.yellow,
      );
      drawCell(ctx, api, 'Measured use', 'separate host ledger', 155, 815, 600, themeColors.green);
      drawText(
        ctx,
        api,
        resultComplete('allowance', 2)
          ? 'Not eight GiB of known physical residency'
          : 'Inspect host allocations separately',
        900,
        925,
        28,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'Retries reconcile the same owner; a new number cannot stop an old runtime.',
    );
  });
}
export default {
  id: 'request-limits',
  draw: drawRequestLimits,
  cues: [
    'sp-request-limits-0',
    'sp-request-limits-identity',
    'sp-request-limits-1',
    'sp-request-limits-limits',
    'sp-request-limits-2',
    'sp-request-limits-allowance',
  ],
};
