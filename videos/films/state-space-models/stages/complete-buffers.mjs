import { xs } from '../fixtures.mjs';
import { bufferConstruction, bufferFixture } from '../model.mjs';
import { box, cueDone, cueMotion, extensionText, footer } from '../defaults.mjs';
export function drawCompleteBuffers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    actualBeat = state.beat ?? 0;
  const currentBeat = actualBeat;
  const progress = api.clamp(state.beatP ?? 0);
  const cueProgress = (id) => (state.cues ? (state.cues[id]?.progress ?? 0) : progress);
  const resultComplete = (id) =>
    state.cues ? state.cues[id]?.phase === 'after' : progress >= 0.98;
  const build = (id) => (resultComplete(id) ? 1 : 0.96 * cueProgress(id));
  const target =
    currentBeat < 3
      ? 'complete-buffers' + '-mechanism'
      : 'complete-buffers' + '-extension-' + (currentBeat + 1);
  api.focus.target(target, () => {
    if (currentBeat === 0) {
      extensionText(ctx, api, 'Count the live state separately from saved snapshots', 960, 280, 39);
      box(ctx, api, '5 MiB live', 150, 445, 280, 100, themeColors.green, 33);
      for (let row = 0; row < 2; row++) {
        const cue = row ? 'ssm-snapshots325' : 'ssm-snapshots45',
          n = row ? 64 : 8,
          count = Math.floor(n * build(cue));
        const y = row ? 680 : 425;
        extensionText(
          ctx,
          api,
          row ? '65,536 positions' : '8,192 positions',
          1040,
          y - 50,
          32,
          themeColors.blue,
        );
        for (let i = 0; i < count; i++)
          api.rect(ctx, 570 + (i % 16) * 70, y + Math.floor(i / 16) * 40, 50, 27, themeColors.blue);
        extensionText(
          ctx,
          api,
          resultComplete(cue)
            ? n + ' × 5 + 5 = ' + (n + 1) * 5 + ' MiB'
            : 'One separate snapshot every 1,024 positions',
          1100,
          row ? 905 : 555,
          29,
          resultComplete(cue) ? themeColors.yellow : themeColors.muted,
        );
      }
      footer(
        ctx,
        api,
        'Supplied policy: a complete 5 MiB stack state plus separate copies, including boundary snapshots',
      );
    } else {
      const firstShift = cueMotion(state, 'append-four', 1, 0.6, 0.78);
      const secondShift = cueMotion(state, 'append-two', 2, 0.62, 0.73);
      const cleared = cueDone(state, 'clear-window', 1, 0.55);
      const showWrite = cueDone(state, 'compare-writes', 2, 0.35);
      const showFirst = cueDone(state, 'ssm-buffer-first', 2, 0.57);
      const showSecond = cueDone(state, 'ssm-buffer-second', 2, 0.85);
      const showLost = cueDone(state, 'ssm-buffer-dropped', 2, 0.91);
      const step = secondShift > 0 || showSecond ? 1 : firstShift > 0 || showFirst ? 0 : -1;
      const move = step === 1 ? (showSecond ? 1 : secondShift) : showFirst ? 1 : firstShift;
      extensionText(ctx, api, 'Same saved h = 2.15', 960, 270, 44);
      ['oldest   × 0.2', '× 0.3', 'newest   × 0.5'].forEach((label, j) =>
        extensionText(ctx, api, label, 550 + j * 190, 375, 32, themeColors.muted),
      );
      extensionText(ctx, api, 'new write', 1290, 375, 34, themeColors.muted);
      extensionText(ctx, api, 'live state', 1630, 375, 34, themeColors.muted);
      for (const i of [0, 1]) {
        const y = 460 + i * 260,
          drop = i === 1 && cleared;
        const color = i ? themeColors.pink : themeColors.blue;
        const prior = bufferConstruction(step - 1, drop);
        const next = bufferConstruction(step, drop);
        extensionText(ctx, api, i ? 'Copy B' : 'Copy A', 200, y + 68, 46, color);
        extensionText(ctx, api, drop ? 'window cleared' : 'saved window', 200, y + 125, 31, color);
        const base = 550,
          dx = 190,
          w = 122;
        const moving = step >= 0 && move < 1;
        const cells = moving ? [...prior.buffer, xs[step + 2]] : next.buffer;
        cells.forEach((value, j) => {
          if (moving && j === 0 && move > 0.4) return;
          if (moving && j === 3 && move === 0) return;
          const x = base + (j - (moving ? move : 0)) * dx;
          box(ctx, api, String(value), x - w / 2, y, w, 103, color, 48);
        });
        const hasWrite =
          (step === 0 && (showWrite || showFirst)) || (step === 1 && (i ? showLost : showSecond));
        extensionText(
          ctx,
          api,
          hasWrite ? String(Number(next.write.toFixed(2))) : '?',
          1290,
          y + 72,
          54,
          hasWrite ? color : themeColors.muted,
        );
        const settled = step === 1 ? (i ? showLost : showSecond) : step === 0 && showFirst;
        const h = settled ? next.state : prior.state;
        extensionText(ctx, api, 'h = ' + h.toFixed(4), 1630, y + 72, 43, themeColors.green);
        if (step >= 0 && move === 1)
          extensionText(
            ctx,
            api,
            next.buffer.map((x, j) => [0.2, 0.3, 0.5][j] + ' × ' + x).join('   +   '),
            775,
            y + 156,
            33,
            color,
          );
      }
      const reference = bufferFixture().uninterrupted.state;
      footer(
        ctx,
        api,
        showSecond
          ? 'Uninterrupted final state = ' + reference.toFixed(4)
          : state.beat === 1
            ? 'Which copy writes more on input 4, and which old values account for the gap?'
            : 'New state = half the previous state + the convolution write',
      );
    }
  });
}
export default {
  id: 'complete-buffers',
  draw: drawCompleteBuffers,
};
