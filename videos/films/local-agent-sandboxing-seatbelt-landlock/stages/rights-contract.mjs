import { clamp } from '../construction.mjs';
import {
  drawSandboxExpansionBox,
  drawSandboxExpansionFoot,
  drawSandboxExpansionRoute,
  drawSandboxExpansionTarget,
  drawSandboxExpansionText,
  drawSandboxExpansionTitle,
} from '../defaults.mjs';
export function drawRightsContract(ctx, scene, state, api) {
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
    if (currentBeat === 0) {
      drawSandboxExpansionTitle(ctx, api, 'Choose the operation contract before choosing the ABI');
      drawSandboxExpansionTarget(ctx, api, 'rights-operations', () => {
        const operations = ['READ_FILE', 'WRITE_FILE', 'TRUNCATE', 'MAKE_REG', 'REFER'],
          xs = [170, 500, 830, 1160, 1490],
          reached = q('rights-contract-step-1', 0.2, 0.5);
        operations.forEach((op, i) => {
          drawSandboxExpansionBox(
            ctx,
            api,
            op,
            xs[i],
            400,
            260,
            95,
            i === 2 ? themeColors.yellow : themeColors.blue,
            29,
          );
          api.rect(
            ctx,
            xs[i] + 75,
            580,
            110,
            110,
            themeColors.panel,
            i === 1 ? themeColors.green : i === 2 ? themeColors.pink : themeColors.muted,
            10,
          );
          drawSandboxExpansionText(
            ctx,
            api,
            i === 1 ? '✓' : i === 2 && reached > 0 ? '?' : '·',
            xs[i] + 130,
            655,
            56,
            i === 1 ? themeColors.green : themeColors.yellow,
          );
        });
        drawSandboxExpansionText(
          ctx,
          api,
          'A WRITE_FILE grant does not cover every truncate operation',
          960,
          820,
          37,
          themeColors.yellow,
        );
        drawSandboxExpansionText(
          ctx,
          api,
          reached > 0
            ? 'Required feature absent → child remains absent'
            : 'Required operation set → actual kernel capability probe',
          960,
          935,
          33,
          reached > 0 ? themeColors.pink : themeColors.muted,
        );
      });
    } else if (currentBeat === 1) {
      drawSandboxExpansionTitle(ctx, api, 'A descriptor alone has not restricted a process');
      drawSandboxExpansionTarget(ctx, api, 'rights-enforcement', () => {
        const enforced = on('rights-enforce', 0.06),
          threads = on('rights-threads', 0.65);
        const descriptor = drawSandboxExpansionBox(
          ctx,
          api,
          'ruleset FD',
          170,
          395,
          400,
          105,
          themeColors.blue,
          38,
        );
        drawSandboxExpansionBox(
          ctx,
          api,
          enforced ? 'Rules added + restriction enforced' : 'create_ruleset returned a descriptor',
          760,
          395,
          990,
          105,
          enforced ? themeColors.green : themeColors.yellow,
          31,
        );
        drawSandboxExpansionRoute(
          ctx,
          api,
          'ruleset-to-enforcement',
          descriptor,
          {
            x: 760,
            y: 395,
            width: 990,
            height: 105,
          },
          enforced ? 1 : 0,
          enforced ? themeColors.green : themeColors.blue,
        );
        const positions = [350, 960, 1570];
        ['Calling thread A', 'Existing sibling B', 'Future child C'].forEach((name, i) => {
          const restricted = i === 0 ? enforced : i === 2 && threads;
          api.circle(
            ctx,
            positions[i],
            745,
            91,
            themeColors.panel,
            restricted ? themeColors.green : themeColors.muted,
            3,
          );
          drawSandboxExpansionText(
            ctx,
            api,
            name,
            positions[i],
            890,
            30,
            restricted ? themeColors.green : themeColors.muted,
          );
          if (restricted) {
            api.circle(ctx, positions[i], 745, 72, 'transparent', themeColors.green, 3);
            drawSandboxExpansionText(
              ctx,
              api,
              'restricted',
              positions[i],
              757,
              28,
              themeColors.green,
            );
          } else
            drawSandboxExpansionText(
              ctx,
              api,
              i === 2 ? 'not created' : i === 1 && enforced ? 'needs sync' : 'unrestricted',
              positions[i],
              757,
              25,
              themeColors.muted,
            );
        });
        if (threads)
          drawSandboxExpansionRoute(
            ctx,
            api,
            'restricted-future-child',
            {
              x: 259,
              y: 654,
              width: 182,
              height: 182,
            },
            {
              x: 1479,
              y: 654,
              width: 182,
              height: 182,
            },
            1,
            themeColors.green,
            [
              {
                id: 'existing-sibling-thread',
                bounds: {
                  x: 869,
                  y: 654,
                  width: 182,
                  height: 182,
                },
              },
            ],
          );
      });
    } else {
      drawSandboxExpansionTitle(ctx, api, 'An open descriptor is an inherited capability');
      drawSandboxExpansionTarget(ctx, api, 'rights-descriptors', () => {
        const old = drawSandboxExpansionBox(
            ctx,
            api,
            'Opened before restriction',
            170,
            380,
            690,
            95,
            themeColors.blue,
            35,
          ),
          file = drawSandboxExpansionBox(
            ctx,
            api,
            'Sensitive file',
            1200,
            380,
            540,
            95,
            themeColors.pink,
            37,
          ),
          closed = on('rights-fd-close', 0.65),
          retained = q('rights-contract-step-3', 0.2, 0.4);
        drawSandboxExpansionBox(
          ctx,
          api,
          closed ? 'Inherited FD closed' : 'Inherited open FD',
          170,
          655,
          690,
          110,
          closed ? themeColors.green : themeColors.yellow,
          38,
        );
        if (!closed) {
          drawSandboxExpansionRoute(
            ctx,
            api,
            'inherited-fd-read',
            {
              x: 170,
              y: 655,
              width: 690,
              height: 110,
            },
            file,
            retained,
            themeColors.yellow,
            [
              {
                id: 'old-open-caption',
                bounds: old,
              },
            ],
          );
          drawSandboxExpansionText(
            ctx,
            api,
            'Old descriptor can retain read access',
            960,
            890,
            36,
            themeColors.yellow,
          );
        } else
          drawSandboxExpansionText(
            ctx,
            api,
            'Close unneeded handles before creating untrusted work',
            960,
            890,
            34,
            themeColors.green,
          );
        drawSandboxExpansionBox(
          ctx,
          api,
          'New open(path)',
          1200,
          655,
          540,
          110,
          themeColors.blue,
          35,
        );
        drawSandboxExpansionText(
          ctx,
          api,
          'DENIED by path policy',
          1470,
          835,
          30,
          themeColors.pink,
        );
      });
    }
    drawSandboxExpansionFoot(ctx, api, 'Linux policy model');
    return;
  }
}
export default {
  id: 'rights-contract',
  draw: drawRightsContract,
  cues: [
    'rights-contract-step-1',
    'rights-contract-step-2',
    'rights-enforce',
    'rights-threads',
    'rights-contract-step-3',
    'rights-fd-close',
  ],
};
