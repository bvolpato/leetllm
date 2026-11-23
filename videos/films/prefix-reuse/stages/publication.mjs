import { sampleModel } from '../model.mjs';
import { connectShapes, drawCard, drawLegacyText } from '../defaults.mjs';
export function drawPublication(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const modelState = sampleModel('publication', state),
    currentBeat = modelState.step;
  {
    const source = api.focus.target('publication-source', () =>
      drawCard(
        ctx,
        api,
        modelState.published ? 'R1 · guide computed' : 'R1 · computing guide',
        140,
        360,
        430,
        themeColors.blue,
      ),
    );
    const entry = api.focus.target('publication-entry', () =>
      drawCard(
        ctx,
        api,
        modelState.published ? 'Entry G · published' : 'Entry G · writing',
        760,
        360,
        470,
        modelState.published ? themeColors.green : themeColors.yellow,
      ),
    );
    const request = api.focus.target('publication-request', () =>
      drawCard(
        ctx,
        api,
        `${modelState.request} · ${modelState.hit ? 'reuse guide G' : currentBeat === 1 ? 'write complete' : 'cold path'}`,
        1390,
        610,
        380,
        modelState.hit ? themeColors.green : themeColors.pink,
      ),
    );
    connectShapes(ctx, api, source, entry, themeColors.blue, modelState.p);
    if (modelState.hit) connectShapes(ctx, api, entry, request, themeColors.green, modelState.p);
    api.focus.target('publication-same-exact-guide-boundary', () =>
      drawLegacyText(
        ctx,
        api,
        'Same exact guide boundary',
        995,
        550,
        29,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('publication-readout', () =>
      drawLegacyText(
        ctx,
        api,
        currentBeat === 0
          ? 'R2 arrives before publication: miss'
          : currentBeat === 1
            ? 'Guide G is now discoverable'
            : 'R3 arrives after publication: hit',
        960,
        840,
        36,
        modelState.hit ? themeColors.green : themeColors.yellow,
        'center',
      ),
    );
    api.focus.target('publication-a-compatible-stored-entry-and-a-reachable-boundary-a', () =>
      drawLegacyText(
        ctx,
        api,
        'A compatible stored entry and a reachable boundary are both required',
        960,
        950,
        29,
        themeColors.muted,
        'center',
      ),
    );
  }
}
export default {
  id: 'publication',
  draw: drawPublication,
  cues: [
    'writing-entry',
    'cold-arrival',
    'published-entry',
    'stored-boundary',
    'warm-arrival',
    'reused-entry',
  ],
};
