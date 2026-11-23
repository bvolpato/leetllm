import { clamp, mix, motion } from '../arithmetic.mjs';
import { drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawJailerSurfaces(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-jailer-surfaces-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-jailer-surfaces-' + name);
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
  api.focus.target('sp-jailer-surfaces-mechanism', () => {
    const q = currentBeat === 0 ? 0 : currentBeat === 1 ? cueProgress('view', 1) : 1,
      narrowed = q > 0;
    drawRectangle(ctx, api, 180, 295, 1560, 595, themeColors.yellow);
    drawText(ctx, api, 'Trusted host / KVM / management', 220, 345, 32, themeColors.yellow);
    drawRectangle(ctx, api, mix(330, 620, q), 390, mix(1260, 680, q), 360, themeColors.blue);
    drawText(ctx, api, 'VMM', mix(375, 665, q), 445, 34, themeColors.blue);
    drawRectangle(ctx, api, mix(460, 760, q), 500, mix(970, 390, q), 180, themeColors.cyan);
    drawText(ctx, api, 'Guest kernel + user job', mix(495, 795, q), 595, 30, themeColors.cyan);
    if (currentBeat === 1) {
      drawText(
        ctx,
        api,
        'Restricted filesystem / uid / gid / cgroup / syscall filters',
        230,
        830,
        28,
        themeColors.green,
      );
      if (resultComplete('join', 1)) {
        drawRectangle(ctx, api, 1400, 520, 280, 165, themeColors.green);
        drawText(ctx, api, 'existing netns', 1425, 575, 27, themeColors.green);
        drawText(ctx, api, 'join, not create', 1425, 635, 25, themeColors.green);
      }
    }
    if (currentBeat === 2) {
      const q = cueProgress('output', 2);
      for (let i = 0; i < 8; i++)
        drawRectangle(
          ctx,
          api,
          330 + i * 150,
          795,
          110,
          38,
          i < q * 8 ? themeColors.pink : themeColors.muted,
        );
      drawText(ctx, api, 'Bound serial / VMM output', 280, 925, 30, themeColors.pink);
      drawText(
        ctx,
        api,
        resultComplete('transport', 2)
          ? 'VirtIO transport ≠ arbitrary passthrough'
          : 'MMIO / optional PCI transport',
        1040,
        925,
        28,
        themeColors.yellow,
      );
    }
    drawFooter(
      ctx,
      api,
      'The restricted host context narrows authority; the host and VMM remain trusted.',
    );
  });
}
export default {
  id: 'jailer-surfaces',
  draw: drawJailerSurfaces,
  cues: [
    'sp-jailer-surfaces-0',
    'sp-jailer-surfaces-1',
    'sp-jailer-surfaces-view',
    'sp-jailer-surfaces-join',
    'sp-jailer-surfaces-2',
    'sp-jailer-surfaces-output',
    'sp-jailer-surfaces-transport',
  ],
};
