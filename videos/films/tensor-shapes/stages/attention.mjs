import { clamp, complete, count, event } from '../construction.mjs';
import { attentionScores, sentenceWords } from '../fixtures.mjs';
import { attentionPairConstruction } from '../model.mjs';
import { caption, card, drawScoreMatrix, equation, target, text } from '../defaults.mjs';

const cells = attentionScores.map((matrix) =>
  matrix.flatMap((row, r) => row.map((value, c) => ({ row: r, column: c, value }))),
);

function outputShape(ctx, api) {
  target(ctx, api, 'attention-shape', () =>
    text(ctx, api, '(2, 3, 3)     sentence, query, key', 960, 860, 38, api.C.cyan, 'center'),
  );
}

function drawBothSentences(ctx, state, api) {
  const { C } = api;
  const fallback = (start, end) => (state.beat > 3 ? 1 : api.phase(state.beatP ?? 0, start, end));
  const slide = state.cues?.['make-room-for-sentence']
    ? event(state, 3, 'make-room-for-sentence')
    : fallback(0.02, 0.28);
  const build = complete(slide)
    ? state.cues?.['score-second-sentence']
      ? event(state, 3, 'score-second-sentence')
      : fallback(0.28, 0.84)
    : 0;
  const follow = event(state, 4, 'inspect-migrate-keys');
  const swap = event(state, 4, 'swap-key-axes');
  const x = api.lerp(650, 270, slide);
  const y = api.lerp(425, 450, slide);
  const width = api.lerp(205, 170, slide);
  target(ctx, api, 'first-sentence-scores', () => {
    text(ctx, api, 'Sentence 0', x + width * 1.5, 280, 34, C.blue, 'center');
    drawScoreMatrix(ctx, api, x, y, width, api.lerp(105, 100, slide), cells[0], 'pair-scores');
    if (follow > 0) api.line(ctx, 270, 645, 270 + 502 * follow, 645, C.yellow, 5);
  });
  if (build > 0) {
    target(ctx, api, 'second-sentence-scores', () => {
      text(ctx, api, 'Sentence 1', 1445, 280, 34, C.pink, 'center');
      drawScoreMatrix(
        ctx, api, 1190, 450, 170, 100, cells[1].slice(0, count(9, build)),
        'second-grid', sentenceWords[1], null,
      );
    });
  }
  if (state.beat === 3 && complete(build))
    text(ctx, api, 'migrate  →  stories?', 960, 870, 43, C.ink, 'center');
  else outputShape(ctx, api);
  if (state.beat === 4) {
    target(ctx, api, 'score-operation', () => {
      if (swap > 0) {
        api.text(ctx, 'scores = q @ np.swapaxes(k, -1, -2)', 575, 960, 34, C.ink, 'center', 'mono');
        equation(ctx, api, String.raw`(3,4)@(4,3)\to(3,3)`, 1445, 948, 37, C.cyan);
      }
    });
  }
}

export function drawAttention(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0,
    progress = clamp(state.beatP ?? 0),
    phaseForBeat = (i, a = 0.08, z = 0.88) =>
      currentBeat < i ? 0 : currentBeat > i ? 1 : api.phase(progress, a, z);
  if (currentBeat >= 3) return drawBothSentences(ctx, state, api);
  {
    const productsCue = state.cues?.['query-products-b2-1'];
    const productProgress =
      currentBeat === 1 && productsCue
        ? productsCue.phase === 'before'
          ? 0
          : Math.min(1, 0.22 + 0.88 * productsCue.progress)
        : progress;
    const rowCue = state.cues?.['migrate-score-row-b3-1'];
    const rowProgress = rowCue?.progress ?? clamp(progress / 0.38);
    const otherProgress = complete(rowProgress) ? event(state, 2, 'fill-other-query-rows') : 0;
    const matrixProgress =
      currentBeat === 2 && rowCue
        ? 0.38 * rowProgress + 0.54 * otherProgress
        : productProgress;
    const model = attentionPairConstruction(currentBeat, matrixProgress);
    if (currentBeat === 0) {
      const queryCue = state.cues?.['query-migrate-b1-1'];
      const visibleFeatures = queryCue
        ? queryCue.phase === 'before'
          ? 0
          : Math.min(4, 1 + Math.floor(4 * queryCue.progress))
        : Math.floor(4 * phaseForBeat(0));
      text(
        ctx,
        api,
        'First snippet · select one query, compare it with three keys',
        960,
        280,
        30,
        themeColors.ink,
        'center',
      );
      text(ctx, api, 'query vector · migrate', 315, 390, 30, themeColors.blue, 'center');
      api.focus.target('query-migrate', () =>
        model.query.forEach((value, feature) => {
          if (feature < visibleFeatures)
            api.components.card({
              label: String(value),
              x: 95 + feature * 110,
              y: 455,
              width: 100,
              height: 82,
              fill: themeColors.panel,
              stroke: themeColors.blue,
              textColor: themeColors.blue,
              fontSize: 31,
              padding: 8,
            });
        }),
      );
      text(ctx, api, 'feature index d', 315, 570, 25, themeColors.muted, 'center');
      text(ctx, api, 'key vectors · same snippet', 1280, 350, 29, themeColors.pink, 'center');
      api.focus.target('query-keys', () =>
        model.keys.forEach((key, row) => {
          const y = 420 + row * 150;
          text(
            ctx,
            api,
            key.token,
            805,
            y + 38,
            28,
            row === 1 ? themeColors.yellow : themeColors.pink,
            'right',
          );
          key.vector.forEach((value, feature) => {
            if (feature < visibleFeatures)
              api.components.card({
                label: String(value),
                x: 860 + feature * 105,
                y,
                width: 96,
                height: 76,
                fill: themeColors.panel,
                stroke: row === 1 ? themeColors.yellow : themeColors.pink,
                textColor: themeColors.ink,
                fontSize: 29,
                padding: 8,
              });
          });
        }),
      );
      text(
        ctx,
        api,
        'matching feature positions share d = 0, 1, 2, 3',
        1190,
        895,
        26,
        themeColors.muted,
        'center',
      );
      api.focus.target('attention-shape', () =>
        equation(
          ctx,
          api,
          String.raw`Q:(2,3,4)\quad K:(2,3,4)`,
          960,
          970,
          38,
          themeColors.cyan,
          'center',
        ),
      );
    } else if (currentBeat === 1) {
      text(ctx, api, 'Query “migrate” = [4, 5, 6, 7]', 960, 275, 32, themeColors.blue, 'center');
      const headers = ['d₀', 'd₁', 'd₂', 'd₃'];
      headers.forEach((label, feature) =>
        text(ctx, api, label, 580 + feature * 205, 365, 25, themeColors.muted, 'center'),
      );
      text(ctx, api, 'key · vector', 275, 365, 25, themeColors.muted, 'right');
      text(ctx, api, 'running sum', 1605, 365, 25, themeColors.muted, 'center');
      model.keys.forEach((key, row) => {
        const y = 410 + row * 145;
        text(
          ctx,
          api,
          `${key.token} · [${key.vector.join(', ')}]`,
          285,
          y + 36,
          24,
          row === 1 ? themeColors.yellow : themeColors.pink,
          'right',
        );
        api.focus.target('component-products', () =>
          key.products.forEach(({ featureIndex, queryValue, keyValue, product }) => {
            if (featureIndex >= model.completedFeatures) return;
            const active = featureIndex === model.completedFeatures - 1;
            api.components.card({
              label: `${queryValue} × ${keyValue} = ${product}`,
              x: 475 + featureIndex * 205,
              y,
              width: 194,
              height: 76,
              fill: themeColors.panel,
              stroke: active ? themeColors.yellow : themeColors.muted,
              textColor: themeColors.ink,
              fontSize: 27,
              padding: 7,
            });
          }),
        );
        const sum = model.partialSums[row];
        api.focus.target('running-score', () =>
          api.components.card({
            label: `Σ = ${sum}`,
            x: 1480,
            y,
            width: 250,
            height: 76,
            fill: themeColors.panel,
            stroke: model.completedFeatures === 4 ? themeColors.yellow : themeColors.muted,
            textColor: model.completedFeatures === 4 ? themeColors.yellow : themeColors.ink,
            fontSize: 26,
            padding: 8,
          }),
        );
      });
      text(
        ctx,
        api,
        'Sum the four products to score a query against one key.',
        960,
        885,
        27,
        themeColors.ink,
        'center',
      );
      api.focus.target('attention-shape', () =>
        equation(
          ctx,
          api,
          String.raw`s_{migrate,key}=\sum_{d=0}^{3} q_d k_d`,
          960,
          965,
          38,
          themeColors.cyan,
          'center',
        ),
      );
    } else {
      text(
        ctx,
        api,
        'Sentence 0',
        960,
        280,
        34,
        themeColors.blue,
        'center',
      );
      drawScoreMatrix(ctx, api, 650, 425, 205, 105, model.matrixCells, 'pair-scores');
      text(
        ctx,
        api,
        'first snippet · query positions by key positions',
        1065,
        805,
        26,
        themeColors.muted,
        'center',
      );
      target(ctx, api, 'running-score', () => {
        text(ctx, api, 'migrate totals', 1540, 370, 25, themeColors.yellow, 'center');
        model.keys.forEach((key, i) => {
          const arrival = clamp(rowProgress * 3 - i);
          const moving = arrival > 0 && arrival < 1;
          card(
            ctx,
            api,
            key.token + ' · ' + key.score,
            1400,
            425 + i * 110,
            320,
            moving ? themeColors.yellow : themeColors.muted,
          );
          if (moving) {
            const sourceY = 467 + i * 110;
            const tip = 847 + i * 205;
            api.arrow(ctx, 1390, sourceY, tip, 578, themeColors.yellow, 4);
            api.line(
              ctx,
              1390,
              sourceY,
              api.lerp(1390, tip, arrival),
              api.lerp(sourceY, 578, arrival),
              themeColors.yellow,
              8,
            );
          }
        });
      });
      const shapeCue = state.cues?.['pair-grid-shape-b3-2'];
      if (model.completedMatrixCells === 9 && shapeCue?.phase !== 'before') outputShape(ctx, api);
      caption(ctx, api, 'Identity projections  ·  unscaled scores');
    }
  }
}
export default {
  id: 'attention',
  draw: drawAttention,
  cues: [
    'query-migrate-b1-1',
    'query-products-b2-1',
    'query-running-sum-b2-2',
    'migrate-score-row-b3-1',
    'fill-other-query-rows',
    'make-room-for-sentence',
    'score-second-sentence',
    'inspect-migrate-keys',
    'pair-grid-shape-b3-2',
    'swap-key-axes',
  ],
};
