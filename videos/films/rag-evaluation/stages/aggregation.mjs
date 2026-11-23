import { clamp, completed } from '../construction.mjs';
import { aggregationSnapshot } from '../model.mjs';
import { equation, text } from '../defaults.mjs';
export function drawAggregation(ctx, scene, state, api) {
  const { C: themeColors, components: components, phase } = api,
    beat = state.beat ?? 0,
    progress2 = state.beatP ?? 0,
    q = phase(progress2, 0.05, 0.88);
  {
    const snapshot = aggregationSnapshot(beat, progress2);
    if (state.cues?.['long-answer']) {
      const count =
        Math.ceil(9 * api.focus.progress('long-answer', 0)) +
        Number(api.focus.visible('short-answer'));
      snapshot.observed = snapshot.cases.slice(0, count);
      snapshot.supported = snapshot.observed.filter((row) => row.supported).length;
      snapshot.pooled = count ? snapshot.supported / count : null;
      snapshot.rates = ['A', 'B'].filter(
        (id) => api.focus.progress(id === 'A' ? 'long-rate' : 'short-rate', 0) >= 1,
      );
      snapshot.mean =
        snapshot.rates.length === 2 && completed(state, 'average-rates', 1) ? 0.5 : null;
      snapshot.emptyCase = beat === 2 && api.focus.visible('empty-denominator');
    }
    const seen = new Set(snapshot.observed.map((item) => item.id));
    text(ctx, api, 'Same reviewed answers A and B', 960, 280, 34, themeColors.ink, 'center');
    text(ctx, api, 'Answer A · nine claims', 565, 355, 30, themeColors.green, 'center');
    text(ctx, api, 'Answer B · one claim', 1465, 355, 30, themeColors.pink, 'center');
    snapshot.cases.forEach((item, i) => {
      const x = i < 9 ? 180 + i * 86 : 1400,
        color = seen.has(item.id)
          ? item.supported
            ? themeColors.green
            : themeColors.pink
          : themeColors.muted;
      api.focus.target('reviewed-claims', () =>
        components.panel({
          x,
          y: 400,
          width: 72,
          height: 105,
          fill: themeColors.panel,
          stroke: color,
        }),
      );
      text(ctx, api, item.id, x + 36, 437, 23, color, 'center');
      api.focus.target('claim-support', () =>
        text(
          ctx,
          api,
          seen.has(item.id) ? (item.supported ? '✓' : '×') : '?',
          x + 36,
          480,
          31,
          color,
          'center',
        ),
      );
    });
    const observedA = snapshot.observed.filter((item) => item.answer === 'A').length,
      observedB = snapshot.observed.filter((item) => item.answer === 'B').length;
    text(ctx, api, `${observedA}/9 claims reviewed`, 565, 555, 25, themeColors.muted, 'center');
    text(ctx, api, `${observedB}/1 claims reviewed`, 1465, 555, 25, themeColors.muted, 'center');
    if (beat === 0) {
      const poolColor = snapshot.observed.some((item) => !item.supported)
        ? themeColors.pink
        : themeColors.cyan;
      const pending = snapshot.cases.length - snapshot.observed.length;
      const label = pending
        ? `Running score · ${pending} of ${snapshot.cases.length} claims pending`
        : 'Final score · every claim reviewed';
      text(ctx, api, label, 960, 650, 31, themeColors.cyan, 'center');
      api.focus.target('pooled-score', () =>
        equation(
          ctx,
          api,
          snapshot.pooled === null
            ? String.raw`\text{No reviewed claims yet}`
            : String.raw`\frac{${snapshot.supported}}{${snapshot.observed.length}}=${snapshot.pooled.toFixed(2)}`,
          960,
          745,
          47,
          poolColor,
        ),
      );
      api.rect(ctx, 520, 805, 880, 45, themeColors.panel, themeColors.muted, 0);
      if (snapshot.pooled !== null)
        api.focus.target('pooled-bar', () =>
          api.rect(ctx, 520, 805, 880 * snapshot.pooled, 45, poolColor, undefined, 0),
        );
      text(ctx, api, 'Each claim contributes one vote', 960, 920, 29, themeColors.yellow, 'center');
    } else {
      const positions = {
        A: 650,
        B: 1070,
      };
      ['A', 'B'].forEach((id) => {
        const arrived = snapshot.rates.includes(id),
          startX = id === 'A' ? 565 : 1465,
          targetX = positions[id];
        const travel = api.focus.progress(
            id === 'A' ? 'long-rate' : 'short-rate',
            beat > 1 ? 1 : clamp((progress2 - (id === 'A' ? 0.08 : 0.29)) / 0.21),
          ),
          x = api.lerp(startX, targetX, travel),
          y = api.lerp(625, 675, travel);
        if (travel > 0) {
          api.focus.target('answer-rate', () =>
            components.panel({
              x: x - 155,
              y: y - 50,
              width: 310,
              height: 100,
              fill: themeColors.panel,
              stroke: id === 'A' ? themeColors.green : themeColors.pink,
            }),
          );
          text(
            ctx,
            api,
            `Answer ${id}`,
            x,
            y - 15,
            24,
            id === 'A' ? themeColors.green : themeColors.pink,
            'center',
          );
          api.focus.target('answer-rate', () =>
            equation(
              ctx,
              api,
              id === 'A' ? String.raw`\frac{9}{9}=1` : String.raw`\frac{0}{1}=0`,
              x,
              y + 34,
              29,
              id === 'A' ? themeColors.green : themeColors.pink,
            ),
          );
        }
        if (arrived)
          api.arrow(
            ctx,
            targetX,
            740,
            860,
            795,
            id === 'A' ? themeColors.green : themeColors.pink,
            3,
          );
      });
      text(ctx, api, 'Equal weight per answer · A + B', 860, 835, 27, themeColors.yellow, 'center');
      if (snapshot.mean !== null)
        api.focus.target('answer-mean', () =>
          equation(ctx, api, String.raw`\frac{1+0}{2}=0.50`, 860, 910, 40, themeColors.yellow),
        );
      else
        api.focus.target('answer-mean', () =>
          text(ctx, api, 'Collect both answer rates', 860, 910, 28, themeColors.muted, 'center'),
        );
      text(ctx, api, 'Pooled claims: 9/10 = 0.90', 860, 1000, 27, themeColors.cyan, 'center');
      if (snapshot.emptyCase) {
        api.focus.target('abstention-case', () =>
          components.panel({
            x: 1350,
            y: 625,
            width: 460,
            height: 360,
            fill: themeColors.panel,
            stroke: themeColors.blue,
          }),
        );
        text(ctx, api, 'Additional question C', 1580, 675, 28, themeColors.blue, 'center');
        text(ctx, api, 'When does the receipt arrive?', 1580, 727, 24, themeColors.ink, 'center');
        text(ctx, api, 'Source B not retrieved', 1580, 780, 25, themeColors.pink, 'center');
        text(
          ctx,
          api,
          'Abstain · zero emitted claims',
          1580,
          835,
          24,
          themeColors.yellow,
          'center',
        );
        text(ctx, api, 'Faithfulness: undefined', 1580, 895, 25, themeColors.muted, 'center');
        text(
          ctx,
          api,
          'Label retrieval miss + abstention',
          1580,
          950,
          23,
          themeColors.blue,
          'center',
        );
      }
    }
  }
}
export default {
  id: 'aggregation',
  draw: drawAggregation,
  cues: [
    'long-answer',
    'short-answer',
    'pool-claims',
    'long-rate',
    'short-rate',
    'average-rates',
    'empty-denominator',
  ],
};
