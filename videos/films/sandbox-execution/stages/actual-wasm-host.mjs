import { addI32 } from '../arithmetic.mjs';
import {
  drawSandboxStage,
  drawSandboxUpgradeArrow,
  drawSandboxUpgradeCard,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
  paintUnknownSandboxLegacy,
} from '../defaults.mjs';
export function paintActualWasmHost(
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
      'Import-free contract: run(i32) → i32',
      960,
      290,
      40,
      themeColors.ink,
      'center',
      true,
    );
    const fields = [
      ['Fuel', '1000 units'],
      ['Guest memory', '65,536 bytes'],
      ['WAT input', '4096 UTF-8 bytes'],
    ];
    fields.forEach(([v, n], i) => {
      const x = 140 + i * 590;
      drawSandboxUpgradePanel(
        ctx,
        api,
        themeColors,
        c,
        x,
        420,
        510,
        330,
        [themeColors.green, themeColors.blue, themeColors.yellow][i],
      );
      drawSandboxUpgradeText(ctx, api, themeColors, v, x + 255, 500, 34, themeColors.ink, 'center');
      drawSandboxUpgradeText(
        ctx,
        api,
        themeColors,
        n,
        x + 255,
        655,
        34,
        [themeColors.green, themeColors.blue, themeColors.yellow][i],
        'center',
      );
    });
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'Strict integer input; True is rejected',
      960,
      900,
      36,
      themeColors.pink,
      'center',
    );
  } else if (currentBeat === 1) {
    const wrap = done('signed-wrap'),
      ready = done('wasm-result');
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      wrap
        ? 'Signed i32 overflow follows the contract'
        : ready
          ? 'run(41) = ' + addI32(41) + ' · run(−1) = ' + addI32(-1)
          : 'run(41) → ? · run(−1) → ?',
      960,
      315,
      40,
      ready ? themeColors.green : themeColors.muted,
      'center',
    );
    const bits = wrap ? '10000000000000000000000000000000' : '01111111111111111111111111111111';
    api.focus.target('actual-wasm-host-bits', () => {
      for (let i = 0; i < 32; i++) {
        const x = 140 + i * 51;
        drawSandboxUpgradePanel(
          ctx,
          api,
          themeColors,
          c,
          x,
          460,
          44,
          120,
          i === 0 ? themeColors.pink : themeColors.blue,
        );
        drawSandboxUpgradeText(
          ctx,
          api,
          themeColors,
          bits[i],
          x + 22,
          535,
          30,
          i === 0 ? themeColors.pink : themeColors.blue,
          'center',
          true,
        );
      }
    });
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      wrap ? '2,147,483,647 +1 → −2,147,483,648' : 'Largest positive signed i32: 2,147,483,647',
      960,
      775,
      36,
      wrap ? themeColors.pink : themeColors.blue,
      'center',
    );
  } else {
    const labels = ['Parse / compile', 'Set fuel', 'Instantiate / start', 'Call run'];
    labels.forEach((v, i) => {
      const x = 130 + i * 445;
      drawSandboxUpgradeCard(
        ctx,
        api,
        themeColors,
        c,
        v,
        x,
        470,
        385,
        110,
        i === 1 ? themeColors.green : themeColors.blue,
        29,
      );
      if (i < 3)
        drawSandboxUpgradeArrow(
          ctx,
          api,
          themeColors,
          x + 400,
          525,
          x + 425,
          525,
          themeColors.cyan,
        );
    });
    drawSandboxUpgradeText(
      ctx,
      api,
      themeColors,
      'A start function can execute before run is called',
      960,
      790,
      37,
      themeColors.yellow,
      'center',
    );
  }
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Actual pinned Wasmtime 49.0.0 article fixture; guest linear memory differs from total host memory',
  );
}
export function drawActualWasmHost(ctx, scene, state, api) {
  return drawSandboxStage(ctx, scene, state, api, paintActualWasmHost, paintUnknownSandboxLegacy);
}
export default {
  id: 'actual-wasm-host',
  draw: drawActualWasmHost,
  cues: [
    'actual-wasm-host-b1',
    'actual-wasm-host-b2',
    'actual-wasm-host-wasm-result',
    'actual-wasm-host-signed-wrap',
    'actual-wasm-host-b3',
    'actual-wasm-host-before-start',
  ],
};
