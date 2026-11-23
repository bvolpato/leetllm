import { clamp, phraseProgress, phraseEnded } from '../arithmetic.mjs';
import { cacheState } from '../construction.mjs';
import { sharedQueryRead } from '../model.mjs';
import { card, math, text } from '../defaults.mjs';
export function drawKvMemory(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api;
  const b = state.beat ?? 0;
  if (b === 4) {
    const heads = [32, 8, 1],
      names = ['Multi-head', 'Grouped-query', 'Multi-query'];
    text(
      ctx,
      api,
      '8 requests × 8,192 positions × 32 layers',
      960,
      320,
      44,
      themeColors.ink,
      'center',
    );
    text(
      ctx,
      api,
      '32 query heads  ·  128 coordinates  ·  2 bytes per scalar',
      960,
      398,
      33,
      themeColors.muted,
      'center',
    );
    api.focus.target('batch-payload', () => {
      heads.forEach((h, i) => {
        const gib = (8 * 8192 * 32 * h * 128 * 2 * 2) / 2 ** 30;
        const y = 535 + i * 132;
        text(ctx, api, names[i] + '  ·  ' + h + ' KV', 180, y + 46, 38, themeColors.ink);
        api.rect(ctx, 720, y, gib * 24, 53, themeColors.green, null, 2);
        text(ctx, api, gib + ' GiB', 1580, y + 42, 44, themeColors.green);
      });
    });
    text(ctx, api, 'Raw K/V tensors only', 960, 982, 40, themeColors.muted, 'center');
    return;
  }
  if (b === 3) {
    const first = sharedQueryRead([1, 0]);
    const second = sharedQueryRead([0, 1]);
    text(ctx, api, 'One shared KV head', 170, 275, 42);
    api.focus.target('shared-query-read', () =>
      teaching.grid({
        x: 170,
        y: 325,
        width: 642,
        height: 374,
        rows: 5,
        columns: 3,
        labels: [
          ['Position', 'Key', 'Value'],
          ...first.keys.map((key, i) => [
            String(i + 1),
            '[' + key.map((v) => (v === Math.SQRT2 ? '√2' : String(v))).join(', ') + ']',
            '[' + first.values[i].join(', ') + ']',
          ]),
        ],
        fontSize: 35,
        fill: themeColors.panel,
        stroke: themeColors.green,
        textColor: themeColors.ink,
      }),
    );
    const plot = teaching.axes({
      x: 1100,
      y: 360,
      width: 510,
      height: 510,
      xDomain: [0, 2],
      yDomain: [0, 2],
      xTicks: [0, 1, 2],
      yTicks: [0, 1, 2],
      xLabel: 'value coordinate 1',
      yLabel: 'value coordinate 2',
      fontSize: 30,
    });
    text(ctx, api, 'Query', 170, 789, 31, themeColors.muted);
    text(ctx, api, 'Scaled scores', 500, 789, 31, themeColors.muted);
    const queries = [
      {
        read: first,
        label: 'Q1  [1, 0]',
        color: themeColors.yellow,
        progress: phraseProgress(state, 'horizontal-read', 0.45, 0.6),
      },
      {
        read: second,
        label: 'Q2  [0, 1]',
        color: themeColors.cyan,
        progress: phraseProgress(state, 'vertical-read', 0.61, 0.71),
      },
    ];
    queries.forEach(({ read, label, color, progress }, j) => {
      api.focus.target('query-path-' + j, () => {
        const y = 866 + j * 80;
        text(ctx, api, label, 170, y, 42, color);
        text(ctx, api, '[' + read.scores.join(', ') + ']', 500, y, 42, color);
      });
      api.focus.target('query-path-' + j, () => {
        if (progress <= 0) return;
        let sum = [0, 0];
        const points = [plot.point(...sum)];
        read.values.forEach((v, i) => {
          const fraction = clamp(progress * read.values.length - i);
          if (!fraction) return;
          sum = sum.map((value, axis) => value + read.shares[i] * v[axis] * fraction);
          points.push(plot.point(...sum));
        });
        api.path(ctx, points, { color, width: 6 });
        const end = points.at(-1);
        api.circle(ctx, end.x, end.y, 10, color);
        if (progress >= 1) {
          text(
            ctx,
            api,
            '[' + sum.map((v) => v.toFixed(2)).join(', ') + ']',
            end.x + 20,
            end.y - 10,
            34,
            color,
          );
        }
      });
    });
    return;
  }
  {
    const cacheFill = phraseProgress(state, 'fill-four', 0.16, 0.62);
    const grouped = phraseEnded(state, 'group-heads', 0.36);
    const k =
      b === 0 ? cacheState(0, 0.08 + 0.7 * cacheFill) : cacheState(1, b === 2 && grouped ? 1 : 0);
    text(
      ctx,
      api,
      'Eight query heads keep their identities',
      960,
      305,
      29,
      themeColors.blue,
      'center',
    );
    for (let i = 0; i < 8; i++) {
      const x = 260 + i * 200;
      api.focus.target('query-head-' + i, () =>
        card(ctx, api, `Q${i + 1}`, x - 70, 405, 140, 70, themeColors.blue, 26),
      );
      const target = 960 + (k.groups[i] - (k.kvHeads - 1) / 2) * 180;
      api.line(ctx, x, 475, target, 625, themeColors.cyan, 3);
    }
    for (let group = 0; group < k.kvHeads; group++) {
      const x = 960 + (group - (k.kvHeads - 1) / 2) * 180;
      api.focus.target('kv-group-' + group, () =>
        card(
          ctx,
          api,
          `K${group + 1} / V${group + 1}`,
          x - 75,
          625,
          150,
          70,
          themeColors.green,
          23,
        ),
      );
      for (let pos = 0; pos < k.positions; pos++)
        api.focus.target('cached-position-' + group + '-' + pos, () =>
          api.rect(ctx, x - 60 + pos * 32, 745, 24, 46, themeColors.green, themeColors.panel, 1),
        );
    }
    const pendingCount = b === 2 && !phraseEnded(state, 'group-count', 0.72);
    const active = b === 0 ? cacheFill > 0 && cacheFill < 1 : b === 2 && grouped && pendingCount;
    teaching.valueChange({
      x: 200,
      y: 835,
      width: 400,
      height: 95,
      label: 'cached positions',
      from: 1,
      to: k.positions,
      progress: 1,
      color: themeColors.cyan,
      emphasis: b === 0 && active ? 0.7 : 0,
      fontSize: 34,
      showDelta: false,
      format: String,
    });
    teaching.valueChange({
      x: 760,
      y: 835,
      width: 400,
      height: 95,
      label: 'stored KV heads',
      from: 8,
      to: k.kvHeads,
      progress: 1,
      color: themeColors.green,
      emphasis: b === 2 && active ? 0.7 : 0,
      fontSize: 34,
      showDelta: false,
      format: String,
    });
    teaching.valueChange({
      x: 1320,
      y: 835,
      width: 400,
      height: 95,
      label: 'stored scalars',
      from: b === 0 ? 32 : 128,
      to: k.scalars,
      progress: 1,
      color: themeColors.yellow,
      emphasis: active ? 0.7 : 0,
      fontSize: 34,
      showDelta: false,
      format: (n) => (pendingCount ? '?' : String(n)),
    });
    api.focus.target('kv-payload-calculation', () =>
      math(
        ctx,
        api,
        String.raw`${k.positions}\times${k.kvHeads}\times\underbrace{2}_{\text{coordinates}}\times\underbrace{2}_{K,V}=${pendingCount ? '?' : k.scalars}`,
        960,
        975,
        35,
        themeColors.ink,
      ),
    );
    text(
      ctx,
      api,
      b === 0
        ? 'A new position adds one column to every retained K/V head'
        : b === 1
          ? 'Four positions, eight queries. What if four queries share each KV head?'
          : 'Same four positions · grouped-query layout',
      960,
      1060,
      24,
      themeColors.muted,
      'center',
    );
  }
}
export default {
  id: 'kv-memory',
  draw: drawKvMemory,
  cues: [
    'fill-four',
    'hold-queries',
    'group-heads',
    'group-count',
    'query-read',
    'horizontal-read',
    'vertical-read',
    'batch-size',
  ],
};
