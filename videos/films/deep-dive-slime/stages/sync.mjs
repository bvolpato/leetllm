import { sampleModel } from '../model.mjs';
import { drawOriginalSlimeCard, drawOriginalSlimeText } from '../defaults.mjs';
export function drawSync(ctx, scene, state, api) {
  return paintSync(ctx, scene, state, api);
}
function paintSync(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('sync', state),
    currentBeat = modelState.b;
  {
    const heading = modelState.ready
      ? 'Policy 12 verified · admissions resumed'
      : modelState.reloadSucceeded
        ? `Policy ${modelState.loaded} loaded · ${modelState.verified ? 'verified; awaiting resume' : 'awaiting version verification'}`
        : modelState.paused
          ? 'Admissions paused · prepared policy 12 reload in progress'
          : 'Policy 12 travels · policy 11 remains live';
    drawOriginalSlimeText(ctx, api, heading, 960, 285, 35, themeColors.yellow, 'center');
    const actor = api.focus.target('sync-megatron-actor-12', () =>
        drawOriginalSlimeCard(
          ctx,
          api,
          'Megatron · actor 12',
          150,
          365,
          470,
          themeColors.blue,
          110,
        ),
      ),
      artifact = api.focus.target(
        'sync-s-published-published-artifact-12-artifact-12-publishing',
        () =>
          drawOriginalSlimeCard(
            ctx,
            api,
            modelState.published ? 'Published artifact 12' : 'Artifact 12 · publishing',
            725,
            365,
            470,
            modelState.published ? themeColors.cyan : themeColors.muted,
            110,
          ),
      ),
      local = drawOriginalSlimeCard(
        ctx,
        api,
        modelState.pulled ? 'Local artifact 12' : 'Local pull pending',
        1300,
        365,
        470,
        modelState.pulled ? themeColors.cyan : themeColors.muted,
        110,
      );
    const send = (a, z, progress, color) =>
      teaching.transfer({
        source: {
          shape: a,
          opacity: 1,
        },
        target: {
          shape: z,
          opacity: 1,
        },
        progress: Math.max(0, Math.min(1, progress)),
        color,
        particle: {
          radius: 8,
          fill: color,
        },
      });
    send(actor, artifact, modelState.time / 2, themeColors.blue);
    if (modelState.published) send(artifact, local, modelState.time - 2, themeColors.cyan);
    const engine = api.focus.target('sync-loaded-engine', () =>
      drawOriginalSlimeCard(
        ctx,
        api,
        'SGLang · loaded ' + modelState.loaded,
        725,
        640,
        470,
        modelState.reloadSucceeded ? themeColors.green : themeColors.blue,
        110,
      ),
    );
    api.focus.target('sync-s-cacheflushed-old-kv-state-flushed-policy-11-kv-state', () =>
      drawOriginalSlimeCard(
        ctx,
        api,
        modelState.cacheFlushed ? 'Old KV state · flushed' : 'Policy 11 KV state',
        150,
        640,
        470,
        modelState.cacheFlushed ? themeColors.muted : themeColors.pink,
        110,
      ),
    );
    api.focus.target(
      'sync-s-ready-admissions-resumed-s-paused-admissions-paused-policy-11-admi',
      () =>
        drawOriginalSlimeCard(
          ctx,
          api,
          modelState.ready
            ? 'Admissions resumed'
            : modelState.paused
              ? 'Admissions paused'
              : 'Policy 11 admissions live',
          1300,
          640,
          470,
          modelState.ready
            ? themeColors.green
            : modelState.paused
              ? themeColors.yellow
              : themeColors.blue,
          110,
        ),
    );
    if (modelState.pulled)
      send(
        local,
        engine,
        (modelState.time - 3.6) / 2.4,
        modelState.reloadSucceeded ? themeColors.green : themeColors.cyan,
      );
    drawOriginalSlimeText(
      ctx,
      api,
      'Trace clock ' +
        modelState.time.toFixed(1) +
        ' · expected loaded policy ' +
        modelState.expectedVersion,
      150,
      565,
      29,
      themeColors.yellow,
    );
    api.focus.target('sync-reload-receipt', () =>
      drawOriginalSlimeText(
        ctx,
        api,
        modelState.reloadReported
          ? `Reload receipt: ${modelState.reloadSucceeded ? 'success' : 'failed'} · loaded ${modelState.loaded}`
          : 'Reload receipt pending · loaded identity stays at 11',
        960,
        860,
        32,
        modelState.reloadSucceeded ? themeColors.green : themeColors.muted,
        'center',
      ),
    );
    api.focus.target('sync-version-check', () =>
      drawOriginalSlimeText(
        ctx,
        api,
        modelState.versionReported
          ? `Observed ${modelState.observedVersion} ${modelState.verified ? 'matches' : 'fails'} expected ${modelState.expectedVersion} · ${modelState.ready ? 'resume allowed' : 'keep paused'}`
          : 'Separate version check pending · resume gate closed',
        960,
        970,
        32,
        modelState.ready ? themeColors.green : themeColors.yellow,
        'center',
      ),
    );
  }
}
export default {
  id: 'sync',
  draw: drawSync,
  cues: [
    'sync-beat-1-focus-1',
    'sync-beat-1-focus-2',
    'sync-beat-2-focus-1',
    'sync-beat-2-focus-2',
    'sync-beat-3-focus-1',
    'sync-beat-3-focus-2',
  ],
};
