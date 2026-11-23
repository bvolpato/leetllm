import { cleanupFixture } from '../model.mjs';
import {
  drawSandboxArtifactHeader,
  drawSandboxCard,
  drawSandboxStage,
  drawSandboxTransfer,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
} from '../defaults.mjs';
export function paintTeardownLifecycleLegacy(
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
  const cleanup = cleanupFixture();
  const reusable = currentBeat > 2 || (currentBeat === 2 && beatProgress >= 0.4);
  const events = [
    ['running', cleanup.old.status],
    ['cancel requested', cleanup.requested.status],
    ['processes gone', cleanup.terminated.status],
    ['reset verified', cleanup.reusable.status],
  ];
  const blocks = events.map(([label], index) => {
    const active = index < Math.min(currentBeat + 1, 3) || (index === 3 && reusable);
    const color =
      index === 3
        ? reusable
          ? themeColors.green
          : currentBeat === 2
            ? themeColors.yellow
            : themeColors.muted
        : active
          ? [themeColors.blue, themeColors.yellow, themeColors.cyan][index]
          : themeColors.muted;
    const detail = index === 3 ? (reusable ? 'slot reusable' : 'verify reset') : 'worker-A / g7';
    return api.focus.target('worker-lifecycle', () =>
      drawSandboxCard(
        ctx,
        api,
        themeColors,
        c,
        `${label}\n${detail}`,
        105 + index * 445,
        410,
        390,
        color,
        145,
        27,
      ),
    );
  });
  blocks.slice(0, -1).forEach((shape, index) => {
    const reveal = index === 2 ? reusable : index < currentBeat;
    drawSandboxTransfer(
      ctx,
      api,
      themeColors,
      routeProgress,
      t,
      shape,
      blocks[index + 1],
      [themeColors.yellow, themeColors.cyan, themeColors.green][index],
      reveal ? 1 : index === currentBeat ? routeProgress : 0,
      reveal || index === currentBeat ? 1 : 0,
    );
  });
  const raced = api.focus.target('new-runtime-generation', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      `Slot A · generation 8\n${cleanup.lateOld.status}`,
      110,
      650,
      400,
      themeColors.blue,
      145,
      25,
    ),
  );
  const oldTarget = api.focus.target('old-cleanup', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      'Late cleanup request\ntargets generation 7',
      540,
      650,
      400,
      themeColors.pink,
      145,
      25,
    ),
  );
  const gate = api.focus.target('generation-check', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      'Identity check\n7 ≠ 8 · ignore request',
      970,
      650,
      400,
      themeColors.yellow,
      145,
      25,
    ),
  );
  const quarantine = drawSandboxCard(
    ctx,
    api,
    themeColors,
    c,
    reusable
      ? `Unknown outcome\n${cleanup.lost.status.toUpperCase()}`
      : 'Unknown outcome\nhold the slot',
    1400,
    650,
    400,
    reusable ? themeColors.pink : themeColors.yellow,
    145,
    25,
  );
  drawSandboxTransfer(
    ctx,
    api,
    themeColors,
    routeProgress,
    t,
    oldTarget,
    gate,
    themeColors.cyan,
    currentBeat >= 1 ? routeProgress : 0,
    currentBeat >= 1 ? 1 : 0,
  );
}
export function paintTeardownLifecycle(
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
  const reusable = currentBeat > 2 || (currentBeat === 2 && done('reset-confirm')),
    newer = currentBeat > 2 || (currentBeat === 2 && done('new-occupant')),
    terminated = reusable,
    oldAction = currentBeat > 2 || (currentBeat === 2 && done('old-action'));
  drawSandboxUpgradePanel(
    ctx,
    api,
    themeColors,
    c,
    160,
    350,
    1000,
    570,
    newer ? themeColors.blue : themeColors.yellow,
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Reusable slot A',
    660,
    420,
    40,
    themeColors.ink,
    'center',
  );
  drawSandboxUpgradeCard(
    ctx,
    api,
    themeColors,
    c,
    newer ? 'worker-A/g8' : 'worker-A/g7',
    370,
    510,
    580,
    130,
    newer ? themeColors.blue : themeColors.yellow,
    40,
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    newer
      ? 'Replacement admitted after verified reset'
      : terminated
        ? 'Termination and reset verified'
        : currentBeat === 0
          ? 'Candidate exit ≠ whole job gone'
          : 'Cancellation requested; status unknown',
    660,
    790,
    32,
    terminated ? themeColors.green : themeColors.yellow,
    'center',
  );
  drawSandboxUpgradeCard(
    ctx,
    api,
    themeColors,
    c,
    'Old cleanup record\nimmutable worker-A/g7',
    1280,
    350,
    510,
    150,
    themeColors.pink,
    31,
  );
  drawSandboxUpgradeArrow(ctx, api, themeColors, 1535, 540, 1535, 640, themeColors.pink);
  drawSandboxUpgradeCard(
    ctx,
    api,
    themeColors,
    c,
    oldAction
      ? 'Targets old g7 only\ng8 stays running'
      : newer
        ? 'Late cleanup identity\nresult pending'
        : 'Independent reaper\nholds unconfirmed slot',
    1280,
    680,
    510,
    170,
    oldAction ? themeColors.green : themeColors.yellow,
    31,
  );
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    currentBeat === 3
      ? 'cgroup/namespace teardown contains descendants; a reusable-name backend must enforce generation with destruction'
      : 'Cancellation request, confirmed termination and reset are separate facts; unknown outcomes stay quarantined',
  );
}
export function drawTeardownLifecycle(ctx, scene, state, api) {
  return drawSandboxStage(
    ctx,
    scene,
    state,
    api,
    paintTeardownLifecycle,
    paintTeardownLifecycleLegacy,
  );
}
export default {
  id: 'teardown-lifecycle',
  draw: drawTeardownLifecycle,
  cues: [
    'teardown-lifecycle-b1-1',
    'teardown-lifecycle-b2-1',
    'teardown-lifecycle-b3-1',
    'teardown-lifecycle-b3-2',
    'teardown-lifecycle-terminate-confirm',
    'teardown-lifecycle-reset-confirm',
    'teardown-lifecycle-new-occupant',
    'teardown-lifecycle-old-action',
    'teardown-lifecycle-extension-4',
  ],
};
