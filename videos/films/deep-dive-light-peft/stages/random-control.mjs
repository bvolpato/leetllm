import { spokenProgress } from '../model.mjs';
import {
  chapterFooter,
  chapterStripe,
  chapterSubtitle,
  chapterText,
  focusScope,
} from '../defaults.mjs';
export function drawRandomControl(ctx, scene, state, api) {
  const themeColors = {
      ...api.C,
      purple: '#b7a2f7',
    },
    components = api.components,
    beat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const q = (id, fallback = progress) => spokenProgress(state, id, fallback),
    done = (id) => q(id) >= 0.98;
  {
    chapterSubtitle(
      ctx,
      api,
      themeColors,
      beat
        ? 'A control flag must execute the intended branch'
        : 'Matched random control · preserve the surrounding RNG state',
    );
    focusScope(ctx, api, 'lp-random', () => {
      if (!beat) {
        chapterStripe(
          ctx,
          api,
          themeColors,
          ['H0', 'H1', 'H2', 'H3'],
          310,
          410,
          'original identities',
          undefined,
          themeColors.blue,
          280,
          95,
        );
        chapterStripe(
          ctx,
          api,
          themeColors,
          ['H2', 'H0', 'H3', 'H1'],
          310,
          625,
          'separate seeded score order',
          undefined,
          themeColors.cyan,
          280,
          95,
        );
      }
      chapterText(
        ctx,
        api,
        themeColors,
        'save RNG state → local seed / scores → restore RNG state',
        960,
        840,
        31,
        themeColors.yellow,
        'center',
      );
    });
    focusScope(ctx, api, 'lp-random-fail', () => {
      if (beat) {
        components.panel({
          x: 285,
          y: 350,
          width: 1360,
          height: 400,
          fill: themeColors.panel,
          stroke: themeColors.pink,
        });
        chapterText(
          ctx,
          api,
          themeColors,
          'rank branch: ndarray',
          960,
          435,
          37,
          themeColors.pink,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          'later access: record["module.name"]',
          960,
          560,
          34,
          themeColors.pink,
          'center',
        );
        chapterText(
          ctx,
          api,
          themeColors,
          done('lp-random-fail')
            ? 'TypeError · array is not a name-keyed dictionary'
            : 'Does the produced type satisfy its consumer?',
          960,
          685,
          32,
          themeColors.pink,
          'center',
        );
      }
    });
    focusScope(ctx, api, 'lp-unused', () => {
      if (beat)
        chapterFooter(
          ctx,
          api,
          themeColors,
          'Module random-shuffle argument is unused · no repaired end-to-end random-control claim.',
        );
    });
  }
}
export default {
  id: 'random-control',
  draw: drawRandomControl,
  cues: ['lp-random-state', 'lp-random-fail', 'lp-unused-flag'],
};
