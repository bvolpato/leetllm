import { cacheLineReads } from '../arithmetic.mjs';
import { sampleModel } from '../construction.mjs';
import { drawText } from '../defaults.mjs';
export function drawTraffic(ctx, scene, state, api) {
  const { C: themeColors } = api,
    modelState = sampleModel('traffic', state),
    currentBeat = modelState.step;
  {
    if (currentBeat === 0) {
      const p = api.focus.progress('kg-traffic-cache', 0),
        reads = Number(api.focus.progress('kg-traffic-fill', 0) > 0) + Math.ceil(p * 3),
        r = cacheLineReads(reads);
      drawText(
        ctx,
        api,
        'Four reads of one 64-byte cache line',
        960,
        285,
        35,
        themeColors.yellow,
        'center',
      );
      api.focus.target('traffic-name-bytes-bytes-1e6-tofixed-1-mb', () => {
        api.rect(ctx, 230, 410, 470, 120, themeColors.panel, themeColors.blue, 2, 9);
        drawText(ctx, api, 'Device memory   64 B', 465, 483, 32, themeColors.blue, 'center');
        api.rect(ctx, 1160, 410, 470, 120, themeColors.panel, themeColors.cyan, 2, 9);
        drawText(
          ctx,
          api,
          reads ? 'resident line' : 'empty cache',
          1395,
          483,
          31,
          themeColors.cyan,
          'center',
        );
        if (reads) api.arrow(ctx, 730, 470, 1130, 470, themeColors.blue, 4);
        for (let i = 0; i < reads; i++) {
          const x = 350 + i * 400;
          api.rect(
            ctx,
            x,
            700,
            250,
            75,
            themeColors.panel,
            i === 0 ? themeColors.blue : themeColors.green,
            2,
            6,
          );
          drawText(
            ctx,
            api,
            i === 0 ? 'first fill' : 'cache hit',
            x + 125,
            748,
            28,
            i === 0 ? themeColors.blue : themeColors.green,
            'center',
          );
        }
        drawText(
          ctx,
          api,
          'Requested   ' + r.logicalBytes + ' B     ·     Device memory   ' + r.fillBytes + ' B',
          960,
          875,
          34,
          themeColors.yellow,
          'center',
        );
      });
    } else {
      const ready = api.focus.progress('kg-traffic-rates', 0) === 1;
      const deviceReady = api.focus.progress('kg-traffic-device-rate', 0) === 1;
      drawText(
        ctx,
        api,
        'Example interval   ' + modelState.us + ' µs',
        150,
        285,
        35,
      );
      [
        ['Logical', modelState.logical, modelState.logicalRate, themeColors.blue],
        ['Device memory', modelState.hbm, modelState.hbmRate, themeColors.cyan],
      ].forEach(([name, bytes, rate, color], i) => {
        const y = 465 + i * 240;
        api.focus.target('traffic-name-bytes-bytes-1e6-tofixed-1-mb', () => {
          drawText(
            ctx,
            api,
            name + ' bytes   ' + (bytes / 1e6).toFixed(1) + ' MB',
            170,
            y - 45,
            33,
            color,
          );
          api.rect(ctx, 170, y, (1500 * rate) / 6, 80, color);
          if (i === 0 ? ready : deviceReady)
            drawText(ctx, api, rate.toFixed(2) + ' TB/s', 1710, y - 45, 40, color, 'right');
        });
      });
      drawText(
        ctx,
        api,
        deviceReady
          ? 'Same elapsed time, two different byte counts'
          : 'Divide each byte count by the completed interval',
        960,
        965,
        31,
        themeColors.yellow,
        'center',
      );
    }
  }
}
export default {
  id: 'traffic',
  draw: drawTraffic,
  cues: [
    'traffic-beat-1-focus-1',
    'kg-traffic-cache',
    'kg-traffic-fill',
    'traffic-beat-2-focus-1',
    'kg-traffic-rates',
    'kg-traffic-device-rate',
  ],
};
