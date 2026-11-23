import { sampleRuntimeChapter } from '../construction.mjs';
import { runtimeNote, runtimeRule, runtimeTile, runtimeTitle, runtimeWire } from '../defaults.mjs';
export function drawResourceCycle(ctx, scene, state, api) {
  return api.focus.target('gr-resource-cycle-mechanism', () =>
    paintResourceCycle(ctx, scene, state, api),
  );
}
function paintResourceCycle(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('resource-cycle', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Waiting resident workers can block the work they need');
    const released = resultComplete(1, 0),
      p = cueProgress(1, 0),
      count = released ? 3 : 4;
    for (let i = 0; i < 4; i++) {
      const x = 185 + i * 410;
      runtimeTile(
        ctx,
        api,
        i < count ? 'resident worker' : 'slot available',
        x,
        395,
        355,
        i < count ? themeColors.blue : themeColors.green,
        120,
        31,
      );
    }
    runtimeTile(
      ctx,
      api,
      released ? 'Required kernel can become resident' : 'Required kernel waits for residency',
      585,
      700,
      760,
      released ? themeColors.green : themeColors.pink,
      105,
      31,
    );
    runtimeWire(ctx, api, 960, 515, 960, 700, p, released ? themeColors.green : themeColors.pink);
    runtimeRule(
      ctx,
      api,
      released
        ? 'Reserve a runnable path for required external work'
        : 'Workers wait → required kernel cannot run → workers keep waiting',
      935,
      themeColors.yellow,
      29,
    );
    runtimeNote(
      ctx,
      api,
      currentBeat === 2
        ? 'Include queue, polling, shutdown and platform runtime limits; watchdogs still apply'
        : 'Actual occupancy and cooperative-launch requirements depend on device and kernel',
    );
    return;
  }
}
export default {
  id: 'resource-cycle',
  draw: drawResourceCycle,
  cues: [
    'gr-resource-cycle-b0-operation',
    'gr-resource-cycle-b0-s0',
    'gr-resource-cycle-b0-s1',
    'gr-resource-cycle-b0-s2',
    'gr-resource-cycle-b0-s3',
    'gr-resource-cycle-b1-operation',
    'gr-resource-cycle-b1-s0',
    'gr-resource-cycle-b1-s1',
    'gr-resource-cycle-b1-s2',
    'gr-resource-cycle-b2-operation',
    'gr-resource-cycle-b2-s0',
    'gr-resource-cycle-b2-s1',
    'gr-resource-cycle-b2-s2',
    'gr-resource-cycle-b2-s3',
  ],
};
