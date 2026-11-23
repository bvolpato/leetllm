import { sampleMlflowVisual } from '../construction.mjs';
import { legacyCard, legacyText } from '../defaults.mjs';
export function drawStores(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    modelState = sampleMlflowVisual('stores', state),
    currentBeat = modelState.b;
  const route = (a, z, color = themeColors.cyan) =>
    teaching.transfer({
      source: {
        shape: a,
        opacity: 1,
      },
      target: {
        shape: z,
        opacity: 1,
      },
      progress: modelState.q,
      color,
      particle: {
        radius: 6,
        fill: color,
      },
      margin: 3,
    });
  {
    const sdk = api.focus.target('stores-sdk-run-r8', () =>
        legacyCard(ctx, api, 'SDK · run R8', 150, 390, 420, themeColors.blue),
      ),
      server = api.focus.target('stores-tracking-server', () =>
        legacyCard(ctx, api, 'Tracking server', 780, 390, 430, themeColors.yellow),
      ),
      db = legacyCard(ctx, api, 'SQL metadata · 4 KB', 1360, 390, 420, themeColors.cyan),
      store = api.focus.target('stores-artifact-store-2-gb', () =>
        legacyCard(ctx, api, 'Artifact store · 2 GB', 1130, 740, 620, themeColors.green, 110),
      );
    route(sdk, server, themeColors.blue);
    route(server, db);
    if (currentBeat > 0) {
      teaching.transfer({
        source: {
          shape: modelState.direct ? sdk : server,
          opacity: 1,
        },
        target: {
          shape: store,
          opacity: 1,
        },
        progress: 1,
        color: themeColors.green,
        particle: {
          radius: 6,
          fill: themeColors.green,
        },
      });
      api.focus.target('stores-storage-authority', () =>
        legacyCard(
          ctx,
          api,
          'Storage access owner: ' + (modelState.direct ? 'SDK client' : 'tracking server'),
          150,
          740,
          760,
          themeColors.yellow,
          110,
        ),
      );
    }
    legacyText(
      ctx,
      api,
      currentBeat === 0
        ? 'Metadata links the searchable run to its files'
        : modelState.direct
          ? 'Direct artifact path · client holds storage access'
          : 'Proxied artifact path · server holds storage access',
      960,
      930,
      33,
      themeColors.green,
      'center',
    );
    legacyText(
      ctx,
      api,
      'Constructed record sizes · metadata and artifact stores have separate roles',
      960,
      1010,
      27,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'stores',
  draw: drawStores,
  cues: [
    'stores-beat-1-focus-1',
    'stores-beat-1-focus-2',
    'mf-sentence-stores-0-0',
    'mf-sentence-stores-0-1',
    'mf-sentence-stores-0-2',
    'mf-sentence-stores-0-3',
    'mf-sentence-stores-0-4',
    'stores-beat-2-focus-1',
    'mf-sentence-stores-1-0',
    'mf-sentence-stores-1-1',
    'mf-sentence-stores-1-2',
    'mf-sentence-stores-1-3',
    'stores-direct-artifact',
    'stores-client-storage-access',
    'mf-sentence-stores-2-0',
    'mf-sentence-stores-2-1',
    'mf-sentence-stores-2-2',
    'mf-sentence-stores-2-3',
  ],
};
