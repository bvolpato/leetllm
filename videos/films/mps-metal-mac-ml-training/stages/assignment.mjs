import { featureBytes } from '../arithmetic.mjs';
import { dimensions } from '../fixtures.mjs';
import { advancedCode, panel, target, text, withMpsRootFrame } from '../defaults.mjs';

const kib =
  featureBytes({
    batch: dimensions.tickets,
    positions: dimensions.positions,
    features: dimensions.features,
    bytesPerValue: 4,
  }) / 1024;

export function paintAssignment(ctx, scene, state, api, C, c, t, s) {
  panel(ctx, api, C, c, 145, 290, 1630, 550, C.green);
  text(ctx, api, C, 'Apple silicon  /  shared physical memory', 960, 365, 40, C.green, 'center');
  const filled = Math.floor(s.copyProgress * dimensions.tickets);
  const allocation = (x, name, color, rows, caption) => {
    text(ctx, api, C, name, x + 260, 457, 39, color, 'center');
    for (let row = 0; row < dimensions.tickets; row++) {
      for (let i = 0; i < dimensions.positions; i++) {
        const ink = row < rows ? color : C.muted;
        api.rect(ctx, x + i * 65, 500 + row * 39, 58, 30, row < rows ? color : C.panel, ink, 3);
      }
    }
    text(ctx, api, C, caption, x + 260, 727, 30, color, 'center');
  };
  target(ctx, api, 'original-cpu-tensor', () =>
    allocation(290, 'source   /   cpu', C.blue, dimensions.tickets, kib + ' KiB of features'),
  );
  target(ctx, api, 'returned-mps-tensor', () =>
    allocation(
      1110,
      'placed   /   mps',
      C.cyan,
      filled,
      s.copyReady ? kib + ' KiB of features' : 'Device-changing copy',
    ),
  );
  target(ctx, api, 'batch-binding', () => {
    const x = s.assigned ? 1370 : 550;
    api.arrow(ctx, x, 781, x, 747, C.yellow, 5);
    text(ctx, api, C, 'batch', x, 815, 32, C.yellow, 'center');
  });
  target(ctx, api, 'assignment-code', () => {
    advancedCode(
      ctx,
      api,
      C,
      s.step === 0 ? 'placed = batch.to("mps")' : s.assigned ? 'batch = placed' : 'batch.device',
      960,
      920,
      42,
      C.yellow,
    );
  });
  if (s.copyReady)
    text(
      ctx,
      api,
      C,
      'Raw feature storage with both copies alive: ' + 2 * kib + ' KiB',
      960,
      1006,
      30,
      C.ink,
      'center',
    );
}

export function drawAssignmentStage(ctx, scene, state, api) {
  withMpsRootFrame(ctx, scene, state, api, paintAssignment);
}
export default {
  id: 'assignment',
  draw: drawAssignmentStage,
  cues: ['returned-copy', 'original-remains', 'assign-return'],
};
