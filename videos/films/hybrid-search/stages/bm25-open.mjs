import { bm25Term } from '../model.mjs';
import {
  drawRetrievalMechanismArrow,
  drawRetrievalMechanismEquation,
  drawRetrievalMechanismF,
  drawRetrievalMechanismLine,
  drawRetrievalMechanismNote,
  drawRetrievalMechanismP,
  drawRetrievalMechanismStrip,
  drawRetrievalMechanismTag,
  drawRetrievalMechanismText,
} from '../defaults.mjs';
export function drawBm25Open(ctx, scene, state, api) {
  const { C: themeColors, teaching: teaching } = api,
    currentBeat = state.beat ?? 0,
    progress = state.beatP ?? 0;
  const done = (id) => drawRetrievalMechanismP(ctx, api, id) === 1;
  const paint = () => {
    drawRetrievalMechanismText(
      ctx,
      api,
      currentBeat === 0
        ? 'One preserved identifier owns one posting list'
        : 'Same term · change one scoring input',
      960,
      275,
      36,
      themeColors.muted,
    );
    if (currentBeat === 0) {
      drawRetrievalMechanismTag(ctx, api, 'KROT-14', 310, 420, themeColors.yellow);
      drawRetrievalMechanismTag(ctx, api, 'krot-fourteen', 940, 420, themeColors.blue);
      drawRetrievalMechanismArrow(
        ctx,
        api,
        500,
        420,
        500 + 240 * drawRetrievalMechanismP(ctx, api, 'analyze-code'),
        420,
        themeColors.yellow,
      );
      const records = [
        'key rule · current',
        'session rule · current',
        'audit note · current',
        'key rule · old',
        'admin · denied',
      ];
      records.forEach((s, i) => {
        const y = 565 + i * 76;
        drawRetrievalMechanismTag(
          ctx,
          api,
          s,
          1450,
          y,
          i < 3 ? themeColors.green : themeColors.muted,
          440,
        );
        if (i === 0 && drawRetrievalMechanismP(ctx, api, 'code-posting') > 0) {
          const end = 730 + drawRetrievalMechanismP(ctx, api, 'code-posting') * 490;
          drawRetrievalMechanismLine(ctx, api, 940, 465, 940, 565, themeColors.blue);
          drawRetrievalMechanismArrow(ctx, api, 940, 565, end, 565, themeColors.blue);
        }
      });
      if (done('analyzer-mismatch')) {
        drawRetrievalMechanismText(
          ctx,
          api,
          'query: [krot-fourteen]',
          450,
          690,
          30,
          themeColors.yellow,
        );
        drawRetrievalMechanismText(
          ctx,
          api,
          'index: [krot, fourteen]',
          450,
          755,
          30,
          themeColors.pink,
        );
        drawRetrievalMechanismText(
          ctx,
          api,
          'Different token identities → no posting match',
          500,
          855,
          29,
          themeColors.pink,
        );
      }
    } else {
      const plot = teaching.axes({
        x: 185,
        y: 410,
        width: 900,
        height: 430,
        xDomain: [0, 8],
        yDomain: [0, 2.4],
        xTicks: [0, 1, 2, 4, 8],
        yTicks: [0, 1, 2.2],
        xLabel: 'term frequency f',
        yLabel: 'frequency factor',
        fontSize: 25,
      });
      const length =
        currentBeat === 1
          ? 1
          : 1 -
            0.5 * drawRetrievalMechanismP(ctx, api, 'half-length') +
            1.5 * drawRetrievalMechanismP(ctx, api, 'double-length');
      const grow =
        currentBeat === 1
          ? (drawRetrievalMechanismP(ctx, api, 'frequency-one') +
              drawRetrievalMechanismP(ctx, api, 'frequency-two') +
              drawRetrievalMechanismP(ctx, api, 'frequency-four')) /
            3
          : 1;
      teaching.curve({
        plot,
        points: Array.from(
          {
            length: 81,
          },
          (_, i) => ({
            x: i / 10,
            y: bm25Term(
              i / 10,
              length,
              1.2,
              currentBeat === 2
                ? 0.75 * (1 - drawRetrievalMechanismP(ctx, api, 'length-off'))
                : 0.75,
            ),
          }),
        ),
        color: themeColors.blue,
        width: 4,
        progress: grow,
      });
      if (currentBeat === 1) {
        [1, 2, 4].forEach((f, i) => {
          const ready = done(['frequency-one', 'frequency-two', 'frequency-four'][i]),
            v = bm25Term(f),
            at = plot.point(f, v);
          if (ready) {
            api.circle(ctx, at.x, at.y, 9, themeColors.yellow);
            drawRetrievalMechanismText(
              ctx,
              api,
              v.toFixed(3),
              at.x,
              at.y - 28,
              29,
              themeColors.yellow,
            );
          }
          drawRetrievalMechanismStrip(
            ctx,
            api,
            1320,
            440 + i * 135,
            4,
            ready ? f : 0,
            themeColors.blue,
            35,
          );
        });
        drawRetrievalMechanismEquation(ctx, api, String.raw`IDF=\ln(1+2.5/1.5)`, 1455, 340, 35);
        if (done('term-idf'))
          drawRetrievalMechanismText(ctx, api, 'IDF = 0.981', 1455, 850, 40, themeColors.green);
      } else {
        const f = 1,
          v = bm25Term(
            f,
            length,
            1.2,
            0.75 * (1 - drawRetrievalMechanismP(ctx, api, 'length-off')),
          ),
          at = plot.point(f, v);
        api.circle(ctx, at.x, at.y, 11, themeColors.yellow);
        drawRetrievalMechanismText(ctx, api, 'Same f = 1', 1450, 410, 33, themeColors.yellow);
        api.rect(ctx, 1250, 490, (300 * length) / 2, 80, themeColors.blue);
        drawRetrievalMechanismText(
          ctx,
          api,
          'length / average = ' + length.toFixed(2),
          1450,
          625,
          30,
          themeColors.blue,
        );
        if (done('half-length') && !drawRetrievalMechanismP(ctx, api, 'double-length'))
          drawRetrievalMechanismText(ctx, api, 'factor 1.257', 1450, 735, 39, themeColors.green);
        if (done('double-length'))
          drawRetrievalMechanismText(
            ctx,
            api,
            done('length-off') ? 'b=0 → factor1' : 'factor0.710',
            1450,
            735,
            39,
            themeColors.green,
          );
        drawRetrievalMechanismEquation(
          ctx,
          api,
          String.raw`\frac{f(k_1+1)}{f+k_1(1-b+bL/\bar L)}`,
          960,
          930,
          41,
        );
      }
    }
    drawRetrievalMechanismNote(
      ctx,
      api,
      'Permitted-corpus toy · wider production collection statistics may differ',
    );
  };
  drawRetrievalMechanismF(ctx, api, 'bm25-open-mechanism', paint);
  return;
}
export default {
  id: 'bm25-open',
  draw: drawBm25Open,
  cues: [
    'analyze-code',
    'code-posting',
    'analyzer-mismatch',
    'term-idf',
    'frequency-one',
    'frequency-two',
    'frequency-four',
    'half-length',
    'double-length',
    'length-off',
  ],
};
