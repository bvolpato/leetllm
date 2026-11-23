import { rayChapterState, rayProgress } from '../construction.mjs';
import { arrow, chapterCard, chapterText, footer, heading, panel } from '../defaults.mjs';
export function drawGcsRecovery(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = rayChapterState('gcs-recovery', state),
    { b: currentBeat, p: progress } = modelState,
    done = (id, beat = currentBeat) => rayProgress(state, 'ray-' + id, beat) === 1;
  api.focus.target('ray-gcs-recovery-mechanism', () => {
    heading(
      ctx,
      api,
      currentBeat === 0
        ? 'GCS control failure can leave an existing actor alive'
        : currentBeat === 1
          ? 'Recover control records from surviving configured storage'
          : 'A surviving actor retains its own process state',
    );
    const reload = currentBeat > 1 || (currentBeat === 1 && done('gcs-reload', 1)),
      paused = (currentBeat === 0 && done('gcs-pause', 0)) || (currentBeat === 1 && !reload);
    chapterCard(
      ctx,
      api,
      paused
        ? currentBeat === 1
          ? 'GCS recovering'
          : 'GCS unavailable'
        : reload
          ? 'GCS reloaded'
          : 'GCS control records',
      160,
      370,
      680,
      paused ? themeColors.pink : themeColors.yellow,
    );
    chapterCard(ctx, api, 'Actor L · process alive', 1070, 370, 680, themeColors.blue);
    chapterText(ctx, api, 'Ledger count   7', 1410, 600, 51, themeColors.green, 'center');
    panel(ctx, api, 160, 665, 680, 225, themeColors.yellow);
    chapterText(
      ctx,
      api,
      currentBeat >= 1 ? 'Configured backing storage' : 'actor / node / group records',
      500,
      725,
      28,
      themeColors.yellow,
      'center',
    );
    chapterText(
      ctx,
      api,
      currentBeat >= 1 ? 'KubeRay Serve: external Redis' : 'control state has a separate owner',
      500,
      790,
      27,
      themeColors.cyan,
      'center',
    );
    if (currentBeat >= 1)
      chapterText(
        ctx,
        api,
        'Linux alpha: durable RocksDB',
        500,
        850,
        26,
        themeColors.cyan,
        'center',
      );
    if (reload) arrow(ctx, api, 500, 650, 500, 485, themeColors.green);
    chapterCard(ctx, api, 'Existing task continues', 1070, 705, 680, themeColors.green, 80, 29);
    chapterCard(
      ctx,
      api,
      paused ? 'New actor / PG / worker ops paused' : 'New control operations available',
      1070,
      835,
      680,
      paused ? themeColors.pink : themeColors.cyan,
      80,
      27,
    );
    if (currentBeat === 2 && done('actor-survives', 2))
      chapterText(
        ctx,
        api,
        'No constructor rerun from GCS-only recovery',
        960,
        965,
        31,
        themeColors.green,
        'center',
      );
    footer(ctx, api, 'Recovery scenario: GCS process restarts on surviving storage');
  });
}
export default {
  id: 'gcs-recovery',
  draw: drawGcsRecovery,
  cues: [
    'ray-gcs-recovery-op-0',
    'ray-gcs-pause',
    'ray-gcs-recovery-op-1',
    'ray-gcs-reload',
    'ray-gcs-recovery-op-2',
    'ray-actor-survives',
  ],
};
