import { resourceFixture, runtimeProbe } from '../model.mjs';
import {
  drawSandboxArtifactHeader,
  drawSandboxCard,
  drawSandboxStage,
  drawSandboxText,
  drawSandboxTransfer,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
} from '../defaults.mjs';
export function paintControlsByFailureLegacy(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  phase,
  t,
  currentBeat,
  beatProgress,
  routeProgress,
) {
  const probes = runtimeProbe().slice(0, currentBeat === 0 ? 3 : 5);
  const rows = probes.map((probe, index) => {
    const y = 300 + index * 128;
    const attempt = api.focus.target('unsafe-operation', () =>
      drawSandboxCard(
        ctx,
        api,
        themeColors,
        c,
        probe.attempt,
        105,
        y,
        480,
        themeColors.pink,
        92,
        26,
      ),
    );
    const boundary = api.focus.target('runtime-control', () =>
      drawSandboxCard(
        ctx,
        api,
        themeColors,
        c,
        probe.boundary,
        715,
        y,
        480,
        themeColors.yellow,
        92,
        25,
      ),
    );
    const outcome = api.focus.target('control-outcome', () =>
      drawSandboxCard(
        ctx,
        api,
        themeColors,
        c,
        probe.outcome,
        1325,
        y,
        490,
        index < 2 ? themeColors.green : themeColors.blue,
        92,
        25,
      ),
    );
    drawSandboxTransfer(
      ctx,
      api,
      themeColors,
      routeProgress,
      t,
      attempt,
      boundary,
      themeColors.pink,
      routeProgress,
    );
    drawSandboxTransfer(
      ctx,
      api,
      themeColors,
      routeProgress,
      t,
      boundary,
      outcome,
      themeColors.green,
      currentBeat > 0 ? routeProgress : 0,
      currentBeat > 0 ? 1 : 0,
    );
    return outcome;
  });
  drawSandboxText(
    ctx,
    api,
    themeColors,
    currentBeat === 0
      ? 'Start with capabilities the task actually needs'
      : 'Each control produces its own observable result',
    960,
    230,
    33,
    themeColors.ink,
    'center',
  );
}
export function paintControlsByFailure(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  currentBeat,
  beatProgress,
  id,
  on,
  done,
) {
  drawSandboxArtifactHeader(ctx, api, themeColors);
  const f = resourceFixture();
  drawSandboxUpgradePanel(ctx, api, themeColors, c, 150, 350, 1100, 555, themeColors.blue);
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Job memory 512 MiB',
    700,
    410,
    37,
    themeColors.blue,
    'center',
  );
  drawSandboxUpgradePanel(ctx, api, themeColors, c, 200, 540, 500, 285, themeColors.cyan);
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Scratch 64 MiB',
    450,
    600,
    32,
    themeColors.cyan,
    'center',
  );
  drawSandboxUpgradePanel(
    ctx,
    api,
    themeColors,
    c,
    230,
    660,
    440,
    105,
    themeColors.muted,
    themeColors.bg,
  );
  drawSandboxUpgradePanel(
    ctx,
    api,
    themeColors,
    c,
    230,
    660,
    440 * (currentBeat > 0 ? 0.98 : 0.65),
    105,
    themeColors.cyan,
    themeColors.cyan,
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    currentBeat > 0 ? 'Next write: ENOSPC' : 'Scratch uses job memory',
    450,
    865,
    31,
    currentBeat > 0 ? themeColors.pink : themeColors.cyan,
    'center',
  );
  api.circle(ctx, 980, 610, 82, themeColors.bg, themeColors.green, 4);
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'P2 alive',
    980,
    620,
    31,
    themeColors.green,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    currentBeat === 1 && on('task-full') ? 'Task 65: EAGAIN' : 'Task cap 64 includes threads',
    980,
    805,
    29,
    themeColors.yellow,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'CPU period 100 ms',
    1540,
    390,
    34,
    themeColors.yellow,
    'center',
  );
  drawSandboxUpgradePanel(
    ctx,
    api,
    themeColors,
    c,
    1370,
    460,
    340,
    105,
    themeColors.muted,
    themeColors.bg,
  );
  drawSandboxUpgradePanel(
    ctx,
    api,
    themeColors,
    c,
    1370,
    460,
    170,
    105,
    themeColors.yellow,
    themeColors.yellow,
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    '50 ms aggregate',
    1540,
    630,
    32,
    themeColors.yellow,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    done('cpu-result') ? '0.5 CPU ≠ timeout' : 'CPU equivalent pending',
    1540,
    735,
    34,
    done('cpu-result') ? themeColors.pink : themeColors.muted,
    'center',
  );
  drawSandboxUpgradeCard(
    ctx,
    api,
    themeColors,
    c,
    'External wall deadline\n30 seconds + whole-job teardown',
    1300,
    825,
    500,
    130,
    themeColors.pink,
    26,
  );
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Illustrative Docker limits; quota errors leave existing work alive; aggregate concurrency also needs host headroom',
  );
}
export function drawControlsByFailure(ctx, scene, state, api) {
  return drawSandboxStage(
    ctx,
    scene,
    state,
    api,
    paintControlsByFailure,
    paintControlsByFailureLegacy,
  );
}
export default {
  id: 'controls-by-failure',
  draw: drawControlsByFailure,
  cues: [
    'controls-by-failure-b1-1',
    'controls-by-failure-b2-1',
    'controls-by-failure-b2-2',
    'controls-by-failure-scratch-full',
    'controls-by-failure-task-full',
    'controls-by-failure-b3-1',
    'controls-by-failure-b3-2',
    'controls-by-failure-cpu-bandwidth',
    'controls-by-failure-extension-4',
    'controls-by-failure-cpu-result',
  ],
};
