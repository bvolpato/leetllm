import {
  drawSemanticText,
  withSemanticConstructionFrame,
  withSemanticLegacyFrame,
} from '../defaults.mjs';
export function paintEconomics(ctx, scene, state, api, themeColors, c, t, s, currentBeat) {
  if (currentBeat === 2) {
    drawSemanticText(
      ctx,
      api,
      themeColors,
      'SAME TEN REQUESTS · serving forecast versus shadow execution',
      140,
      275,
      31,
      themeColors.yellow,
    );
    ['Serving forecast', 'Shadow trial'].forEach((name, lane) => {
      drawSemanticText(
        ctx,
        api,
        themeColors,
        name,
        140,
        360 + lane * 270,
        32,
        lane ? themeColors.pink : themeColors.green,
      );
      api.focus.target('execution-populations', () =>
        t.grid({
          x: 160,
          y: 405 + lane * 270,
          width: 1580,
          height: 140,
          rows: 1,
          columns: 10,
          labels: [s.rows.map((row) => row.id + '\n' + (!lane && row.hit ? 'reuse' : 'generate'))],
          fontSize: 24,
          fill: themeColors.panel,
          stroke: lane ? themeColors.pink : themeColors.green,
          textColor: themeColors.ink,
        }),
      );
    });
    api.focus.target('serving-cost', () =>
      drawSemanticText(
        ctx,
        api,
        themeColors,
        `Forecast ${s.generations} generation calls · $${s.cost.toFixed(4)}`,
        160,
        900,
        32,
        themeColors.green,
      ),
    );
    const shadowCalls = s.rows.length,
      shadowCost = shadowCalls * (0.00008 + 0.004);
    api.focus.target('shadow-cost', () =>
      drawSemanticText(
        ctx,
        api,
        themeColors,
        `Shadow ${shadowCalls} generation calls · $${shadowCost.toFixed(4)}`,
        1010,
        900,
        32,
        themeColors.pink,
      ),
    );
    drawSemanticText(
      ctx,
      api,
      themeColors,
      'Assigned lookup and generation prices · enable reuse only after its evidence gate',
      960,
      1000,
      27,
      themeColors.muted,
      'center',
    );
    return;
  }
  drawSemanticText(
    ctx,
    api,
    themeColors,
    '10 request identities · lookup 20 ms · fresh generation 1,000 ms',
    140,
    260,
    30,
    themeColors.muted,
  );
  const cells = api.focus.target('sorted-requests', () =>
    t.grid({
      x: 160,
      y: 355,
      width: 1580,
      height: 170,
      rows: 1,
      columns: 10,
      fill: themeColors.panel,
      stroke: themeColors.muted,
      labels: [s.sorted.map((row) => `${row.id}\n${row.latency} ms`)],
      highlights: s.sorted.map((row, i) => ({
        row: 0,
        column: i,
        fill: row.hit ? themeColors.green : themeColors.pink,
        opacity: 0.15,
      })),
      fontSize: 25,
    }),
  );
  api.focus.target('reuse-counts', () =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      `Safe hits ${s.hits} · fresh generations ${s.generations}`,
      150,
      640,
      33,
      themeColors.cyan,
    ),
  );
  api.focus.target('mean-latency', () =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      `Mean ${s.mean.toFixed(0)} ms`,
      150,
      755,
      33,
      themeColors.green,
    ),
  );
  api.focus.target('tail-latency', () =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      `p95 ${s.p95} ms · baseline 1,000 ms`,
      900,
      755,
      31,
      themeColors.pink,
    ),
  );
  drawSemanticText(
    ctx,
    api,
    themeColors,
    `Assigned prices: lookup $0.00008 · generation $0.004`,
    150,
    865,
    28,
    themeColors.muted,
  );
  api.focus.target('estimated-saving', () =>
    drawSemanticText(
      ctx,
      api,
      themeColors,
      `Cost $${s.cost.toFixed(4)} · baseline $${s.baseline.toFixed(4)} · saving $${(s.baseline - s.cost).toFixed(4)}`,
      150,
      965,
      31,
      themeColors.yellow,
    ),
  );
}
export function drawEconomics(ctx, scene, state, api) {
  if (withSemanticConstructionFrame(ctx, scene, state, api, paintEconomics)) return;
  withSemanticLegacyFrame(ctx, scene, state, api, paintEconomics);
}
export default {
  id: 'economics',
  draw: drawEconomics,
  cues: ['reuse-six', 'mean-improvement', 'tail-path', 'shadow-execution', 'saving-forecast'],
};
