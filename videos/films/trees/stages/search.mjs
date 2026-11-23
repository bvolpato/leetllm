import { best, gini, split } from '../arithmetic.mjs';
import { rows, stump } from '../fixtures.mjs';
import {
  drawConstructionDot,
  drawConstructionEquation,
  drawConstructionFocus,
  drawConstructionText,
} from '../defaults.mjs';
const sortedValues = [...new Set(rows.map(([ambiguity]) => ambiguity))].sort((a, b) => a - b);
const gaps = sortedValues.slice(1).map((v, i) => (sortedValues[i] + v) / 2);
export function drawSearch(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.1, z = 0.78) => api.phase(progress, a, z);
  const dataPlot = () => {
    const q = teaching.axes({
      x: 200,
      y: 365,
      width: 880,
      height: 440,
      xDomain: [0.5, 5],
      yDomain: [0, 9],
      xTicks: [1, 2, 3, 4, 5],
      yTicks: [0, 3, 6, 9],
      xLabel: 'ambiguity',
      yLabel: 'policy support',
      fontSize: 26,
    });
    rows.forEach((row, i) => {
      const at = q.point(row[0], row[1]);
      drawConstructionDot(ctx, api, at.x, at.y, row[2]);
      drawConstructionText(
        ctx,
        api,
        'R' + (i + 1),
        at.x,
        at.y + -35,
        26,
        i === 2 ? themeColors.yellow : themeColors.muted,
      );
    });
    return q;
  };
  {
    const q = dataPlot(),
      index = Math.min(gaps.length - 1, Math.floor(cueProgress() * gaps.length)),
      cut = currentBeat === 0 ? gaps[index] : stump.cut,
      result = split(rows, 0, cut),
      a = q.point(cut, 0),
      z = q.point(cut, 9);
    drawConstructionFocus(ctx, api, 'tree-partition', () =>
      api.path(ctx, [a, z], {
        color: themeColors.yellow,
        width: 5,
        clip: q.bounds,
      }),
    );
    const counts = (data) => {
      const positive = data.filter((r) => r[2]).length;
      return `${positive}/${data.length}`;
    };
    drawConstructionFocus(ctx, api, 'split-gain', () => {
      drawConstructionText(
        ctx,
        api,
        'Left · ' + result.left.map((r) => 'R' + (rows.indexOf(r) + 1)).join(' '),
        1450,
        410,
        27,
        themeColors.blue,
      );
      drawConstructionText(
        ctx,
        api,
        'Right · ' + result.right.map((r) => 'R' + (rows.indexOf(r) + 1)).join(' '),
        1450,
        490,
        27,
        themeColors.pink,
      );
      drawConstructionEquation(
        ctx,
        api,
        `p_L=${counts(result.left)}\\quad p_R=${counts(result.right)}`,
        1450,
        585,
        39,
        themeColors.ink,
      );
      drawConstructionEquation(
        ctx,
        api,
        `G_L=${gini(result.left.map((r) => r[2])).toFixed(3)}\\quad G_R=${gini(result.right.map((r) => r[2])).toFixed(3)}`,
        1450,
        680,
        36,
        themeColors.ink,
      );
      drawConstructionEquation(
        ctx,
        api,
        `\\frac{${result.left.length}}{${rows.length}} \\times ${gini(result.left.map((r) => r[2])).toFixed(2)} + \\frac{${result.right.length}}{${rows.length}} \\times ${gini(result.right.map((r) => r[2])).toFixed(2)} \\approx ${(0.5 - result.gain).toFixed(3)}`,
        1450,
        785,
        36,
        themeColors.ink,
      );
      drawConstructionEquation(
        ctx,
        api,
        `gain=0.5-${(0.5 - result.gain).toFixed(3)}\\approx${result.gain.toFixed(3)}`,
        1450,
        876,
        39,
        themeColors.yellow,
      );
    });
    drawConstructionText(
      ctx,
      api,
      'Feature cut: ambiguity ≤ ' + cut.toFixed(2),
      650,
      945,
      35,
      themeColors.yellow,
    );
    if (currentBeat === 2) {
      const alt = best(rows, [1]);
      drawConstructionText(
        ctx,
        api,
        'Best support cut: ' + alt.cut.toFixed(2) + ' · gain ' + alt.gain.toFixed(3),
        1450,
        965,
        29,
        themeColors.muted,
      );
    }
    return;
  }
  return;
}
export default {
  id: 'search',
  draw: drawSearch,
  cues: ['tree-partition-b1-1', 'split-gain-b2-1', 'tree-partition-b3-1'],
};
