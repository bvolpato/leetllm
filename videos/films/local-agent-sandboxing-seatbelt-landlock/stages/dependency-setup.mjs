import { clamp } from '../construction.mjs';
import {
  drawSandboxExpansionBox,
  drawSandboxExpansionRoute,
  drawSandboxExpansionTarget,
  drawSandboxExpansionText,
  drawSandboxExpansionTitle,
} from '../defaults.mjs';
export function drawDependencySetup(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0);
  const q = (id, start = 0.12, end = 0.8) => {
    const c = state.cues?.[id];
    return c
      ? c.phase === 'before'
        ? 0
        : c.phase === 'after'
          ? 1
          : clamp(c.progress)
      : api.phase(progress, start, end);
  };
  {
    drawSandboxExpansionTitle(
      ctx,
      api,
      currentBeat
        ? 'An unsupported required boundary leaves launch blocked'
        : 'From the approved package to the running test',
    );
    drawSandboxExpansionTarget(
      ctx,
      api,
      currentBeat ? 'dependency-probe' : 'dependency-trust',
      () => {
        if (!currentBeat) {
          const store = drawSandboxExpansionBox(
              ctx,
              api,
              'Approved package bytes',
              170,
              390,
              680,
              100,
              themeColors.blue,
              36,
            ),
            hash = drawSandboxExpansionBox(
              ctx,
              api,
              'Trusted lockfile digest',
              1100,
              390,
              650,
              100,
              themeColors.yellow,
              34,
            );
          drawSandboxExpansionRoute(
            ctx,
            api,
            'package-to-approved-hash',
            store,
            hash,
            q('dependency-setup-step-1', 0.05, 0.4),
            themeColors.cyan,
          );
          drawSandboxExpansionBox(
            ctx,
            api,
            'Read-only package mount',
            170,
            670,
            680,
            100,
            themeColors.green,
            35,
          );
          const proc = drawSandboxExpansionBox(
            ctx,
            api,
            'Package executes in worker',
            1100,
            670,
            650,
            100,
            themeColors.yellow,
            32,
          );
          drawSandboxExpansionRoute(
            ctx,
            api,
            'mounted-package-to-worker',
            {
              x: 170,
              y: 670,
              width: 680,
              height: 100,
            },
            proc,
            q('dependency-setup-step-1', 0.3, 0.6),
            themeColors.yellow,
          );
          drawSandboxExpansionText(
            ctx,
            api,
            'Hash match = identity relative to reference',
            960,
            900,
            34,
            themeColors.cyan,
          );
          drawSandboxExpansionText(
            ctx,
            api,
            'Filesystem / credentials / network restrictions still apply',
            960,
            970,
            31,
            themeColors.yellow,
          );
        } else {
          const cases = [
            ['ENOSYS', 'Syscall unavailable'],
            ['EOPNOTSUPP', 'Support disabled'],
          ];
          cases.forEach(([code, meaning], i) => {
            const y = 400 + i * 230;
            drawSandboxExpansionBox(ctx, api, code, 170, y, 570, 100, themeColors.pink, 36);
            drawSandboxExpansionBox(ctx, api, meaning, 1040, y, 710, 100, themeColors.muted, 33);
            api.arrow(ctx, 770, y + 50, 1010, y + 50, themeColors.pink, 3);
          });
          drawSandboxExpansionBox(
            ctx,
            api,
            'REQUIRED PROTECTION → NO WORKER LAUNCH',
            300,
            875,
            1320,
            95,
            themeColors.pink,
            35,
          );
        }
      },
    );
    return;
  }
}
export default {
  id: 'dependency-setup',
  draw: drawDependencySetup,
  cues: ['dependency-setup-step-1', 'dependency-setup-step-2'],
};
