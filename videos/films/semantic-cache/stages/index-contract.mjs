import {
  drawSemanticConstructionsBox,
  drawSemanticConstructionsCenter,
  drawSemanticConstructionsFoot,
  drawSemanticConstructionsLine,
  drawSemanticConstructionsTable,
  drawSemanticConstructionsText,
  withSemanticConstructionFrame,
} from '../defaults.mjs';
export function paintIndexContract(
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
    'Answer approval and retrieval identity have different dependencies',
    245,
  );
  drawSemanticConstructionsBox(
    ctx,
    api,
    themeColors,
    c,
    'Reviewed response bytes\n30-day retention · digest 217d4084…',
    160,
    345,
    1600,
    themeColors.blue,
    120,
    31,
  );
  if (currentBeat === 0) {
    drawSemanticConstructionsTable(
      ctx,
      api,
      themeColors,
      [
        ['Manifest field', 'Meaning'],
        ['Encoder + preprocessing', 'coordinate definition'],
        ['Index/search policy', 'candidate retrieval procedure'],
        ['Traffic / cutoff / labels', 'evaluated decision population'],
      ],
      260,
      555,
      1400,
      100,
    );
  } else {
    const changed = op >= 0.45;
    ['Old encoder E1', 'New encoder E2'].forEach((label, i) => {
      const x = 450 + i * 950;
      drawSemanticConstructionsText(
        ctx,
        api,
        themeColors,
        label,
        x,
        590,
        32,
        i ? themeColors.yellow : themeColors.cyan,
        'center',
      );
      const baseX = x - 130,
        baseY = 810;
      drawSemanticConstructionsLine(
        ctx,
        api,
        themeColors,
        baseX,
        baseY,
        baseX + 270,
        baseY,
        themeColors.muted,
        2,
      );
      drawSemanticConstructionsLine(
        ctx,
        api,
        themeColors,
        baseX,
        baseY,
        baseX,
        baseY - 150,
        themeColors.muted,
        2,
      );
      const vectors = i
        ? [
            [0.3, 0.8],
            [0.6, 0.6],
          ]
        : [
            [0.8, 0.2],
            [0.9, 0.3],
          ];
      vectors.forEach((v, j) =>
        api.circle(
          ctx,
          baseX + v[0] * 250,
          baseY - v[1] * 170,
          10,
          j ? themeColors.cyan : themeColors.blue,
        ),
      );
    });
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      changed ? 'Re-embed after encoder change' : 'New encoder defines a new coordinate system',
      450,
      925,
      29,
      themeColors.yellow,
      'center',
    );
    drawSemanticConstructionsText(
      ctx,
      api,
      themeColors,
      'Search policy changed\nEvaluate the returned pairs',
      1400,
      925,
      28,
      themeColors.cyan,
      'center',
    );
  }
  drawSemanticConstructionsFoot(
    ctx,
    api,
    themeColors,
    'Match the loaded encoder and index to the evaluated manifest.',
  );
}
export function drawIndexContract(ctx, scene, state, api) {
  withSemanticConstructionFrame(ctx, scene, state, api, paintIndexContract);
}
export default {
  id: 'index-contract',
  draw: drawIndexContract,
  cues: ['sc-index-contract-b0', 'sc-index-contract-b1'],
};
