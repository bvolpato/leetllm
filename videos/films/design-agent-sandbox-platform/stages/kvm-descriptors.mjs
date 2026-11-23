import { clamp, motion } from '../arithmetic.mjs';
import { drawArrow, drawCell, drawFooter, drawRectangle, drawText } from '../defaults.mjs';
export function drawKvmDescriptors(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const cue = (name, index) => {
      const q = state.cues?.['sp-kvm-descriptors-' + name];
      if (state.cues && !q) throw Error('Missing current scene cue sp-kvm-descriptors-' + name);
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
    resultComplete = (n, i) => cue(n, i).done;
  api.focus.target('sp-kvm-descriptors-mechanism', () => {
    const names = ['/dev/kvm', 'system fd', 'VM fd', 'vCPU fd'],
      active = [
        true,
        resultComplete('system', 0),
        resultComplete('vm', 0),
        resultComplete('cpu', 0),
      ];
    names.forEach((n, i) => {
      drawRectangle(
        ctx,
        api,
        170 + i * 420,
        315,
        330,
        110,
        active[i] ? themeColors.blue : themeColors.muted,
      );
      drawText(
        ctx,
        api,
        n,
        335 + i * 420,
        385,
        32,
        active[i] ? themeColors.blue : themeColors.muted,
        'center',
      );
      if (i) drawArrow(ctx, api, 115 + i * 420, 370, 160 + i * 420, 370, themeColors.cyan);
    });
    if (currentBeat === 0) {
      drawRectangle(ctx, api, 660, 565, 710, 180, themeColors.cyan);
      drawText(ctx, api, 'Host userspace memory', 695, 615, 30, themeColors.cyan);
      drawText(ctx, api, 'Register guest physical regions', 695, 690, 29);
      drawArrow(ctx, api, 990, 555, 1150, 440, themeColors.cyan);
    } else if (currentBeat === 1) {
      const eintr = resultComplete('eintr', 1),
        failed = resultComplete('return', 1);
      drawCell(
        ctx,
        api,
        'KVM_RUN return',
        failed ? '-1 / EINTR' : '0 → current exit reason',
        170,
        560,
        670,
        failed ? themeColors.pink : themeColors.green,
      );
      drawCell(
        ctx,
        api,
        'Loop obligation',
        eintr ? 'shutdown check → retry' : 'inspect current return first',
        1010,
        560,
        700,
        themeColors.yellow,
      );
      if (failed) {
        drawRectangle(ctx, api, 170, 790, 670, 105, themeColors.pink);
        drawText(ctx, api, 'Old exit reason: not consulted', 205, 855, 30, themeColors.pink);
      }
    } else {
      [
        'MMIO → device handler',
        'port I/O → device handler',
        'HLT → lifecycle policy',
        'unhandled → stop sketch',
      ].forEach((n, i) => {
        const x = 175 + (i % 2) * 850,
          y = 535 + Math.floor(i / 2) * 180;
        drawRectangle(ctx, api, x, y, 760, 125, i === 3 ? themeColors.pink : themeColors.cyan);
        drawText(ctx, api, n, x + 25, y + 75, 30, i === 3 ? themeColors.pink : themeColors.cyan);
      });
    }
    drawFooter(
      ctx,
      api,
      'Actual C loop branches; no guest setup, device implementation or KVM execution.',
    );
  });
}
export default {
  id: 'kvm-descriptors',
  draw: drawKvmDescriptors,
  cues: [
    'sp-kvm-descriptors-0',
    'sp-kvm-descriptors-system',
    'sp-kvm-descriptors-vm',
    'sp-kvm-descriptors-cpu',
    'sp-kvm-descriptors-1',
    'sp-kvm-descriptors-eintr',
    'sp-kvm-descriptors-return',
    'sp-kvm-descriptors-2',
    'sp-kvm-descriptors-exit',
  ],
};
