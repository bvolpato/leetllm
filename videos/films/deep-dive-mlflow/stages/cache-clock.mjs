import { sampleMlflowChapter } from '../construction.mjs';
import { chapterText, chip, footer, table } from '../defaults.mjs';
export function drawCacheClock(ctx, scene, state, api) {
  const modelState = sampleMlflowChapter('cache-clock', state),
    currentBeat = modelState.b;
  {
    const { C } = api,
      id = 'cache-clock';
    {
      chapterText(
        ctx,
        api,
        `Supplied clock ${modelState.tick} · current lookup TTL ${modelState.count === 5 ? 0 : 3} · refresh at tick ≥ expiry`,
        960,
        285,
        31,
        C.yellow,
        'center',
      );
      table(
        ctx,
        api,
        180,
        390,
        [430, 410, 410, 410],
        [
          ['Cache key', 'Cached version', 'Expiry', 'Registry target'],
          ...['support', 'summary'].map((name) => {
            const entry = modelState.entries.find((e) => e.name === name);
            return [
              name + '@production',
              entry ? 'v' + entry.value : 'not loaded',
              entry?.expiry ?? '—',
              'v' + modelState.registryAtLoad[name],
            ];
          }),
        ],
        [C.muted, C.blue, C.cyan],
      );
      chip(
        ctx,
        api,
        `${modelState.name} lookup → v${modelState.value}`,
        230,
        720,
        700,
        modelState.refresh ? C.green : C.blue,
        100,
      );
      chip(
        ctx,
        api,
        modelState.refresh ? 'Resolver called' : 'Warm cached object',
        1060,
        720,
        650,
        modelState.refresh ? C.green : C.muted,
        100,
      );
      if (currentBeat > 0)
        chapterText(
          ctx,
          api,
          modelState.zeroTtl
            ? 'Zero-TTL lookup refreshes even at the same tick'
            : 'Same alias text; independent prompt-name entries',
          960,
          890,
          31,
          C.yellow,
          'center',
        );
      if (currentBeat === 2)
        chapterText(
          ctx,
          api,
          'Earlier held object is still support v17',
          960,
          935,
          33,
          C.blue,
          'center',
        );
      footer(
        ctx,
        api,
        'Constructed monotonic-clock cache · installed API expiry requires its own run',
      );
    }
  }
}
export default {
  id: 'cache-clock',
  draw: drawCacheClock,
  cues: [
    'mf-cache-clock-0',
    'mf-sentence-cache-clock-0-0',
    'mf-sentence-cache-clock-0-1',
    'mf-sentence-cache-clock-0-2',
    'mf-sentence-cache-clock-0-3',
    'mf-sentence-cache-clock-0-4',
    'mf-cache-clock-1',
    'mf-sentence-cache-clock-1-0',
    'mf-sentence-cache-clock-1-1',
    'mf-sentence-cache-clock-1-2',
    'mf-sentence-cache-clock-1-3',
    'mf-cache-clock-2',
    'mf-sentence-cache-clock-2-0',
    'mf-sentence-cache-clock-2-1',
    'mf-sentence-cache-clock-2-2',
    'mf-sentence-cache-clock-2-3',
  ],
};
