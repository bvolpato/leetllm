import {
  bias,
  rightSquare,
  sentenceWords,
  squareInput,
  tokenOffsets,
  sequence0,
  sequence1,
  tensor,
  tokenShifted,
  wrongSquare,
} from '../fixtures.mjs';
import { complete, count, event } from '../construction.mjs';
import { broadcastFrame } from '../model.mjs';
import { caption, card, equation, numberGrid, target, text, wordNames } from '../defaults.mjs';
export function drawBroadcast(ctx, scene, state, api) {
  const { C: themeColors } = api,
    currentBeat = state.beat ?? 0;
  {
    const v = broadcastFrame(state);
    if (currentBeat === 0) {
      text(ctx, api, 'Original values', 450, 270, 31, themeColors.blue, 'center');
      text(ctx, api, 'Feature offsets', 1480, 225, 29, themeColors.yellow, 'center');
      target(ctx, api, 'feature-bias', () =>
        numberGrid(ctx, api, [bias], 1240, 250, 500, 76, themeColors.yellow, 'feature-bias-cells'),
      );
      target(ctx, api, 'broadcast-output', () => {
        for (let batch = 0; batch < 2; batch++) {
          const y = 380 + batch * 270,
            rows = batch ? sequence1 : sequence0,
            color = batch ? themeColors.pink : themeColors.blue;
          wordNames(ctx, api, sentenceWords[batch], 175, y, 70, color);
          numberGrid(ctx, api, rows, 200, y, 500, 210, color, 'broadcast-source-' + batch);
          numberGrid(
            ctx,
            api,
            v.shifted[batch].map((row, t) =>
              row.map((value, d) => (v.placed.includes(batch * 12 + t * 4 + d) ? value : '')),
            ),
            1240,
            y,
            500,
            210,
            themeColors.green,
            'broadcast-result-' + batch,
          );
        }
        if (v.active !== null) {
          const value = tensor[v.active],
            d = v.active % 4,
            batch = Math.floor(v.active / 12),
            t = Math.floor((v.active % 12) / 4);
          equation(ctx, api, String.raw`${value}+${bias[d]}`, 960, 520, 43, themeColors.yellow);
          text(
            ctx,
            api,
            sentenceWords[batch][t] + ' · feature ' + d,
            960,
            590,
            25,
            themeColors.muted,
            'center',
          );
          const x = 1240 + (d + 0.5) * 125,
            y = 380 + batch * 270 + (t + 0.5) * 70;
          api.rect(ctx, x - 56, y - 29, 112, 58, 'transparent', themeColors.yellow, 3);
        } else {
          text(ctx, api, 'Matching feature offsets', 960, 545, 27, themeColors.green, 'center');
          text(ctx, api, 'Every word in both sentences', 960, 590, 27, themeColors.green, 'center');
        }
      });
      equation(
        ctx,
        api,
        String.raw`(2,3,4)+(4,)\longrightarrow(2,3,4)`,
        960,
        960,
        41,
        themeColors.cyan,
      );
      caption(ctx, api, 'Four feature offsets serve all six words.');
    } else if (currentBeat === 1) {
      const repair = v.repair,
        done = complete(repair),
        x = [500, 960, 1420];
      target(ctx, api, 'broadcast-alignment', () => {
        ['Batch', 'Token', 'Feature'].forEach((label, i) =>
          text(
            ctx,
            api,
            label,
            x[i],
            290,
            30,
            [themeColors.blue, themeColors.cyan, themeColors.yellow][i],
            'center',
          ),
        );
        [2, 3, 4].forEach((value, i) =>
          card(ctx, api, String(value), x[i] - 100, 350, 200, themeColors.blue),
        );
        text(ctx, api, 'x', 230, 405, 33, themeColors.blue, 'center');
        text(
          ctx,
          api,
          done ? 'token offsets (3,1)' : 'bare token offsets (3,)',
          960,
          540,
          31,
          done ? themeColors.green : v.reject > 0 ? themeColors.pink : themeColors.blue,
          'center',
        );
        card(ctx, api, '1', x[0] - 100, 605, 200, themeColors.muted);
        const movingX = api.lerp(x[2], x[1], repair);
        card(
          ctx,
          api,
          '3',
          movingX - 100,
          605,
          200,
          done ? themeColors.green : v.reject > 0 ? themeColors.pink : themeColors.blue,
        );
        if (repair > 0.65) card(ctx, api, '1', x[2] - 100, 605, 200, themeColors.green);
        else if (repair === 0) card(ctx, api, '1', x[1] - 100, 605, 200, themeColors.muted);
        if (complete(v.reject) && repair === 0)
          text(ctx, api, '3 does not match 4', 1420, 770, 31, themeColors.pink, 'center');
        if (done)
          text(
            ctx,
            api,
            'Equal sizes or a singleton match',
            960,
            770,
            31,
            themeColors.green,
            'center',
          );
      });
      target(ctx, api, 'token-offset-example', () => {
        if (done) {
          text(
            ctx,
            api,
            'Birds gets +10 across its features',
            960,
            850,
            29,
            themeColors.green,
            'center',
          );
          numberGrid(
            ctx,
            api,
            [tokenShifted[0][0]],
            710,
            880,
            500,
            72,
            themeColors.green,
            'token-offset-values',
          );
        } else
          text(
            ctx,
            api,
            'Wanted: one offset per word position',
            960,
            900,
            30,
            themeColors.yellow,
            'center',
          );
      });
      caption(
        ctx,
        api,
        done ? 'The trailing one expands across features.' : 'Align the shapes at the right edge.',
      );
    } else {
      drawSquare(ctx, api, state);
    }
  }
}
export default {
  id: 'broadcast',
  draw: drawBroadcast,
  cues: [
    'add-feature-offsets',
    'align-broadcast-dimensions',
    'reject-token-vector',
    'insert-feature-singleton',
    'predict-square-broadcast',
    'deal-square-offsets',
    'resolve-square-broadcast',
    'finish-square-rows',
  ],
};

function drawSquare(ctx, api, state) {
  const { C } = api;
  const deal = event(state, 3, 'deal-square-offsets');
  const compare = event(state, 3, 'resolve-square-broadcast');
  const rest = event(state, 3, 'finish-square-rows');
  const cells = count(2, deal) + count(7, rest);
  const checked = complete(compare);
  target(ctx, api, 'square-broadcast', () => {
    text(ctx, api, 'One offset per word', 960, 257, 36, C.ink, 'center');
    text(ctx, api, 'Birds +10       migrate +20       south +30', 960, 320, 32, C.yellow, 'center');
    for (const [lane, result] of [wrongSquare, rightSquare].entries()) {
      const x = 318 + 855 * lane;
      const width = 468,
        rowHeight = 92,
        y = 500;
      const color = checked ? (lane === 0 ? C.pink : C.green) : C.blue;
      text(
        ctx,
        api,
        lane === 0 ? 'square + offsets' : 'square + offsets[:, None]',
        x + width / 2,
        417,
        33,
        C.ink,
        'center',
      );
      wordNames(ctx, api, sentenceWords[0], x - 26, y, rowHeight, C.muted);
      const rows = squareInput.map((row, t) =>
        row.map((value, d) => (t * 3 + d < cells ? result[t][d] : value)),
      );
      const active = cells === 2 && rest === 0 ? 1 : Math.min(8, cells);
      const r = Math.floor(active / 3),
        d = active % 3;
      const highlights = [];
      for (let i = 0; i < 9; i++) {
        const here = i === active && deal > 0 && cells < 9;
        if (here || i < cells)
          highlights.push({
            row: Math.floor(i / 3),
            column: i % 3,
            fill: C.panel,
            stroke: here ? C.yellow : C.cyan,
          });
      }
      numberGrid(ctx, api, rows, x, y, width, rowHeight * 3, color, 'square-lane-' + lane, {
        highlights,
        fontSize: 38,
      });
      if (deal > 0 && cells < 9) {
        const offset = tokenOffsets[lane === 0 ? d : r];
        if (lane === 0) {
          text(ctx, api, '+' + offset, x + ((d + 0.5) * width) / 3, y - 21, 30, C.yellow, 'center');
        } else {
          text(
            ctx,
            api,
            '+' + offset,
            x + width + 25,
            y + (r + 0.5) * rowHeight + 11,
            30,
            C.yellow,
          );
        }
      }
      if (checked) {
        text(
          ctx,
          api,
          lane === 0 ? '1 + 20 = ' + result[0][1] : '1 + 10 = ' + result[0][1],
          x + width / 2,
          863,
          39,
          color,
          'center',
        );
      }
    }
    caption(
      ctx,
      api,
      checked
        ? 'Birds needs the same offset for every feature.'
        : 'First sentence, first three features  ·  both results have shape (3, 3)',
    );
  });
}
