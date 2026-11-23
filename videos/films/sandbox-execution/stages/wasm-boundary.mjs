import { wasmSnapshot } from '../model.mjs';
import {
  drawSandboxCard,
  drawSandboxStage,
  drawSandboxText,
  drawSandboxUpgradeFooter,
  drawSandboxUpgradePanel,
  drawSandboxUpgradeText,
  sandboxCueProgress,
} from '../defaults.mjs';
export function paintWasmBoundaryLegacy(
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
  const wasm = wasmSnapshot(currentBeat, beatProgress);
  drawSandboxText(
    ctx,
    api,
    themeColors,
    'Toy guest trace · one fuel unit per listed step',
    960,
    240,
    34,
    themeColors.ink,
    'center',
  );
  const highlights = Array.from(
    {
      length: 100,
    },
    (_, index) => ({
      row: Math.floor(index / 10),
      column: index % 10,
      fill: index < wasm.consumedFuel ? themeColors.green : themeColors.panel,
    }),
  );
  api.focus.target('guest-work', () =>
    t.grid({
      x: 210,
      y: 305,
      width: 1500,
      height: 300,
      rows: 10,
      columns: 10,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      lineWidth: 2,
      highlights,
    }),
  );
  const work = drawSandboxCard(
    ctx,
    api,
    themeColors,
    c,
    `Declared work\n${wasm.workloadSteps} steps`,
    75,
    660,
    410,
    themeColors.blue,
    130,
    27,
  );
  const fuel = api.focus.target('fuel-counter', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      `Fuel consumed\n${wasm.consumedFuel} / ${wasm.fuelLimit}`,
      535,
      660,
      410,
      themeColors.green,
      130,
      27,
    ),
  );
  const trap = api.focus.target('guest-trap', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      wasm.trapped
        ? `Guest trap\nbefore step ${wasm.trapBeforeStep}`
        : 'Meter active\nnext step consumes fuel',
      995,
      660,
      410,
      wasm.trapped ? themeColors.pink : themeColors.yellow,
      130,
      26,
    ),
  );
  const imports = api.focus.target('host-import', () =>
    drawSandboxCard(
      ctx,
      api,
      themeColors,
      c,
      `Linked host import\n${wasm.allowedImports.map((value) => value.replace('_', ' ')).join(', ')}`,
      1455,
      660,
      410,
      themeColors.cyan,
      130,
      25,
    ),
  );
  drawSandboxText(
    ctx,
    api,
    themeColors,
    `Memory cap ${wasm.memoryLimitPages} page · grow(${wasm.requestedPages}) returns ${wasm.memoryGrowth} · ${wasm.trapped ? wasm.remainingSteps + ' steps remain after trap' : wasm.workloadSteps - wasm.consumedFuel + ' planned steps remain'}`,
    960,
    850,
    29,
    themeColors.yellow,
    'center',
  );
}
export function paintWasmBoundary(
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
  const routeProgress =
      currentBeat === 0
        ? 0
        : currentBeat > 1
          ? 1
          : sandboxCueProgress(ctx, api, id, 'consume-fuel'),
    count = currentBeat > 1 || on('fuel-trap') ? 100 : Math.floor(routeProgress * 100),
    trapped = currentBeat > 1 || done('fuel-trap');
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Toy guest: one fuel unit per listed step',
    710,
    260,
    35,
    themeColors.ink,
    'center',
  );
  api.teaching.grid({
    x: 150,
    y: 340,
    width: 1050,
    height: 350,
    rows: 10,
    columns: 10,
    fill: themeColors.panel,
    stroke: themeColors.muted,
    lineWidth: 2,
    highlights: Array.from(
      {
        length: 100,
      },
      (_, i) => ({
        row: Math.floor(i / 10),
        column: i % 10,
        fill: i < count ? themeColors.green : themeColors.panel,
      }),
    ),
  });
  drawSandboxUpgradePanel(ctx, api, themeColors, c, 1350, 340, 420, 350, themeColors.yellow);
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Host work',
    1560,
    410,
    36,
    themeColors.yellow,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Compilation',
    1560,
    515,
    30,
    themeColors.yellow,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Linked imports',
    1560,
    610,
    30,
    themeColors.yellow,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Outside guest fuel',
    1560,
    770,
    31,
    themeColors.pink,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    'Consumed ' + count + ' / 100',
    680,
    805,
    39,
    themeColors.green,
    'center',
  );
  drawSandboxUpgradeText(
    ctx,
    api,
    themeColors,
    trapped
      ? 'Trap before step 101; 32 steps remain'
      : count === 100
        ? 'Fuel result pending'
        : 'Declared 132 steps; guest meter active',
    680,
    900,
    35,
    trapped ? themeColors.pink : themeColors.yellow,
    'center',
  );
  drawSandboxUpgradeFooter(
    ctx,
    api,
    themeColors,
    'Fuel units are not milliseconds; actual instruction accounting differs from this listed-step toy',
  );
}
export function drawWasmBoundary(ctx, scene, state, api) {
  return drawSandboxStage(ctx, scene, state, api, paintWasmBoundary, paintWasmBoundaryLegacy);
}
export default {
  id: 'wasm-boundary',
  draw: drawWasmBoundary,
  cues: [
    'wasm-boundary-b1-1',
    'wasm-boundary-b2-1',
    'wasm-boundary-b2-2',
    'wasm-boundary-consume-fuel',
    'wasm-boundary-fuel-trap',
    'wasm-boundary-b3-1',
  ],
};
