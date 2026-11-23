import { laneSectorCoverage } from '../arithmetic.mjs';
import { chapterText, footer, rectangle, title } from '../defaults.mjs';
export function drawEdgeSectors(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'edge-sectors'}-${k}`,
    cue = (k) => api.focus.cue(key(k)),
    cueProgress = (k) => api.focus.progress(key(k), 0),
    resultComplete = (k) => cue(k)?.phase === 'after';
  const F = (keys, paint) => {
    const a = Array.isArray(keys) ? keys : [keys];
    const nest = (i) => (i === a.length ? paint() : api.focus.target(key(a[i]), () => nest(i + 1)));
    return nest(0);
  };
  {
    const mode =
      currentBeat === 0
        ? laneSectorCoverage(33)
        : currentBeat === 1
          ? resultComplete('one') || cueProgress('one') > 0
            ? laneSectorCoverage(0, 1)
            : laneSectorCoverage(33)
          : null;
    title(
      ctx,
      api,
      currentBeat < 2
        ? 'Map admitted word addresses onto 32-byte sectors'
        : 'Hold 128 useful bytes while scattering store addresses',
    );
    if (currentBeat < 2) {
      const list = Array.from(
          {
            length: 5,
          },
          (_, i) => (mode.words.length === 1 ? i : i + 4),
        ),
        visible =
          currentBeat === 0
            ? Math.floor(mode.words.length * cueProgress('lanes'))
            : mode.words.length;
      chapterText(
        ctx,
        api,
        mode.words.length === 1
          ? 'Edge request: 1 admitted lane'
          : 'Odd row: words 33…64 · full 32-lane warp',
        960,
        355,
        31,
        themeColors.blue,
      );
      list.forEach((sector, i) => {
        const x = 190 + i * (1540 / 5),
          w = 1450 / 5;
        rectangle(ctx, api, x, 420, w, 350, themeColors.panel, themeColors.cyan);
        chapterText(ctx, api, 'sector ' + sector, x + w / 2, 815, 29, themeColors.cyan);
        for (let j = 0; j < 8; j++) {
          const word = sector * 8 + j,
            at = mode.words.indexOf(word),
            selected = at >= 0 && at < visible;
          rectangle(
            ctx,
            api,
            x + 15,
            445 + j * 38,
            w - 30,
            28,
            selected ? themeColors.blue : themeColors.panel,
            selected ? themeColors.blue : themeColors.line,
            3,
          );
          if (list.length < 6)
            chapterText(
              ctx,
              api,
              word,
              x + w / 2,
              468 + j * 38,
              24,
              selected ? themeColors.ink : themeColors.muted,
            );
        }
      });
      F(['lanes', 'first', 'last', 'five', 'one'], () =>
        chapterText(
          ctx,
          api,
          mode.words.length + ' admitted words × 4 B',
          960,
          885,
          31,
          themeColors.blue,
        ),
      );
      F(['ratio', 'edge'], () =>
        chapterText(
          ctx,
          api,
          currentBeat === 0 && !resultComplete('last')
            ? 'Count the distinct sector IDs'
            : mode.words.length === 1
              ? resultComplete('edge')
                ? '4 / 32 = 12.5%'
                : '4 useful bytes / 1 touched sector'
              : resultComplete('ratio')
                ? '128 / 160 = 80%'
                : '128 useful bytes / 5 touched sectors',
          960,
          945,
          35,
          themeColors.yellow,
        ),
      );
      footer(ctx, api, 'Address coverage only · masked lanes make no request');
    } else {
      for (let i = 0; i < 32; i++) {
        const x = 200 + (i % 8) * 200,
          y = 390 + Math.floor(i / 8) * 115;
        rectangle(ctx, api, x, y, 150, 73, themeColors.panel, themeColors.pink);
        F(['stride', 'scatter'], () =>
          chapterText(ctx, api, i * 512, x + 75, y + 48, 29, themeColors.pink),
        );
      }
      chapterText(
        ctx,
        api,
        'Sector IDs · address difference 16 KiB per lane',
        960,
        345,
        29,
        themeColors.muted,
      );
      F('fraction', () =>
        chapterText(
          ctx,
          api,
          resultComplete('fraction') ? '128 / (32 × 32) = 12.5%' : '32 lanes × 4 B payload',
          960,
          910,
          38,
          themeColors.yellow,
        ),
      );
      F('scope', () =>
        footer(
          ctx,
          api,
          'Sector IDs follow exact addresses · physical device-memory bytes require counters',
        ),
      );
    }
  }
}
export default {
  id: 'edge-sectors',
  draw: drawEdgeSectors,
  cues: [
    'gpu-edge-sectors-lanes',
    'gpu-edge-sectors-first',
    'gpu-edge-sectors-last',
    'gpu-edge-sectors-five',
    'gpu-edge-sectors-ratio',
    'gpu-edge-sectors-one',
    'gpu-edge-sectors-edge',
    'gpu-edge-sectors-stride',
    'gpu-edge-sectors-scatter',
    'gpu-edge-sectors-fraction',
    'gpu-edge-sectors-scope',
  ],
};
