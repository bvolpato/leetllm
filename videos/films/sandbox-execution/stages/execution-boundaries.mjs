import { runtimeBoundarySnapshot } from '../model.mjs';
import {
  drawSandboxArtifactHeader,
  drawSandboxCard,
  drawSandboxStage,
  drawSandboxText,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
} from '../defaults.mjs';
export function paintExecutionBoundariesLegacy(
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
  const v = runtimeBoundarySnapshot(currentBeat, beatProgress);
  drawSandboxText(
    ctx,
    api,
    themeColors,
    v.restrictedProbe
      ? 'Probe R2 · read /host/credentials · same configured workers'
      : 'Same fixture R1 · read /work/report.xml · 128 bytes',
    960,
    255,
    31,
    themeColors.ink,
    'center',
  );
  const cols = [
    {
      title: 'Container',
      layers: [
        'Application · open()',
        'Configured syscall filter',
        'Shared host kernel\nnamespace /work mount',
      ],
      color: themeColors.blue,
    },
    {
      title: 'gVisor',
      layers: [
        'Application · open()',
        'Sentry · syscall mediation',
        'Controlled filesystem\nbackend',
      ],
      color: themeColors.cyan,
    },
    {
      title: 'Firecracker',
      layers: ['Application · open()', 'Guest kernel', 'Virtio / VMM / KVM\nattached work volume'],
      color: themeColors.yellow,
    },
    {
      title: 'WebAssembly',
      layers: [
        'Checked guest memory',
        'Linked read report import',
        'Host implementation\nscoped report handle',
      ],
      color: themeColors.green,
    },
  ];
  cols.forEach((item, index) => {
    const x = 105 + index * 445,
      progress = v.progressByRuntime[index],
      visible = progress > 0,
      denied = v.restrictedProbe && v.probeProgress >= 0.65,
      decision = v.decisions[index];
    drawSandboxText(
      ctx,
      api,
      themeColors,
      item.title,
      x + 200,
      325,
      31,
      visible ? item.color : themeColors.muted,
      'center',
    );
    const stages = item.layers.map((label, stage) =>
      api.focus.target('runtime-' + index, () =>
        drawSandboxCard(
          ctx,
          api,
          themeColors,
          c,
          label,
          x,
          375 + stage * 145,
          400,
          denied && stage === decision.layer
            ? themeColors.pink
            : progress >= (stage + 1) / 4
              ? item.color
              : themeColors.muted,
          125,
          22,
        ),
      ),
    );
    for (let stage = 0; stage < 2; stage += 1)
      if (progress >= (stage + 1) / 3)
        api.connect(ctx, stages[stage], stages[stage + 1], {
          color: item.color,
          gap: 10,
        });
    if (denied)
      api.focus.target('denied-host-read', () =>
        drawSandboxCard(
          ctx,
          api,
          themeColors,
          c,
          'R2 · DENY before host read',
          x,
          825,
          400,
          themeColors.pink,
          75,
          22,
        ),
      );
    else if (progress === 1)
      api.focus.target('runtime-result', () =>
        drawSandboxCard(
          ctx,
          api,
          themeColors,
          c,
          v.restrictedProbe ? 'R2 · checking capability' : 'R1 result · 128 bytes',
          x,
          825,
          400,
          v.restrictedProbe ? themeColors.yellow : item.color,
          75,
          23,
        ),
      );
    else
      drawSandboxText(
        ctx,
        api,
        themeColors,
        visible ? 'R1 · boundary checks in progress' : 'Await this execution path',
        x + 200,
        865,
        22,
        themeColors.muted,
        'center',
      );
    if (denied)
      drawSandboxText(
        ctx,
        api,
        themeColors,
        decision.gate + ' · capability absent',
        x + 200,
        930,
        21,
        themeColors.pink,
        'center',
      );
  });
}
export function paintExecutionBoundaries(
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
  const swap = currentBeat === 3 && on('microvm-pair'),
    indices =
      currentBeat === 0
        ? [0]
        : currentBeat === 1
          ? [1, 2]
          : currentBeat === 2
            ? [3]
            : swap
              ? [2, 3]
              : [0, 1];
  const configs = [
      ['Container', ['Application open()', 'Permissions / syscall filter', 'Shared host kernel']],
      [
        'gVisor',
        ['Application open()', 'Sentry application kernel', 'Gofer / configured filesystem'],
      ],
      ['Firecracker', ['Guest application open()', 'Guest kernel', 'Virtio / VMM / KVM']],
      ['Wasm', ['Guest checked code', 'Explicit linked import', 'Scoped host implementation']],
    ],
    colors = [themeColors.blue, themeColors.cyan, themeColors.yellow, themeColors.green];
  indices.forEach((n, i) => {
    const x = indices.length === 1 ? 520 : 150 + i * 900,
      w = indices.length === 1 ? 880 : 720;
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      configs[n][0],
      x + w / 2,
      335,
      39,
      colors[n],
      'center',
    );
    drawSandboxUpgradePanel(ctx, api, themeColors, c, x, 390, w, 475, colors[n]);
    configs[n][1].forEach((v, j) => {
      const y = 435 + j * 140;
      drawSandboxUpgradeText(ctx, api, themeColors, v, x + w / 2, y + 35, 31, colors[n], 'center');
      if (j < 2)
        drawSandboxUpgradeArrow(
          ctx,
          api,
          themeColors,
          x + w / 2,
          y + 60,
          x + w / 2,
          y + 100,
          colors[n],
          Math.min(1, beatProgress * 5),
        );
    });
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'R1 · /work/report.xml',
      x + w / 2,
      945,
      30,
      themeColors.ink,
      'center',
      true,
    );
  });
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    currentBeat === 2
      ? 'The actual integer lab links no file import; this diagram locates the interface a file-I/O embedding would need'
      : 'Same read request; distinct mediation paths, compatibility and trusted components; no security ranking',
  );
}
export function drawExecutionBoundaries(ctx, scene, state, api) {
  return drawSandboxStage(
    ctx,
    scene,
    state,
    api,
    paintExecutionBoundaries,
    paintExecutionBoundariesLegacy,
  );
}
export default {
  id: 'execution-boundaries',
  draw: drawExecutionBoundaries,
  cues: [
    'execution-boundaries-b1-1',
    'execution-boundaries-b2-1',
    'execution-boundaries-b2-2',
    'execution-boundaries-b3-1',
    'execution-boundaries-extension-4',
    'execution-boundaries-microvm-pair',
    'execution-boundaries-wasm-import',
  ],
};
