import { arrow, box, constructionFooter, focusProgress, label } from '../defaults.mjs';
export function drawSchemaVersion(ctx, scene, state, api) {
  const { C, components: c, teaching: t, phase } = api,
    beat = state.beat ?? 0,
    p = state.beatP ?? 0,
    q = phase(p, 0.05, 0.88);
  {
    const { C: themeColors } = api,
      currentBeat = state.beat ?? 0;
    const done = (id) => focusProgress(ctx, api, id) >= 1;
    api.focus.target('sg-schema-version-mechanism', () => {
      const tagged = done('sg-code-version');
      box(
        ctx,
        api,
        'Application-selected contract',
        ['RunStatusUpdate v2', 'run ID / status / failing job'],
        180,
        310,
        710,
        205,
        themeColors.blue,
      );
      box(
        ctx,
        api,
        'Validated payload',
        ['RUN-842 / failed / unit-tests'],
        1030,
        310,
        710,
        205,
        themeColors.green,
      );
      arrow(ctx, api, 905, 410, 1015, 410);
      if (tagged)
        box(
          ctx,
          api,
          'Code-owned envelope',
          ['schema_version: "2"', 'payload: validated record'],
          180,
          645,
          710,
          170,
          themeColors.yellow,
        );
      if (currentBeat >= 1) {
        const incompatible = done('sg-version-consumer');
        box(
          ctx,
          api,
          'Consumer 1',
          incompatible
            ? ['expects version 1', 'incompatible with v2 envelope']
            : ['inspect expected contract'],
          1030,
          645,
          710,
          170,
          incompatible ? themeColors.pink : themeColors.blue,
        );
      }
      if (currentBeat === 2 && done('sg-version-artifact'))
        label(
          ctx,
          api,
          'Changed adapter / schema → recheck compiled identity',
          960,
          915,
          themeColors.pink,
          29,
        );
      constructionFooter(
        ctx,
        api,
        'Application code chooses the validator and supplies the envelope version.',
      );
    });
  }
}
export default {
  id: 'schema-version',
  draw: drawSchemaVersion,
  cues: [
    'sg-schema-version-0',
    'sg-code-version',
    'sg-schema-version-1',
    'sg-version-consumer',
    'sg-schema-version-2',
    'sg-version-artifact',
  ],
};
