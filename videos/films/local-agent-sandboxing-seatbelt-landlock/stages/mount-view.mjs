import { clamp } from '../construction.mjs';
import {
  drawSandboxExpansionBox,
  drawSandboxExpansionRoute,
  drawSandboxExpansionTarget,
  drawSandboxExpansionText,
  drawSandboxExpansionTitle,
} from '../defaults.mjs';
export function drawMountView(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress2 = clamp(state.beatP ?? 0);
  const q = (id, start = 0.12, end = 0.8) => {
    const c = state.cues?.[id];
    return c
      ? c.phase === 'before'
        ? 0
        : c.phase === 'after'
          ? 1
          : clamp(c.progress)
      : api.phase(progress2, start, end);
  };
  {
    drawSandboxExpansionTitle(
      ctx,
      api,
      currentBeat ? 'What stops the metadata write?' : 'Files visible to the worker',
    );
    drawSandboxExpansionTarget(ctx, api, currentBeat ? 'mount-seccomp' : 'mount-view', () => {
      if (!currentBeat) {
        drawSandboxExpansionText(ctx, api, 'Host resource', 470, 365, 31, themeColors.muted);
        drawSandboxExpansionText(ctx, api, 'Worker mount', 1340, 365, 31, themeColors.muted);
        const rows = [
          ['project/src', '/app/src', 'RW', themeColors.green],
          ['project/.git', '/app/.git', 'RO', themeColors.yellow],
          ['system runtime', '/usr + tools', 'RO', themeColors.blue],
          ['temporary scratch', '/tmp', 'RW', themeColors.cyan],
        ];
        rows.forEach(([host, mount, rights, col], i) => {
          const y = 415 + i * 135,
            a = drawSandboxExpansionBox(ctx, api, host, 170, y, 600, 90, themeColors.blue, 32),
            z = drawSandboxExpansionBox(ctx, api, mount, 1030, y, 530, 90, col, 32);
          drawSandboxExpansionRoute(
            ctx,
            api,
            'mount-' + i,
            a,
            z,
            clamp(q('mount-view-step-1', 0.05, 0.7) * 4 - i),
            col,
          );
          drawSandboxExpansionBox(ctx, api, rights, 1620, y, 130, 90, col, 29);
        });
      } else {
        drawSandboxExpansionBox(ctx, api, '/app/.git', 170, 400, 750, 125, themeColors.blue, 37);
        const progress = q('mount-view-step-2', 0.26, 0.46);
        drawSandboxExpansionBox(
          ctx,
          api,
          'Seccomp filter',
          1100,
          400,
          650,
          125,
          progress > 0 ? themeColors.yellow : themeColors.muted,
          33,
        );
        drawSandboxExpansionText(ctx, api, 'Read-only mount', 545, 610, 29, themeColors.blue);
        drawSandboxExpansionText(
          ctx,
          api,
          progress > 0 ? 'Descriptor slot is empty' : 'Descriptor slot',
          1425,
          610,
          29,
          progress > 0 ? themeColors.yellow : themeColors.muted,
        );
        drawSandboxExpansionText(ctx, api, 'Metadata write denied', 545, 805, 29, themeColors.pink);
        if (progress > 0)
          drawSandboxExpansionText(
            ctx,
            api,
            'Supply a filter to restrict calls',
            1425,
            805,
            29,
            themeColors.yellow,
          );
      }
    });
    return;
  }
}
export default {
  id: 'mount-view',
  draw: drawMountView,
  cues: ['mount-view-step-1', 'mount-view-step-2'],
};
