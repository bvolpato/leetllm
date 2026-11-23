import { apiChapterState } from '../construction.mjs';
import { footer, heading, panel, travel } from '../defaults.mjs';
export function drawParserLayers(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat,
    modelState = apiChapterState('parser-layers', state),
    u = modelState.p,
    done = modelState.settled;
  {
    if (currentBeat === 0) {
      heading(ctx, api, 'Observe field pairs before dictionary collapse');
      panel(
        ctx,
        api,
        'raw pairs\nthreshold: 30\nthreshold: 90',
        210,
        385,
        610,
        230,
        themeColors.pink,
        31,
      );
      panel(ctx, api, 'pair hook', 1110, 390, 590, 100, themeColors.blue, 31);
      travel(
        ctx,
        api,
        '30 / 90',
        {
          x: 420,
          y: 700,
        },
        {
          x: 1300,
          y: 700,
        },
        u,
        themeColors.pink,
        240,
      );
      if (done) panel(ctx, api, 'DUPLICATE → REJECT', 1050, 825, 680, 95, themeColors.pink, 31);
      footer(
        ctx,
        api,
        'NaN / Infinity / excessive nesting also reject; bound response size outside parsing',
      );
    } else if (currentBeat === 1) {
      heading(ctx, api, 'Exact fields and actual types precede policy');
      const names = ['decision', 'rotation_window_days', 'source_line_ids'],
        values = ['eligible', 'true', '["P-7"]'];
      names.forEach((n, i) => {
        panel(ctx, api, n, 220, 410 + i * 160, 800, 110, themeColors.blue, 28);
        panel(
          ctx,
          api,
          values[i],
          1130,
          410 + i * 160,
          560,
          110,
          i === 1 ? themeColors.pink : themeColors.cyan,
          30,
        );
      });
      if (done)
        footer(
          ctx,
          api,
          'Boolean true fails the integer contract, even though True == 1 in Python',
          themeColors.pink,
        );
      else
        footer(
          ctx,
          api,
          'Three required fields · no extras · integer threshold · supported evidence list',
        );
    } else {
      heading(ctx, api, 'stale AND age ≥ threshold · test both directions');
      const cases = [
        ['age 30 · stale true', true],
        ['age 29 · stale true', false],
        ['age 45 · stale false', false],
      ];
      cases.forEach(([v, result], i) => {
        panel(ctx, api, v, 250, 400 + i * 165, 900, 115, themeColors.blue, 29);
        if (u > (i + 1) / 4)
          panel(
            ctx,
            api,
            result ? 'eligible' : 'not eligible',
            1260,
            400 + i * 165,
            410,
            115,
            result ? themeColors.green : themeColors.yellow,
            29,
          );
      });
      footer(
        ctx,
        api,
        'Validate trusted input types too; a false negative can still violate policy',
      );
    }
  }
}
export default {
  id: 'parser-layers',
  draw: drawParserLayers,
  cues: ['ap-parser-layers-0', 'ap-parser-layers-1', 'ap-parser-layers-2'],
};
