import { robustUnit } from '../arithmetic.mjs';
import { METRICS, PASSAGES, QUERY } from '../fixtures.mjs';
import { geometryText, heading, vector } from '../defaults.mjs';
export function drawSynthesis(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = api.clamp(state.beatP ?? 0),
    cueProgress = (a = 0.12, z = 0.85) => api.phase(progress, a, z);
  {
    heading(ctx, api, 'Same original fixture · one declared encoder / transform / metric identity');
    const a = api.teaching.axes({
      x: 250,
      y: 370,
      width: 960,
      height: 510,
      xDomain: [-0.3, 4.6],
      yDomain: [-0.3, 2.8],
      xTicks: [],
      yTicks: [],
      equalUnits: true,
      xLabel: 'coordinate 0',
      yLabel: 'coordinate 1',
    });
    vector(ctx, api, a, QUERY, themeColors.cyan);
    PASSAGES.forEach((r, i) => {
      const unit = robustUnit(r.vector),
        mix = currentBeat === 0 ? 0 : currentBeat === 1 ? cueProgress() : 1;
      vector(
        ctx,
        api,
        a,
        r.vector.map((v, j) => v + (unit[j] - v) * mix),
        i ? themeColors.pink : themeColors.green,
      );
    });
    geometryText(
      ctx,
      api,
      'A cosine ' + METRICS[0].cosine.toFixed(3),
      1520,
      430,
      35,
      themeColors.green,
      'center',
    );
    geometryText(
      ctx,
      api,
      'B cosine ' + METRICS[1].cosine.toFixed(3),
      1520,
      600,
      35,
      themeColors.pink,
      'center',
    );
    geometryText(
      ctx,
      api,
      currentBeat === 0
        ? 'Original directions before normalization'
        : currentBeat === 1
          ? 'Divide each vector by its own length'
          : 'Unit vectors keep the original directions',
      960,
      1020,
      34,
      themeColors.yellow,
      'center',
    );
    api.focus.target('retrieval-contract-0', () =>
      geometryText(
        ctx,
        api,
        'Encoder: supplied fixture',
        1520,
        780,
        29,
        themeColors.muted,
        'center',
      ),
    );
    api.focus.target('retrieval-contract-1', () =>
      geometryText(
        ctx,
        api,
        'Transform: unit normalization',
        1520,
        880,
        27,
        themeColors.blue,
        'center',
      ),
    );
    api.focus.target('retrieval-contract-2', () =>
      geometryText(ctx, api, 'Metric: cosine', 1520, 330, 31, themeColors.green, 'center'),
    );
    return;
  }
  return;
}
export default {
  id: 'synthesis',
  draw: drawSynthesis,
  cues: [
    'synthesis-retrieval-contract-3-b1-1',
    'synthesis-retrieval-contract-1-b2-1',
    'synthesis-retrieval-contract-0-b3-1',
    'synthesis-retrieval-contract-3-b3-2',
  ],
};
