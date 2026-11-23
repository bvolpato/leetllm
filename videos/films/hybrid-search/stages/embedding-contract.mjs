import { coordinateFrame } from '../construction.mjs';
import {
  drawCoordinateContractRow,
  drawCoordinateContractText,
  drawRetrievalMechanismArrow,
  drawRetrievalMechanismEquation,
  drawRetrievalMechanismF,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismTag,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawEmbeddingContract(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    if (currentBeat < 2) {
      const plot = teaching.axes({
        x: 200,
        y: 390,
        width: 730,
        height: 430,
        xDomain: [0, 1.2],
        yDomain: [0, 1.2],
        xTicks: [0, 0.5, 1],
        yTicks: [0, 0.5, 1],
        equalUnits: true,
        fontSize: 26,
      });
      const old = [0.95, 0.15],
        query = [0.8, 0.2],
        origin = plot.point(0, 0);
      [old, query].forEach((v, i) => {
        const end = plot.point(...v);
        drawRetrievalMechanismArrow(
          ctx,
          api,
          origin.x,
          origin.y,
          end.x,
          end.y,
          i ? themeColors.yellow : themeColors.blue,
        );
      });
      drawRetrievalMechanismText(ctx, api, 'stored passage', 390, 330, 30, themeColors.blue);
      drawRetrievalMechanismText(
        ctx,
        api,
        'matching query encoder',
        765,
        330,
        30,
        themeColors.yellow,
      );
      drawRetrievalMechanismTag(
        ctx,
        api,
        currentBeat === 0 ? 'DPR: 768 · CLS · inner product' : 'MiniLM example: 384 · limit 256',
        1420,
        430,
        themeColors.cyan,
        640,
      );
      if (currentBeat === 0) {
        drawRetrievalMechanismEquation(
          ctx,
          api,
          String.raw`\hat q^\top\hat d=\cos(q,d)`,
          1420,
          640,
          38,
        );
        if (done('dense-metric'))
          drawRetrievalMechanismText(
            ctx,
            api,
            'Unnormalized dot also changes with length',
            1420,
            780,
            29,
            themeColors.yellow,
          );
      } else {
        drawRetrievalMechanismTag(ctx, api, 'KROT-13', 1360, 640, themeColors.pink);
        drawRetrievalMechanismTag(ctx, api, 'KROT-14 target', 1440, 770, themeColors.blue);
        drawRetrievalMechanismText(
          ctx,
          api,
          'Reported small-corpus rank error',
          1420,
          875,
          28,
          themeColors.muted,
        );
      }
    } else drawCoordinateContract(ctx, scene, state, api);
    if (currentBeat < 2)
      drawRetrievalMechanismNote(
        ctx,
        api,
        'Supplied geometry · checkpoint, tokenizer, pooling, limit, metric and index form one contract',
      );
  };
  drawRetrievalMechanismF(ctx, api, 'embedding-contract-mechanism', paint);
  return;
}
function drawCoordinateContract(ctx, scene, state, api) {
  const { C: themeColors } = api,
    progress = (id) => state.cues?.[id]?.progress ?? 0,
    f = coordinateFrame(state);
  if (!f.worksheet) {
    if (progress('paired-generation') === 0) {
      drawCoordinateContractText(
        ctx,
        api,
        'Reject undefined cosine inputs before scoring',
        960,
        300,
        35,
        themeColors.yellow,
      );
      drawCoordinateContractRow(ctx, api, [0, 0], 320, 460, 500, themeColors.pink);
      drawCoordinateContractRow(ctx, api, ['∞', 1], 1100, 460, 500, themeColors.pink);
      drawCoordinateContractText(ctx, api, 'zero norm', 570, 630, 32, themeColors.pink);
      drawCoordinateContractText(ctx, api, 'nonfinite coordinate', 1350, 630, 32, themeColors.pink);
      drawCoordinateContractText(
        ctx,
        api,
        'Equal width does not make these inputs valid',
        960,
        840,
        32,
        themeColors.muted,
      );
    } else {
      drawCoordinateContractText(
        ctx,
        api,
        'A clause outside the retained prefix cannot affect its vector',
        960,
        300,
        33,
        themeColors.yellow,
      );
      for (let i = 0; i < 24; i++) api.rect(ctx, 200 + i * 33, 470, 26, 42, themeColors.blue);
      for (let i = 0; i < 7; i++) api.rect(ctx, 1280 + i * 33, 470, 26, 42, themeColors.pink);
      api.line(ctx, 1110, 420, 1110, 620, themeColors.yellow, 4);
      drawCoordinateContractText(ctx, api, 'retained prefix', 600, 615, 31, themeColors.blue);
      drawCoordinateContractText(ctx, api, 'deciding clause', 1400, 615, 31, themeColors.pink);
      drawCoordinateContractText(
        ctx,
        api,
        'configured boundary',
        1110,
        380,
        28,
        themeColors.yellow,
      );
      drawCoordinateContractText(
        ctx,
        api,
        'Schematic grouped positions · use actual tokenizer and limit',
        960,
        800,
        29,
        themeColors.muted,
      );
    }
    return;
  }
  drawCoordinateContractText(
    ctx,
    api,
    'Separate supplied unit-vector coordinate worksheet',
    960,
    275,
    34,
    themeColors.yellow,
  );
  drawCoordinateContractText(
    ctx,
    api,
    'Target G-14 and distractor C-08 keep their document identities',
    960,
    330,
    28,
    themeColors.muted,
  );
  const plot = api.teaching.axes({
      x: 220,
      y: 420,
      width: 740,
      height: 420,
      xDomain: [-1.2, 1.2],
      yDomain: [-0.2, 1.2],
      xTicks: [-1, 0, 1],
      yTicks: [0, 1],
      xLabel: 'coordinate 1',
      yLabel: 'coordinate 2',
      equalUnits: true,
      fontSize: 25,
    }),
    origin = plot.point(0, 0);
  for (const [v, c, w] of [
    [f.passages[0], themeColors.blue, 8],
    [f.passages[1], themeColors.pink, 7],
    [f.query, themeColors.yellow, 3],
  ]) {
    const end = plot.point(...v);
    api.arrow(ctx, origin.x, origin.y, end.x, end.y, c, w);
  }
  drawCoordinateContractText(
    ctx,
    api,
    'query CCW: ' + f.queryDegrees + '°',
    600,
    380,
    28,
    themeColors.yellow,
  );
  drawCoordinateContractText(
    ctx,
    api,
    'passages CCW: ' + f.passageDegrees + '°',
    600,
    960,
    28,
    themeColors.blue,
  );
  drawCoordinateContractText(ctx, api, 'stored passage', 1190, 410, 27, themeColors.muted);
  drawCoordinateContractText(ctx, api, 'q · d', 1650, 410, 29, themeColors.muted);
  ['G-14 target', 'C-08 distractor'].forEach((name, i) => {
    const y = 475 + i * 180,
      c = i ? themeColors.pink : themeColors.blue;
    drawCoordinateContractText(ctx, api, name, 1200, y + 20, 30, c);
    drawCoordinateContractRow(ctx, api, f.passages[i], 1060, y + 48, 390, c);
    drawCoordinateContractText(
      ctx,
      api,
      f.scoreKnown ? f.scores[i].toFixed(3) : '?',
      1650,
      y + 92,
      40,
      f.scoreKnown && f.winner === i ? themeColors.green : themeColors.muted,
    );
  });
  drawCoordinateContractText(
    ctx,
    api,
    f.repaired
      ? 'Matching coordinates restore G-14'
      : f.wrong && f.passageDegrees === 0
        ? 'Query-only change ranks C-08 first'
        : f.scoreKnown
          ? 'Matching initial pair ranks G-14 first'
          : 'Compute after the current transformation',
    1370,
    890,
    29,
    f.scoreKnown ? themeColors.green : themeColors.muted,
  );
  drawCoordinateContractText(
    ctx,
    api,
    'Unit vectors make these dot products cosines · no encoder was trained here',
    960,
    1005,
    27,
    themeColors.muted,
  );
}
export default {
  id: 'embedding-contract',
  draw: drawEmbeddingContract,
  cues: [
    'dense-metric',
    'paired-generation',
    'reembed-generation',
    'version-worksheet',
    'version-query-rotate',
    'version-wrong-rank',
    'version-passages-rotate',
    'version-fixed-rank',
  ],
};
