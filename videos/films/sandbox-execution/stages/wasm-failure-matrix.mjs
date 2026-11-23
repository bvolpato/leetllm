import {
  drawSandboxStage,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradeLine,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
  paintUnknownSandboxLegacy,
} from '../defaults.mjs';
export function paintWasmFailureMatrix(
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
  if (currentBeat === 0) {
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'One allocated page: addresses 0…65,535',
      960,
      285,
      38,
      themeColors.blue,
      'center',
    );
    api.focus.target('wasm-failure-matrix-access', () => {
      drawSandboxUpgradePanel(ctx, api, themeColors, c, 150, 430, 1200, 210, themeColors.blue);
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        '65,536 guest bytes',
        750,
        550,
        43,
        themeColors.blue,
        'center',
      );
      drawSandboxUpgradeLine(ctx, api, themeColors, 1350, 375, 1350, 710, themeColors.pink, 5);
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'Outside',
        1590,
        485,
        35,
        themeColors.pink,
        'center',
      );
      for (let i = 0; i < 4; i++)
        drawSandboxUpgradePanel(
          ctx,
          api,
          themeColors,
          c,
          1430 + i * 85,
          550,
          65,
          90,
          themeColors.pink,
          themeColors.pink,
        );
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'i32.load at 65,536',
        1595,
        750,
        31,
        themeColors.pink,
        'center',
        true,
      );
    });
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      done('grow-denied') ? 'memory.grow: −1' : 'Growth request: another page',
      750,
      800,
      36,
      themeColors.yellow,
      'center',
      true,
    );
    if (done('load-trap'))
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        'MEMORY_OUT_OF_BOUNDS',
        960,
        930,
        36,
        themeColors.pink,
        'center',
        true,
      );
  } else if (currentBeat === 1) {
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      'Guest: declared host import',
      140,
      350,
      780,
      100,
      themeColors.pink,
      33,
    );
    drawSandboxUpgradeCard(
      ctx,
      api,
      themeColors,
      c,
      'Import-free host: REJECT',
      1080,
      350,
      700,
      100,
      themeColors.green,
      33,
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Linked file reader: /data/link → /private/token',
      960,
      630,
      36,
      themeColors.yellow,
      'center',
      true,
    );
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Authorize actual resolved resource',
      960,
      840,
      40,
      themeColors.green,
      'center',
    );
  } else {
    const rows = [
      ['Deterministic path + fixed settings', 'Repeatable fuel interruption'],
      ['Imports / memory growth / NaNs / SIMD', 'Additional reproducibility controls'],
      ['Forward integer output', 'Separate failure-boundary probes'],
    ];
    rows.forEach(([a, z], i) => {
      const y = 350 + i * 190;
      drawSandboxUpgradeCard(ctx, api, themeColors, c, a, 130, y, 820, 110, themeColors.blue, 29);
      drawSandboxUpgradeArrow(ctx, api, themeColors, 980, y + 55, 1050, y + 55, themeColors.cyan);
      drawSandboxUpgradeCard(
        ctx,
        api,
        themeColors,
        c,
        z,
        1080,
        y,
        710,
        110,
        themeColors.yellow,
        29,
      );
    });
  }
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Authored failure probes distinguish growth return values, out-of-bounds traps and rejected interfaces',
  );
}
export function drawWasmFailureMatrix(ctx, scene, state, api) {
  return drawSandboxStage(
    ctx,
    scene,
    state,
    api,
    paintWasmFailureMatrix,
    paintUnknownSandboxLegacy,
  );
}
export default {
  id: 'wasm-failure-matrix',
  draw: drawWasmFailureMatrix,
  cues: [
    'wasm-failure-matrix-b1',
    'wasm-failure-matrix-grow-denied',
    'wasm-failure-matrix-load-trap',
    'wasm-failure-matrix-b2',
    'wasm-failure-matrix-host-resolution',
    'wasm-failure-matrix-b3',
  ],
};
