import { canary } from '../fixtures.mjs';
import { dot, line, text } from '../defaults.mjs';
import { monitoringScene } from '../storyboard.mjs';

export default monitoringScene(
  'release-gates',
  ['stable', 'candidate', 'offline', 'count', 'error', 'latency', 'queue', 'health'],
  (ctx, api, cue) => {
    const { C } = api;
    if (!cue.started('count')) {
      text(
        ctx,
        api,
        'Offline comparison   /   1,000 predictions per model   /   10 actual misses',
        150,
        267,
        36,
        C.ink,
        'left',
      );
      const rows = [
        ['v3', 8, 20, 40, 'stable'],
        ['v4', 9, 15, 42, 'candidate'],
      ];
      rows.forEach(([name, caught, fp, ms, key], i) => {
        const y = 425 + i * 223;
        const col = i ? C.cyan : C.blue;
        text(ctx, api, name, 170, y + 10, 52, col, 'left');
        for (let j = 0; j < 10; j++)
          dot(
            ctx,
            api,
            400 + j * 53,
            y,
            j < Math.round(caught * cue.progress(key)) ? col : C.muted,
            15,
          );
        if (!cue.started(key)) return;
        text(ctx, api, `${caught} caught of 10 misses`, 640, y + 70, 30, col);
        text(
          ctx,
          api,
          `${fp} false alerts   ·   ${10 - caught} unflagged`,
          1400,
          y + 11,
          32,
          C.ink,
        );
        if (cue.done(key))
          text(
            ctx,
            api,
            `cost ${2 * fp + 10 * (10 - caught)} / 1,000 · recall ${caught / 10}`,
            1400,
            y + 74,
            34,
            col,
          );
        if (cue.started('offline')) text(ctx, api, `p95   ${ms} ms`, 640, y + 124, 29, C.muted);
      });
      if (cue.started('offline'))
        text(
          ctx,
          api,
          'v4   /   complete labels   ·   zero priority misses   ·   p95 within 50 ms',
          960,
          923,
          31,
          C.ink,
        );
      return;
    }
    text(
      ctx,
      api,
      'Canary   /   500 requests observed   /   500 required',
      145,
      260,
      39,
      C.ink,
      'left',
    );
    const origin = 593,
      limit = 1450;
    text(ctx, api, 'Fraction of each budget used', origin, 344, 30, C.muted, 'left');
    text(ctx, api, 'Budget', limit, 345, 31, C.yellow);
    line(ctx, api, limit, 373, limit, 765, C.yellow, 4);
    const metrics = [
      ['Error rate', canary.errorRate, canary.errorLimit, '0.2%', '0.5%', 'error'],
      ['p95 response', canary.p95Ms, canary.p95LimitMs, '44 ms', '50 ms', 'latency'],
      ['Review queue', canary.peakQueue, canary.queueLimit, '0.72', '0.80', 'queue'],
    ];
    metrics.forEach(([name, value, max, label, cap, key], i) => {
      const y = 449 + 139 * i;
      text(ctx, api, name, 145, y + 12, 36, C.ink, 'left');
      line(ctx, api, origin, y, limit, y, C.muted, 3);
      text(ctx, api, cap, 1590, y + 12, 33, C.yellow);
      if (!cue.started(key)) return;
      const end = origin + (((limit - origin) * value) / max) * cue.progress(key);
      line(ctx, api, origin, y, end, y, C.cyan, 9);
      dot(ctx, api, end, y, C.cyan, 13);
      if (cue.done(key)) text(ctx, api, label, end, y - 27, 32, C.cyan);
    });
    if (cue.done('health')) {
      text(ctx, api, 'Fast operational checks', 809, 899, 36, C.ink);
      text(ctx, api, 'pass', 1170, 899, 39, C.green);
    }
  },
);
