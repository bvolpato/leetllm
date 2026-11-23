import { chapterText, dot, footer, line, rectangle, title } from '../defaults.mjs';
export function drawTimingWindow(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  const key = (k) => `gpu-${'timing-window'}-${k}`,
    cue = (k) => api.focus.cue(key(k)),
    cueProgress = (k) => api.focus.progress(key(k), 0),
    resultComplete = (k) => cue(k)?.phase === 'after';
  const F = (keys, paint) => {
    const a = Array.isArray(keys) ? keys : [keys];
    const nest = (i) => (i === a.length ? paint() : api.focus.target(key(a[i]), () => nest(i + 1)));
    return nest(0);
  };
  {
    title(
      ctx,
      api,
      currentBeat === 2
        ? 'Reverse the launch order each round'
        : 'Two CUDA events bracket the hundred launches',
    );
    if (currentBeat < 2) {
      const phases = [
        ['Fresh check', 160, 250, 'check', themeColors.blue],
        ['5 warmups', 480, 260, 'warm', themeColors.yellow],
        ['100 timed launches', 810, 640, 'batch', themeColors.cyan],
        ['Fresh check', 1520, 250, 'post', themeColors.green],
      ];
      for (const [name, x, w, k, color] of phases) {
        rectangle(ctx, api, x, 395, w, 390, themeColors.panel, color);
        F(k, () => chapterText(ctx, api, name, x + w / 2, 450, 30, color));
        const count = k === 'batch' ? 100 : k === 'warm' ? 5 : 1,
          progress = currentBeat > 0 ? 1 : cueProgress(k),
          visible = Math.floor(count * progress);
        for (let i = 0; i < count; i++) {
          const columns = k === 'batch' ? 10 : k === 'warm' ? 1 : 1,
            dx = w / (columns + 1),
            dy = k === 'batch' ? 25 : 45;
          dot(
            ctx,
            api,
            x + dx + (i % columns) * dx,
            510 + Math.floor(i / columns) * dy,
            i < visible ? color : themeColors.line,
            k === 'batch' ? 5 : 10,
          );
        }
        if (k === 'check' || k === 'post') {
          if (progress === 1) chapterText(ctx, api, 'Check bits', x + w / 2, 655, 33, color);
        }
      }
      F(['mean', 'outside', 'gaps', 'tail', 'unchecked'], () => {
        line(ctx, api, 810, 850, 1450, 850, themeColors.cyan, 4);
        line(ctx, api, 810, 830, 810, 870, themeColors.cyan);
        line(ctx, api, 1450, 830, 1450, 870, themeColors.cyan);
        chapterText(
          ctx,
          api,
          currentBeat === 0 ? 'CUDA event interval' : 'batch elapsed ÷ 100 = average interval',
          1130,
          910,
          31,
          themeColors.cyan,
        );
      });
      if (currentBeat === 1) {
        chapterText(
          ctx,
          api,
          resultComplete('tail')
            ? 'For per-call p95, time individual launches'
            : 'Allocation, transfers and validation happen outside the timer',
          960,
          965,
          28,
          themeColors.yellow,
        );
        if (resultComplete('gaps'))
          chapterText(ctx, api, 'Time between launches counts', 1130, 345, 29, themeColors.yellow);
      }
      footer(
        ctx,
        api,
        resultComplete('unchecked')
          ? 'A failed bit check leaves the timing blank'
          : 'Each dot represents one launch',
      );
    } else {
      const orders = [
        ['naive', 'tiled', 'padded'],
        ['padded', 'tiled', 'naive'],
        ['naive', 'tiled', 'padded'],
        ['padded', 'tiled', 'naive'],
        ['naive', 'tiled', 'padded'],
      ];
      orders.forEach((a, i) => {
        chapterText(ctx, api, 'Round ' + (i + 1), 260, 400 + i * 90, 30, themeColors.muted);
        a.forEach((name, j) => {
          rectangle(
            ctx,
            api,
            450 + j * 430,
            355 + i * 90,
            350,
            65,
            themeColors.panel,
            i < Math.ceil(cueProgress('rounds') * 5)
              ? name === 'naive'
                ? themeColors.blue
                : name === 'tiled'
                  ? themeColors.cyan
                  : themeColors.yellow
              : themeColors.line,
          );
          F(['rounds', 'allrows'], () =>
            chapterText(
              ctx,
              api,
              name,
              625 + j * 430,
              398 + i * 90,
              29,
              i < Math.ceil(cueProgress('rounds') * 5) ? themeColors.ink : themeColors.muted,
            ),
          );
        });
      });
      F('environment', () =>
        chapterText(
          ctx,
          api,
          resultComplete('environment')
            ? 'Browser + remote desktop present · clocks not locked'
            : 'Separate processes · same workload and validation contract',
          960,
          910,
          30,
          themeColors.yellow,
        ),
      );
      footer(ctx, api, 'Five rounds  ·  one batch average per kernel in each round');
    }
  }
}
export default {
  id: 'timing-window',
  draw: drawTimingWindow,
  cues: [
    'gpu-timing-window-check',
    'gpu-timing-window-warm',
    'gpu-timing-window-batch',
    'gpu-timing-window-post',
    'gpu-timing-window-unchecked',
    'gpu-timing-window-mean',
    'gpu-timing-window-outside',
    'gpu-timing-window-gaps',
    'gpu-timing-window-tail',
    'gpu-timing-window-rounds',
    'gpu-timing-window-allrows',
    'gpu-timing-window-environment',
  ],
};
