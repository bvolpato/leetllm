import { chapterText, footer, line, rectangle, title } from '../defaults.mjs';
export function drawLogicalRate(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'logical-rate'}-${k}`,
    cue = (k) => api.focus.cue(key(k)),
    resultComplete = (k) => cue(k)?.phase === 'after';
  const F = (keys, paint) => {
    const a = Array.isArray(keys) ? keys : [keys];
    const nest = (i) => (i === a.length ? paint() : api.focus.target(key(a[i]), () => nest(i + 1)));
    return nest(0);
  };
  {
    title(ctx, api, 'Carry the same logical work through the unit conversion');
    const plane = (x, name, color) => {
      rectangle(ctx, api, x, 405, 640, 300, themeColors.panel, color);
      for (let i = 1; i < 8; i++) {
        line(ctx, api, x + i * 80, 405, x + i * 80, 705, themeColors.line, 1);
        line(ctx, api, x, 405 + i * 37.5, x + 640, 405 + i * 37.5, themeColors.line, 1);
      }
      chapterText(ctx, api, name, x + 320, 365, 32, color);
      chapterText(ctx, api, '4096 × 4096 × 4 B', x + 320, 760, 34, color);
    };
    F('readwrite', () => {
      plane(210, 'One logical read', themeColors.blue);
      plane(1070, 'One logical write', themeColors.cyan);
    });
    if (currentBeat === 0) {
      const logicalBytes = 2 * 4096 ** 2 * 4;
      const seconds = 0.25 / 1000;
      F(['bytes', 'mebibytes'], () =>
        chapterText(
          ctx,
          api,
          resultComplete('bytes')
            ? `${logicalBytes.toLocaleString('en-US')} B${resultComplete('mebibytes') ? ' · ' + logicalBytes / 2 ** 20 + ' MiB' : ''}`
            : 'Add both equal-volume planes',
          960,
          835,
          37,
          themeColors.yellow,
        ),
      );
      F(['time', 'seconds'], () =>
        chapterText(
          ctx,
          api,
          resultComplete('time')
            ? `Worksheet   0.250 ms${resultComplete('seconds') ? ' = ' + seconds.toFixed(6) + ' s' : ''}`
            : 'Keep bytes and seconds explicit',
          960,
          900,
          30,
          themeColors.muted,
        ),
      );
      F('rate', () =>
        chapterText(
          ctx,
          api,
          resultComplete('rate')
            ? `Effective rate = ${(logicalBytes / seconds / 1e9).toFixed(1)} GB/s`
            : 'Divide logical bytes by elapsed seconds',
          960,
          960,
          36,
          themeColors.green,
        ),
      );
    } else {
      F('worksheet', () =>
        chapterText(
          ctx,
          api,
          'Worksheet input   0.250 ms per launch',
          960,
          835,
          31,
          themeColors.yellow,
        ),
      );
      F('counter', () =>
        chapterText(
          ctx,
          api,
          'Physical device-memory counter: unavailable',
          960,
          910,
          33,
          themeColors.muted,
        ),
      );
      F('copy', () =>
        chapterText(
          ctx,
          api,
          'Copy: equal logical volume · different output',
          960,
          960,
          29,
          themeColors.blue,
        ),
      );
    }
    footer(ctx, api, 'Schematic grid · stated 4096² dimensions determine the exact count');
  }
}
export default {
  id: 'logical-rate',
  draw: drawLogicalRate,
  cues: [
    'gpu-logical-rate-readwrite',
    'gpu-logical-rate-bytes',
    'gpu-logical-rate-mebibytes',
    'gpu-logical-rate-time',
    'gpu-logical-rate-seconds',
    'gpu-logical-rate-rate',
    'gpu-logical-rate-worksheet',
    'gpu-logical-rate-counter',
    'gpu-logical-rate-copy',
  ],
};
