import { clamp } from '../construction.mjs';
import {
  drawSandboxExpansionBox,
  drawSandboxExpansionFoot,
  drawSandboxExpansionRoute,
  drawSandboxExpansionTarget,
  drawSandboxExpansionText,
  drawSandboxExpansionTitle,
} from '../defaults.mjs';
export function drawDelayedConfig(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
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
        ? 'A folder-open task on disk'
        : 'A configuration value needs its specific trusted trigger',
    );
    drawSandboxExpansionTarget(ctx, api, currentBeat ? 'delayed-editor' : 'delayed-git', () => {
      if (!currentBeat) {
        const rows = [
          ['.git/config: fsmonitor', 'Operation using fsmonitor'],
          ['diff.external / driver', 'Enabled external diff operation'],
        ];
        rows.forEach(([config, trigger], i) => {
          const y = 400 + i * 245,
            source = drawSandboxExpansionBox(
              ctx,
              api,
              config,
              170,
              y,
              650,
              95,
              themeColors.yellow,
              31,
            ),
            host = drawSandboxExpansionBox(
              ctx,
              api,
              trigger,
              1050,
              y,
              700,
              95,
              themeColors.blue,
              31,
            );
          drawSandboxExpansionRoute(
            ctx,
            api,
            'delayed-consumer-' + i,
            source,
            host,
            q('delayed-config-step-1', 0.2, 0.75),
            themeColors.yellow,
          );
          drawSandboxExpansionText(
            ctx,
            api,
            'Host-account command',
            1400,
            y + 175,
            32,
            on('delayed-config-step-1', 0.4) ? themeColors.pink : themeColors.muted,
          );
        });
      } else {
        const elapsed =
          q('delayed-save', 0.14, 0.26) +
          2 * q('delayed-exit', 0.26, 0.34) +
          3 * q('delayed-approve', 0.48, 0.61) +
          2 * q('delayed-config-step-2', 0.62, 0.77);
        const intervals = [
          {
            id: 'worker',
            lane: 'worker',
            start: 0,
            end: Math.min(3, elapsed),
            color: themeColors.blue,
          },
          {
            id: 'config',
            lane: 'file',
            start: 1,
            end: elapsed,
            color: themeColors.pink,
          },
          {
            id: 'host',
            lane: 'host',
            start: 6,
            end: elapsed,
            color: themeColors.yellow,
          },
        ].filter((x) => x.end > x.start);
        teaching.timeline({
          x: 170,
          y: 370,
          width: 1580,
          height: 420,
          domain: [0, 8],
          time: elapsed,
          labelWidth: 250,
          fontSize: 27,
          lanes: [
            {
              id: 'worker',
              label: 'Worker lifetime',
            },
            {
              id: 'file',
              label: 'Same task file',
            },
            {
              id: 'host',
              label: 'Trusted host',
            },
          ],
          intervals,
          ticks: [0, 1, 3, 6, 8],
          formatTime: (x) => x + 's',
        });
        drawSandboxExpansionText(
          ctx,
          api,
          elapsed < 3
            ? 'Worker saves folder-open task'
            : elapsed < 6
              ? 'Worker ended · task file remains'
              : 'Host trust + approval → host command',
          960,
          910,
          38,
          elapsed >= 6 ? themeColors.pink : themeColors.yellow,
        );
      }
    });
    drawSandboxExpansionFoot(
      ctx,
      api,
      'Trust policy, approval and the actual operation determine whether a consumer executes the file.',
    );
    return;
  }
}
export default {
  id: 'delayed-config',
  draw: drawDelayedConfig,
  cues: [
    'delayed-config-step-1',
    'delayed-save',
    'delayed-exit',
    'delayed-approve',
    'delayed-config-step-2',
  ],
};
