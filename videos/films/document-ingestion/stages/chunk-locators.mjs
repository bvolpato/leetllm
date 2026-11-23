import { RECORDS, makeChunks } from '../model.mjs';
import { connectRoute, labelCard, optionalFocusTarget, text } from '../defaults.mjs';
export function drawChunkLocators(ctx, scene, state, api) {
  const { C: themeColors, components: components } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0, 0, 1),
    phaseForBeat = (i) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, 0.08, 0.9);
  {
    const source = components.panel(
      {
        x: 300,
        y: 320,
        width: 1320,
        height: 270,
        fill: themeColors.panel,
        stroke: themeColors.blue,
        padding: 20,
      },
      () => {
        text(
          ctx,
          api,
          'Page 7 · Operations / Rollback · revision 7',
          960,
          380,
          32,
          themeColors.blue,
        );
        optionalFocusTarget(
          ctx,
          api,
          'chunk-locators-object-rollback-failure-page-on-call-within-15-minutes-in-40',
          () =>
            text(
              ctx,
              api,
              'Rollback failure: page on-call within 15 minutes. Include deploy ID.',
              960,
              480,
              32,
              themeColors.ink,
            ),
        );
        text(
          ctx,
          api,
          'Routine notes: archive within 14 days. Completed release.',
          960,
          540,
          30,
          themeColors.muted,
        );
      },
    );
    const chunks = makeChunks(RECORDS[0]),
      a = optionalFocusTarget(
        ctx,
        api,
        'chunk-locators-object-rollback-failure-page-on-call-42',
        () =>
          labelCard(
            ctx,
            api,
            'Rollback failure → page on-call',
            170,
            640,
            720,
            themeColors.green,
            state.cues?.['chunk-locators-beat-1-focus-1']
              ? state.cues['chunk-locators-beat-1-focus-1'].phase === 'before'
                ? 0
                : 1
              : phaseForBeat(0),
            85,
            30,
          ),
      ),
      z = labelCard(
        ctx,
        api,
        'Include deploy ID. Routine notes…',
        1030,
        640,
        720,
        themeColors.cyan,
        phaseForBeat(1),
        85,
        30,
      );
    connectRoute(ctx, api, source, a, phaseForBeat(0), themeColors.green);
    connectRoute(ctx, api, source, z, phaseForBeat(1));
    components.fade(phaseForBeat(0), () =>
      text(ctx, api, '15 minutes · Include deploy ID', 530, 790, 30, themeColors.green),
    );
    components.fade(phaseForBeat(1), () =>
      text(ctx, api, 'Archive within 14 days', 1390, 790, 30, themeColors.cyan),
    );
    chunks.forEach((chunk, i) =>
      components.fade(phaseForBeat(i), () =>
        optionalFocusTarget(ctx, api, `chunk-locator-${i}`, () => {
          text(
            ctx,
            api,
            'p7 · r7 · Operations / Rollback',
            530 + i * 860,
            855,
            27,
            themeColors.yellow,
          );
          text(
            ctx,
            api,
            'source span ' + chunk.start + '–' + chunk.end,
            530 + i * 860,
            900,
            27,
            themeColors.yellow,
          );
        }),
      ),
    );
    components.fade(phaseForBeat(2), () =>
      text(
        ctx,
        api,
        'Markdown also keeps heading paths, line ranges, and command fences.',
        960,
        945,
        29,
        themeColors.ink,
      ),
    );
  }
}
export default {
  id: 'chunk-locators',
  draw: drawChunkLocators,
  cues: [
    'chunk-locators-beat-1-focus-1',
    'chunk-locators-beat-2-focus-1',
    'chunk-locators-beat-2-focus-2',
    'chunk-locators-beat-3-focus-1',
    'chunk-locators-beat-3-focus-2',
  ],
};
