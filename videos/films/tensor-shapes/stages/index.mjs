import { sentenceWords, sequence0, sequence1 } from '../fixtures.mjs';
import { count } from '../construction.mjs';
import { indexFrame } from '../model.mjs';
import {
  brace,
  caption,
  equation,
  numberGrid,
  target,
  text,
  vertical,
  wordNames,
} from '../defaults.mjs';
export function drawIndex(ctx, scene, state, api) {
  const { C: themeColors } = api;
  const beat = state.beat ?? 0;
  const currentBeat = [0, 1, 1, 2][beat];
  {
    const v = indexFrame({ ...state, beat: currentBeat, beatP: beat === 1 ? 0 : state.beatP });
    if (currentBeat === 0) {
      for (let batch = 0; batch < 2; batch++) {
        const x = 290 + batch * 900,
          color = batch ? themeColors.pink : themeColors.blue;
        text(ctx, api, 'Sentence ' + batch, x + 240, 285, 30, color, 'center');
        wordNames(ctx, api, sentenceWords[batch], x - 25, 350, 90, color);
        numberGrid(
          ctx,
          api,
          batch ? sequence1 : sequence0,
          x,
          350,
          480,
          270,
          color,
          'index-source-' + batch,
          {
            highlights:
              batch === 1 && v.token
                ? [
                    {
                      row: 1,
                      column: 0,
                      fill: themeColors.panel,
                      stroke: themeColors.yellow,
                    },
                    {
                      row: 1,
                      column: 1,
                      fill: themeColors.panel,
                      stroke: themeColors.yellow,
                    },
                    {
                      row: 1,
                      column: 2,
                      fill: themeColors.panel,
                      stroke: themeColors.yellow,
                    },
                    {
                      row: 1,
                      column: 3,
                      fill: themeColors.panel,
                      stroke: themeColors.yellow,
                    },
                  ]
                : [],
          },
        );
      }
      target(ctx, api, 'index-selected-row', () => {
        text(
          ctx,
          api,
          v.token ? 'enjoy  ·  token 1 in sentence 1' : 'x[1, 1, :]',
          960,
          700,
          31,
          themeColors.yellow,
          'center',
        );
      });
      target(ctx, api, 'index-result', () =>
        numberGrid(
          ctx,
          api,
          [v.vector.map((value, i) => (i < v.features ? value : ''))],
          720,
          790,
          480,
          90,
          themeColors.green,
          'index-vector',
        ),
      );
      equation(
        ctx,
        api,
        v.token
          ? String.raw`x[1,1,:]\ :\ (2,3,4)\to(3,4)\to(4,)`
          : v.batch
            ? String.raw`x[1]\ :\ (2,3,4)\to(3,4)`
            : String.raw`x\ :\ (2,3,4)`,
        960,
        955,
        40,
        themeColors.cyan,
      );
      caption(ctx, api, 'Integer indices select and remove axes · the colon retains all features');
    } else if (currentBeat === 1) {
      text(ctx, api, 'Integer token index', 480, 300, 32, themeColors.blue, 'center');
      text(ctx, api, 'One-item token slice', 1440, 300, 32, themeColors.yellow, 'center');
      text(ctx, api, 'x[1, 1:2, :]', 1440, 395, 33, themeColors.ink, 'center');
      target(ctx, api, 'index-result', () => {
        numberGrid(ctx, api, [v.vector], 240, 450, 480, 110, themeColors.blue, 'index-vector-held');
        equation(ctx, api, String.raw`x[1,1,:]\quad(4,)`, 480, 735, 40, themeColors.blue);
      });
      target(ctx, api, 'index-slice', () => {
        numberGrid(
          ctx,
          api,
          [v.vector.map((value, i) => (i < count(4, v.slice) ? value : ''))],
          1200,
          450,
          480,
          110,
          themeColors.yellow,
          'index-slice-values',
        );
        if (v.slice > 0) {
          vertical(ctx, api, 1140, 450, 110, '1 token', themeColors.yellow);
          equation(ctx, api, String.raw`x[1,1:2,:]\quad(1,4)`, 1440, 735, 40, themeColors.yellow);
        } else
          text(ctx, api, 'Predict which axis stays', 1440, 735, 32, themeColors.yellow, 'center');
      });
      caption(
        ctx,
        api,
        v.slice > 0
          ? 'The same selected values · a slice preserves the token slot · a 1-D vector has no row or column orientation'
          : 'Follow the selected token through its remaining axes',
      );
    } else {
      text(ctx, api, 'Middle word from each sentence', 960, 300, 34, themeColors.cyan, 'center');
      text(ctx, api, 'migrate · sentence 0', 650, 460, 28, themeColors.blue, 'right');
      text(ctx, api, 'enjoy · sentence 1', 650, 610, 28, themeColors.pink, 'right');
      target(ctx, api, 'index-all-middle', () => {
        numberGrid(
          ctx,
          api,
          v.bothValues.map((row, r) =>
            row.map((value, d) => (r * 4 + d < count(8, v.both) ? value : '')),
          ),
          720,
          360,
          640,
          300,
          themeColors.cyan,
          'all-middle-values',
        );
        equation(
          ctx,
          api,
          String.raw`x[:,1,:]\quad\operatorname{shape}=(2,4)`,
          960,
          850,
          44,
          themeColors.cyan,
        );
        brace(ctx, api, 720, 710, 640, String.raw`D=4`, themeColors.yellow);
      });
      caption(
        ctx,
        api,
        'The batch colon keeps both sentences · the token integer removes the token axis',
      );
    }
  }
}
export default {
  id: 'index',
  draw: drawIndex,
  cues: [
    'choose-index-batch',
    'choose-index-token',
    'retain-index-features',
    'keep-singleton-token',
    'keep-both-sentences',
  ],
};
