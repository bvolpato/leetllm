import { sampleRuntimeChapter } from '../construction.mjs';
import {
  runtimeNote,
  runtimeRule,
  runtimeText,
  runtimeTile,
  runtimeTitle,
  runtimeWire,
} from '../defaults.mjs';
export function drawAllocatorLifetime(ctx, scene, state, api) {
  return api.focus.target('gr-allocator-lifetime-mechanism', () =>
    paintAllocatorLifetime(ctx, scene, state, api),
  );
}
function paintAllocatorLifetime(ctx, scene, state, api) {
  const modelState = sampleRuntimeChapter('allocator-lifetime', state),
    { id, b: currentBeat, g: cueProgress, done: resultComplete } = modelState;
  const { C: themeColors } = api;
  {
    runtimeTitle(ctx, api, 'Producer ordering and allocator lifetime are separate edges');
    if (currentBeat < 2) {
      const missingWait = currentBeat === 1 && cueProgress(1, 1) < 0.08,
        missingLifetime = currentBeat === 1 && cueProgress(1, 1) >= 0.08 && cueProgress(1, 2) < 0.1,
        waitProgress = missingWait ? 0 : currentBeat === 0 ? cueProgress(0, 1) : 1,
        lifetime = missingLifetime ? 0 : currentBeat === 0 ? cueProgress(0, 2) : 1;
      runtimeTile(ctx, api, 'Original stream · produces A', 180, 365, 660, themeColors.blue);
      runtimeTile(ctx, api, 'Side stream · sum reads A', 1080, 365, 660, themeColors.cyan);
      if (!missingWait) runtimeWire(ctx, api, 840, 405, 1080, 405, waitProgress, themeColors.blue);
      else {
        api.line(ctx, 940, 385, 980, 425, themeColors.pink, 4);
        api.line(ctx, 940, 425, 980, 385, themeColors.pink, 4);
      }
      runtimeText(
        ctx,
        api,
        missingWait
          ? 'Producer wait missing'
          : waitProgress >= 1
            ? 'Producer wait installed'
            : 'Establish producer ordering',
        960,
        535,
        30,
        missingWait ? themeColors.pink : themeColors.blue,
        'center',
      );
      runtimeTile(
        ctx,
        api,
        missingLifetime ? 'A released · lifetime protection missing' : 'Allocation A',
        580,
        620,
        760,
        missingLifetime ? themeColors.pink : themeColors.yellow,
        100,
        32,
      );
      if (lifetime) runtimeWire(ctx, api, 960, 720, 960, 835, lifetime, themeColors.yellow);
      runtimeTile(
        ctx,
        api,
        missingLifetime
          ? 'Allocator may reuse A before the reader finishes'
          : lifetime >= 1
            ? 'Allocator retains A for side-stream use'
            : 'Retain A while the reader uses it',
        460,
        850,
        1000,
        missingLifetime ? themeColors.pink : lifetime >= 1 ? themeColors.green : themeColors.muted,
        85,
        30,
      );
      runtimeRule(
        ctx,
        api,
        missingWait
          ? 'Lifetime alone does not order the producer'
          : missingLifetime
            ? 'Ordering alone does not protect released storage'
            : 'Protect both the dependency and the allocation lifetime',
        975,
        themeColors.yellow,
        29,
      );
    } else {
      runtimeTile(
        ctx,
        api,
        'Earlier stream use · storage P',
        180,
        410,
        650,
        themeColors.pink,
        100,
        31,
      );
      runtimeTile(
        ctx,
        api,
        'New empty tensor A · same storage P',
        1040,
        410,
        700,
        themeColors.blue,
        100,
        31,
      );
      runtimeWire(ctx, api, 830, 460, 1040, 460, cueProgress(2, 0), themeColors.yellow);
      runtimeTile(
        ctx,
        api,
        'Side-stream write waits for P’s earlier use',
        540,
        700,
        850,
        themeColors.cyan,
        105,
        31,
      );
      runtimeWire(ctx, api, 1390, 510, 960, 700, cueProgress(2, 0), themeColors.cyan);
      runtimeRule(
        ctx,
        api,
        'An empty tensor can inherit a live allocation history',
        940,
        themeColors.yellow,
        32,
      );
    }
    runtimeNote(
      ctx,
      api,
      'PyTorch documented contract · retaining A through later synchronization is another lifetime strategy',
    );
    return;
  }
}
export default {
  id: 'allocator-lifetime',
  draw: drawAllocatorLifetime,
  cues: [
    'gr-allocator-lifetime-b0-operation',
    'gr-allocator-lifetime-b0-s0',
    'gr-allocator-lifetime-b0-s1',
    'gr-allocator-lifetime-b0-s2',
    'gr-allocator-lifetime-b0-s3',
    'gr-allocator-lifetime-b1-operation',
    'gr-allocator-lifetime-b1-s0',
    'gr-allocator-lifetime-b1-s1',
    'gr-allocator-lifetime-b1-s2',
    'gr-allocator-lifetime-b2-operation',
    'gr-allocator-lifetime-b2-s0',
    'gr-allocator-lifetime-b2-s1',
  ],
};
