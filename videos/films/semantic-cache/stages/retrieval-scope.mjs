import {
  drawSemanticConstructionsArrow,
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintRetrievalScope(
  ctx,
  scene,
  state,
  api,
  themeColors,
  c,
  t,
  id,
  currentBeat,
  beatProgress,
  done,
  progress,
  op,
) {
  drawSemanticConstructionsCenter(
    ctx,
    api,
    themeColors,
    'Constrain the search domain, then recheck the returned record',
    245,
  );
  const rows = [
    ['A', 'docs-public', 'R7'],
    ['B', 'internal-admin', 'R7'],
    ['C', 'docs-public', 'R8'],
    ['D', 'docs-public', 'R7'],
  ];
  rows.forEach((r, i) => {
    const x = 190 + i * 420,
      pass = r[1] === 'docs-public' && r[2] === 'R7';
    drawSemanticConstructionsBox(
      ctx,
      api,
      themeColors,
      c,
      r[0] + '\n' + r[1] + '\n' + r[2],
      x,
      385,
      350,
      pass ? themeColors.blue : themeColors.muted,
      170,
      29,
    );
    if (pass) {
      drawSemanticConstructionsArrow(ctx, api, themeColors, x + 175, 580, x + 175, 695);
      drawSemanticConstructionsBox(
        ctx,
        api,
        themeColors,
        c,
        'returned scope\nrecheck',
        x,
        725,
        350,
        themeColors.cyan,
        110,
      );
    } else {
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        'outside active filter',
        x + 175,
        620,
        25,
        themeColors.pink,
        'center',
      );
    }
  });
  if (currentBeat === 1) {
    const ready = done(1, 'sc-distance-cutoff');
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'similarity ≥ 0.995     ↔     distance = 1 − similarity',
      900,
      themeColors.yellow,
      32,
    );
    if (ready)
      drawSemanticConstructionsCenter(
        ctx,
        api,
        themeColors,
        'distance ≤ 0.005 · Redis COSINE distance range [0, 2]',
        965,
        themeColors.cyan,
        31,
      );
  } else
    drawSemanticConstructionsCenter(
      ctx,
      api,
      themeColors,
      'Search A and D under the active filter.',
      930,
      themeColors.pink,
      31,
    );
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'RedisVL searches the whole cache by default. Supply the filter on each read.',
  );
}
export function drawRetrievalScope(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintRetrievalScope);
}
export default {
  id: 'retrieval-scope',
  draw: drawRetrievalScope,
  cues: ['sc-retrieval-scope-b0', 'sc-retrieval-scope-b1', 'sc-distance-cutoff'],
};
