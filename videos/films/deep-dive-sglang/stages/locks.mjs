import { sampleModel } from '../model.mjs';
import { card, text } from '../defaults.mjs';
export function drawLocks(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleModel('locks', state),
    currentBeat = modelState.b;
  {
    api.focus.target('locks-owner-set', () =>
      text(
        ctx,
        api,
        `Live owners: ${modelState.owners.size ? [...modelState.owners].join(', ') : 'none'}`,
        960,
        300,
        42,
        themeColors.yellow,
        'center',
      ),
    );
    ['R0', 'R1'].forEach((id, i) => {
      api.focus.target('locks-' + id.toLowerCase(), () => {
        card(
          ctx,
          api,
          `${id} · ${modelState.owners.has(id) ? 'reference held' : 'released'}`,
          300 + i * 760,
          360,
          560,
          modelState.owners.has(id) ? themeColors.yellow : themeColors.muted,
          70,
        );
        if (modelState.owners.has(id))
          api.arrow(ctx, 580 + i * 760, 434, 580 + i * 760, 458, themeColors.yellow, 3);
      });
    });
    api.focus.target('locks-s-locations-map-v-kv-v', () =>
      teaching.grid({
        x: 300,
        y: 470,
        width: 1320,
        height: 150,
        rows: 1,
        columns: 4,
        labels: [modelState.locations.map((v) => `KV ${v}`)],
        fontSize: 38,
        fill: themeColors.panel,
        stroke: modelState.evictable ? themeColors.green : themeColors.blue,
        textColor: themeColors.ink,
      }),
    );
    api.focus.target('locks-eviction-state', () =>
      text(
        ctx,
        api,
        modelState.evictable ? 'Eligible for eviction' : 'Shared path protected',
        960,
        800,
        44,
        modelState.evictable ? themeColors.green : themeColors.blue,
        'center',
      ),
    );
    text(
      ctx,
      api,
      'Eligibility and actual reclamation are separate cache events',
      960,
      990,
      30,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'locks',
  draw: drawLocks,
  cues: [
    'locks-beat-1-focus-1',
    'locks-beat-2-focus-1',
    'locks-release-r0',
    'locks-beat-2-focus-2',
    'locks-beat-3-focus-1',
    'locks-release-r1',
  ],
};
