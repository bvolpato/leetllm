import assert from 'node:assert/strict';
import { fade, fadeIn, indicate, lagged, morph, rect, text, to } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { applyRules, HISTORY, RULES, ORDER_A, ORDER_B } from '../model.mjs';
import { leftText, tileRow } from '../defaults.mjs';

/** Encoding replays the list, even on new words. */
export function buildUnseen(stage, narration, { clearAtEnd, handover }, { recipeLines }) {
  const unseen = narration.scene('unseen');
  sceneHeading(stage, unseen, narration.title('unseen'));
  const WORD = 'rainly',
    replayWords = [
      {
        pieces: [...WORD],
      },
      {
        pieces: ['ra', ...'inly'],
      },
      {
        pieces: ['rai', ...'nly'],
      },
      {
        pieces: ['rain', ...'ly'],
      },
    ];
  assert.deepEqual(replayWords[3].pieces, applyRules(WORD, RULES));
  const big = 130,
    newLayout = (word) => {
      let cursor = 0;
      const pieces = word.pieces.map((piece, index) => {
        const width = piece.length * big + 28;
        const entry = {
          x: cursor + width / 2,
          width,
          text: piece,
          index,
        };
        cursor += width + 22;
        return entry;
      });
      const total = cursor - 22;
      const letters = [];
      for (const piece of pieces) {
        piece.x -= total / 2;
        for (let i = 0; i < piece.text.length; i++)
          letters.push(piece.x - piece.width / 2 + 14 + big * (i + 0.5));
      }
      return {
        pieces,
        letters,
      };
    };
  const NEW_Y = -270;
  const stages = replayWords.map(newLayout);
  const newLetters = [...WORD].map((ch, i) =>
    text(ch, {
      font: 'mono',
      size: 120,
    })
      .at(stages[0].letters[i], NEW_Y)
      .zIndex(3),
  );
  const stageBoxes = stages.map((stage) =>
    stage.pieces.map((piece) =>
      rect(piece.width, 170, {
        radius: 16,
        fill: 'surface',
        stroke: piece.text.length > 1 ? 'yellow' : 'blue',
        width: 3,
      }).at(piece.x, NEW_Y),
    ),
  );
  const replay = (step) => {
    const anims = [];
    stages[step + 1].pieces.forEach((piece, k) => {
      const from =
        piece.text.length > 1 && k === 0
          ? [0, 1].map((i) => stageBoxes[step][i])
          : [stageBoxes[step][k + 1]];
      anims.push(morph(from, stageBoxes[step + 1][k]));
    });
    stages[step + 1].letters.forEach((x, i) =>
      anims.push(to(newLetters[i], (node) => node.at(x, NEW_Y))),
    );
    return anims;
  };
  // The list stays lit from the last scene, then each rule fires on the new word in turn.
  // The word waits, dim, until the voice names it.
  [...stageBoxes[0], ...newLetters].forEach((node) => node.opacity(0));
  unseen.at(0.1, () =>
    stage.play(...[...stageBoxes[0], ...newLetters].map((node) => fade(node, 0.55)), {
      duration: 0.4,
    }),
  );
  unseen.on('rainly', () =>
    stage.play(...[...stageBoxes[0], ...newLetters].map((node) => fade(node, 1)), {
      duration: 0.6,
    }),
  );
  unseen.on('replay-1', () =>
    stage.play(
      ...replay(0),
      indicate(recipeLines[0], {
        color: 'ink',
        scale: 1.06,
      }),
      {
        duration: 0.55,
      },
    ),
  );
  unseen.on('replay-2', () =>
    stage.play(
      ...replay(1),
      indicate(recipeLines[1], {
        color: 'ink',
        scale: 1.06,
      }),
      {
        duration: 0.55,
      },
    ),
  );
  unseen.on('replay-3', () =>
    stage.play(
      ...replay(2),
      indicate(recipeLines[2], {
        color: 'ink',
        scale: 1.06,
      }),
      {
        duration: 0.55,
      },
    ),
  );
  const leftoverNote = text('l and y were never merged', {
    size: 58,
    color: 'teal',
  }).at(0, NEW_Y + 136);
  unseen.on('leftovers', () =>
    stage.play(
      fadeIn(leftoverNote, {
        shift: [0, -12],
      }),
    ),
  );
  const NOTE_X = 80;
  const noCount = leftText('No counting. Only replay.', NOTE_X, -40, {
    font: 'text-serif',
    size: 66,
    color: 'yellow',
  });
  const replayRows = [
    ['rainy', 'rainy-result'],
    ['rail', 'rail-result'],
  ].map(([word], i) =>
    leftText(`${word}  →  ${applyRules(word, RULES).join(' + ')}`, NOTE_X, 60 + i * 78, {
      font: 'mono',
      size: 60,
    }),
  );
  // r + a and a + i tied in training. The list has r + a. The other choice is shown as made up.
  const orderHead = leftText('The tie from before,\ndecided the other way', 40, -30, {
    font: 'text-serif',
    size: 56,
    color: 'yellow',
    leading: 1.12,
    align: 'left',
  });
  const orderRows = [
    ['r + a first', ORDER_A],
    ['a + i first, made up', ORDER_B],
  ].map(([name, pieces], i) => {
    const y = 95 + i * 112;
    return [
      leftText(name, 40, y, {
        font: 'mono',
        size: 42,
        color: i ? 'yellow' : 'ink',
      }),
      ...tileRow(pieces, y, {
        size: 56,
        color: i ? 'yellow' : 'blue',
        x: 745,
        gap: 12,
        h: 96,
      }),
    ];
  });
  assert.deepEqual(
    HISTORY[1].ranked.slice(0, 2).map((entry) => [entry.pair, entry.count]),
    [
      ['r a', 7],
      ['a i', 7],
    ],
  );
  const inventedNote = leftText('A new piece has no trained row', 40, 320, {
    size: 52,
    color: 'red',
  });
  unseen.on('no-count', () =>
    stage.play(
      fadeIn(noCount, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  unseen.on('rainy-result', () =>
    stage.play(
      fadeIn(replayRows[0], {
        shift: [-12, 0],
      }),
      {
        duration: 0.4,
      },
    ),
  );
  unseen.on('rail-result', () =>
    stage.play(
      fadeIn(replayRows[1], {
        shift: [-12, 0],
      }),
      {
        duration: 0.4,
      },
    ),
  );
  unseen.on('order', () =>
    handover(
      [leftoverNote, noCount, ...replayRows],
      fadeIn(orderHead),
      lagged(
        orderRows.map((entry) =>
          fadeIn(entry, {
            shift: [-12, 0],
          }),
        ),
        {
          lag: 0.5,
        },
      ),
    ),
  );
  unseen.on('no-row', () =>
    stage.play(
      fadeIn(inventedNote, {
        shift: [0, 10],
      }),
      {
        duration: 0.5,
      },
    ),
  );
  clearAtEnd(unseen, [
    ...stageBoxes[3],
    ...newLetters,
    orderHead,
    ...orderRows.flat(),
    inventedNote,
    ...recipeLines,
  ]);
}
