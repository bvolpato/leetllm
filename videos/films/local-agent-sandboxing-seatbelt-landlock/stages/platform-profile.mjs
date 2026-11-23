import { clamp } from '../construction.mjs';
import {
  drawSandboxExpansionBox,
  drawSandboxExpansionFoot,
  drawSandboxExpansionRoute,
  drawSandboxExpansionTarget,
  drawSandboxExpansionText,
  drawSandboxExpansionTitle,
} from '../defaults.mjs';
export function drawPlatformProfile(ctx, scene, state, api) {
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
    },
    on = (id, start = 0.2) => q(id, start, start + 0.02) > 0;
  {
    drawSandboxExpansionTitle(
      ctx,
      api,
      currentBeat
        ? 'Initialize the custom profile before admitting the child'
        : 'A whole-project grant includes repository metadata',
    );
    drawSandboxExpansionTarget(
      ctx,
      api,
      currentBeat ? 'platform-wrapper' : 'platform-grant',
      () => {
        if (!currentBeat) {
          const broad = on('platform-whole-project', 0.35),
            later = on('platform-delayed', 0.65);
          drawSandboxExpansionBox(
            ctx,
            api,
            'Parameterized project',
            160,
            380,
            620,
            100,
            themeColors.blue,
            35,
          );
          ['src/', '.git/config', '.git/hooks/'].forEach((name, i) => {
            const y = 565 + i * 120;
            drawSandboxExpansionBox(
              ctx,
              api,
              name,
              160,
              y,
              620,
              85,
              broad ? themeColors.green : themeColors.muted,
              33,
            );
            if (broad) drawSandboxExpansionText(ctx, api, 'RW', 720, y + 55, 24, themeColors.green);
          });
          drawSandboxExpansionBox(
            ctx,
            api,
            'Direct ~/.ssh read',
            1130,
            380,
            620,
            100,
            themeColors.pink,
            35,
          );
          drawSandboxExpansionText(ctx, api, 'DENY', 1440, 545, 38, themeColors.pink);
          const host = drawSandboxExpansionBox(
            ctx,
            api,
            later ? 'Host Git may run a hook' : 'Later host trigger',
            1130,
            750,
            620,
            110,
            later ? themeColors.pink : themeColors.muted,
            29,
          );
          if (broad && later)
            drawSandboxExpansionRoute(
              ctx,
              api,
              'platform-hook-to-host',
              {
                x: 160,
                y: 805,
                width: 620,
                height: 85,
              },
              host,
              1,
              themeColors.pink,
            );
          drawSandboxExpansionText(
            ctx,
            api,
            'The host checkout reads project metadata',
            960,
            975,
            32,
            themeColors.yellow,
          );
        } else {
          const paths = [
            ['PROJECT_DIR', '/Users/dev/workspace'],
            ['TARGET_HOME_SSH', '/Users/dev/.ssh'],
            ['TARGET_HOME_AWS', '/Users/dev/.aws'],
            ['TARGET_HOME_KEYCHAIN', '/Users/dev/Library/Keychains'],
          ];
          paths.forEach(([parameter, value], i) => {
            const y = 355 + i * 99;
            api.text(ctx, parameter, 210, y + 42, 35, themeColors.blue, 'left', 'mono');
            api.arrow(ctx, 790, y + 29, 930, y + 29, themeColors.muted, 3);
            api.text(ctx, value, 1010, y + 42, 34, themeColors.ink, 'left', 'mono');
          });
          const applied = q('platform-profile-step-2', 0.1, 0.6);
          drawSandboxExpansionText(
            ctx,
            api,
            applied > 0
              ? 'Supply all four parameters → initialize → check result'
              : 'Wrapper parameter slots must all be bound',
            960,
            800,
            35,
            themeColors.yellow,
          );
          drawSandboxExpansionText(
            ctx,
            api,
            'App Sandbox uses entitlements',
            960,
            915,
            35,
            themeColors.cyan,
          );
        }
      },
    );
    drawSandboxExpansionFoot(ctx, api, 'Example profile from the article');
    return;
  }
}
export default {
  id: 'platform-profile',
  draw: drawPlatformProfile,
  cues: [
    'platform-profile-step-1',
    'platform-whole-project',
    'platform-delayed',
    'platform-profile-step-2',
  ],
};
