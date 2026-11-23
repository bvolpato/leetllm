import { cueClock } from '../report-picture.mjs';

export function drawSdkReadback(ctx, scene, state, api) {
  const at = cueClock(scene, state);
  const { C } = api;
  if (state.beat === 0) {
    api.focus.target('tr-sdk-readback-trace', () => {
      api.text(ctx, 'MLflow   /   local run', 135, 271, 38, C.cyan);
      api.text(ctx, 'SQLite database', 135, 409, 59, C.ink, 'left', 'serif');
      api.text(ctx, 'Run status', 135, 507, 33, C.muted);
      api.text(ctx, 'FINISHED', 135, 596, 59, C.ink, 'left', 'mono');
      api.text(ctx, 'Artifact directory', 984, 409, 59, C.ink, 'left', 'serif');
      api.text(ctx, 'Frozen suite  /  report  /  manifest', 984, 507, 39, C.ink);
      if (at('tr-sdk-readback-0-2') === 1)
        api.text(ctx, 'Report opened   ·   4 case rows', 984, 596, 44, C.green);
      if (at('tr-sdk-readback-0-3') > 0) {
        api.line(ctx, 135, 695, 1775, 695, C.muted, 2);
        api.text(ctx, 'Registry readback', 135, 794, 43, C.ink);
        api.text(
          ctx,
          'Alias after rollback   /   temperature on the pinned version',
          135,
          884,
          43,
          C.cyan,
        );
      }
    });
    return;
  }

  api.text(ctx, 'Weights & Biases   /   local logging', 135, 275, 38, C.cyan);
  api.focus.target('offline', () => {
    api.text(ctx, 'Offline mode', 135, 411, 64, C.ink, 'left', 'serif');
    if (at('tr-sdk-readback-1-0') > 0) {
      const y = 579 + 35 * at('tr-sdk-readback-1-0');
      api.rect(ctx, 135, y - 84, 583, 124, C.panel, C.green, 8);
      api.text(ctx, '.wandb', 172, y + 5, 62, C.green, 'left', 'mono');
    }
    if (at('tr-sdk-readback-1-1') > 0)
      api.text(ctx, 'Available for later sync', 135, 747, 37, C.ink);
  });
  api.focus.target('disabled', () => {
    api.text(ctx, 'Disabled mode', 985, 411, 64, C.ink, 'left', 'serif');
    if (at('tr-sdk-readback-1-2') === 1)
      api.text(ctx, 'No run file written', 985, 618, 52, C.muted);
  });
  if (at('tr-sdk-readback-1-3') > 0) {
    api.line(ctx, 135, 816, 1775, 816, C.muted, 2);
    api.focus.target('online', () => {
      api.text(ctx, 'Online run', 135, 914, 42, C.cyan);
      api.text(ctx, 'use_artifact', 529, 914, 41, C.ink, 'left', 'mono');
      api.arrow(ctx, 865, 899, 953, 899, C.cyan, 4);
      api.text(ctx, 'Exact input artifact version', 1006, 914, 45, C.ink);
    });
  }
}
export default {
  id: 'sdk-readback',
  draw: drawSdkReadback,
  cues: [
    'tr-sdk-readback-0-0',
    'tr-sdk-readback-0-1',
    'tr-sdk-readback-0-2',
    'tr-sdk-readback-0-3',
    'tr-sdk-readback-0-4',
    'tr-sdk-readback-1-0',
    'tr-sdk-readback-1-1',
    'tr-sdk-readback-1-2',
    'tr-sdk-readback-1-3',
    'tr-sdk-readback-1-4',
  ],
};
