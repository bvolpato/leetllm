import assert from 'node:assert/strict';
import { fadeIn, indicate, lagged, morph, recolor, rect, smoother, text } from 'vizmatic/stage';
import { chip, row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText, tile } from '../defaults.mjs';
import { wordpiece, close, SNOW } from '../model.mjs';

/** Your turn. */
export function buildYourTurn(stage, narration, { clearAtEnd, handover, nudge }) {
  const turn = narration.scene('your-turn');
  sceneHeading(stage, turn, narration.title('your-turn'));
  {
    // The corpus as tiles. In the first answer, the pair glues the way it did in the lesson.
    const SNOW_CORPUS = [
      ['snow', 4],
      ['snowy', 2],
      ['show', 3],
    ];
    const CELL = 104,
      TILE_X = -640,
      ROW_YS = [-180, -40, 100],
      START_SHIFT = 400;
    const merged = `${SNOW[1].merged.left}${SNOW[1].merged.right}`;
    assert.equal(merged, 'ow');
    const snowRows = SNOW_CORPUS.map(([word, times], i) => {
      const y = ROW_YS[i];
      const letters = [...word].map((ch, k) =>
        text(ch, {
          font: 'mono',
          size: 76,
          color: 'blue',
        })
          .at(TILE_X + START_SHIFT + k * CELL, y)
          .zIndex(3),
      );
      const boxes = [...word].map((_, k) =>
        rect(CELL - 12, 120, {
          radius: 10,
          fill: 'surface',
          stroke: 'blue',
          width: 2.5,
        }).at(TILE_X + START_SHIFT + k * CELL, y),
      );
      const at = word.indexOf(merged);
      const glued = rect(2 * CELL - 12, 120, {
        radius: 10,
        fill: 'surface',
        stroke: 'yellow',
        width: 4,
      }).at(TILE_X + (at + 0.5) * CELL, y);
      return {
        times: leftText(`× ${times}`, -860 + START_SHIFT, y, {
          font: 'mono',
          size: 66,
          color: 'yellow',
        }),
        letters,
        boxes,
        at,
        glued,
      };
    });
    const ANSWER_X = 0;
    const questionA = leftText('How many positions?', ANSWER_X, -200, {
      font: 'text-serif',
      size: 70,
      color: 'yellow',
    });
    const questionB = leftText('Which pair merges first?', ANSWER_X, -100, {
      font: 'text-serif',
      size: 70,
      color: 'yellow',
    });
    const answerA = leftText(`${SNOW[0].positions} positions`, ANSWER_X, 20, {
      font: 'mono',
      size: 76,
    });
    const answerB = leftText(
      `${SNOW[1].merged.left} + ${SNOW[1].merged.right} appears ${SNOW[1].merged.count} times`,
      ANSWER_X,
      120,
      {
        font: 'mono',
        size: 62,
        color: 'yellow',
      },
    );
    const answerC = leftText(
      `${SNOW[0].positions} − ${SNOW[1].merged.count} = ${SNOW[1].positions} positions`,
      ANSWER_X,
      220,
      {
        font: 'mono',
        size: 62,
        color: 'green',
      },
    );
    const firstShared = snowRows.flatMap((row2) => [row2.times, ...row2.letters]);
    turn.at(0.1, () =>
      stage.play(
        fadeIn([...firstShared, ...snowRows.flatMap((row2) => row2.boxes)], {
          shift: [0, 8],
        }),
        {
          duration: 0.35,
        },
      ),
    );
    turn.on('corpus', () =>
      stage.play(
        lagged(
          snowRows.map((entry) =>
            indicate(entry.times, {
              color: 'ink',
              scale: 1.1,
            }),
          ),
          {
            lag: 0.5,
          },
        ),
        {
          duration: 1,
        },
      ),
    );
    turn.on('question', () =>
      stage.play(
        ...snowRows
          .flatMap((row2) => [row2.times, ...row2.letters, ...row2.boxes])
          .map((node) => nudge(node, -START_SHIFT, 0)),
        brief(
          fadeIn([questionA, questionB], {
            shift: [0, 8],
          }),
          0.5,
          0.5,
        ),
        {
          duration: 0.7,
          ease: smoother,
        },
      ),
    );
    turn.after('thirty-eight', () =>
      stage.play(
        fadeIn(answerA, {
          shift: [0, 8],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    turn.after('ow', () =>
      stage.play(
        fadeIn(answerB, {
          shift: [0, 8],
        }),
        ...snowRows.map((entry) => morph(entry.boxes.slice(entry.at, entry.at + 2), entry.glued)),
        {
          duration: 0.7,
          ease: smoother,
        },
      ),
    );
    turn.after('twenty-nine', () =>
      stage.play(
        fadeIn(answerC, {
          shift: [0, 8],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    const panelOne = [
      ...firstShared,
      ...snowRows.flatMap((row2) => [
        ...row2.boxes.filter((_, k) => k < row2.at || k > row2.at + 1),
        row2.glued,
      ]),
      questionA,
      questionB,
      answerA,
      answerB,
      answerC,
    ];

    // The trap again, on new letters.
    const SNOW_WORD = 'snowball',
      SNOW_VOCAB = ['snow', '##ball', 'snowb'];
    const snowPass = wordpiece(SNOW_WORD, SNOW_VOCAB);
    assert.deepEqual(snowPass.pieces, ['[UNK]']);
    assert.deepEqual(
      snowPass.attempts.slice(-3).map((entry) => entry.candidate),
      ['##all', '##al', '##a'],
    );
    const WORD_Y = 0,
      SNOW_CELL = 112,
      SNOW_X = -820;
    const snowCell = (i) => SNOW_X + i * SNOW_CELL;
    const snowLetters = [...SNOW_WORD].map((ch, i) =>
      chip(ch, {
        w: SNOW_CELL - 28,
        h: 130,
        size: 80,
        color: 'blue',
      }).at(snowCell(i), WORD_Y),
    );
    const snowVocabChips = row(
      SNOW_VOCAB.map((piece) =>
        tile(piece, {
          size: 60,
          color: 'teal',
          h: 110,
        }),
      ),
      WORD_Y,
      14,
      520,
    );
    const snowQuestion = text('What happens to snowball?', {
      font: 'text-serif',
      size: 80,
      color: 'yellow',
    }).at(0, 150);
    const snowRange = rect(5 * SNOW_CELL - 12, 156, {
      radius: 14,
      stroke: 'yellow',
      width: 6,
    })
      .at((snowCell(0) + snowCell(4)) / 2, WORD_Y)
      .zIndex(2);
    const snowRest = rect(3 * SNOW_CELL - 12, 156, {
      radius: 14,
      stroke: 'red',
      width: 6,
    })
      .at((snowCell(5) + snowCell(7)) / 2, WORD_Y)
      .zIndex(2);
    const snowFail = text('nothing matches ##all, ##al, or ##a', {
      font: 'mono',
      size: 60,
      color: 'red',
    }).at(0, 260);
    const snowUnk = chip(snowPass.pieces[0], {
      w: 800,
      h: 150,
      size: 96,
      color: 'red',
    }).at(0, 395);
    const panelTwo = [
      ...snowLetters,
      ...snowVocabChips,
      snowQuestion,
      snowRange,
      snowRest,
      snowFail,
      snowUnk,
    ];
    turn.on('vocab', () =>
      handover(
        panelOne,
        fadeIn(snowLetters, {
          shift: [0, 8],
        }),
        lagged(
          snowVocabChips.map((node) =>
            fadeIn(node, {
              scale: 0.9,
            }),
          ),
          {
            lag: 0.2,
          },
        ),
      ),
    );
    turn.on('question-wp', () =>
      stage.play(fadeIn(snowQuestion), {
        duration: 0.4,
      }),
    );
    turn.after('longest', () =>
      stage.play(fadeIn(snowRange), {
        duration: 0.4,
      }),
    );
    turn.after('no-finish', () =>
      stage.play(fadeIn(snowRest), fadeIn(snowFail), {
        duration: 0.4,
      }),
    );
    turn.after('unknown', () =>
      stage.play(
        fadeIn(snowUnk, {
          scale: 0.92,
        }),
        {
          duration: 0.5,
        },
      ),
    );

    // The numbers stay on screen through the pause, so the problem can be worked from the screen.
    const ALONE = 0.25,
      SNOW_ONLY = 0.4,
      MARKED = 0.05,
      SNOW_PRODUCT = ALONE * SNOW_ONLY;
    close(SNOW_PRODUCT, 0.1);
    assert(SNOW_PRODUCT > MARKED);
    const dec = (value) => value.toFixed(2).replace(/^0/, '');
    const PATH_LEFT = -700,
      PATH_SIZE = 84,
      PATH_YS = [10, 150],
      VALUE_X = -40;
    const pathA = leftText('▁snow', PATH_LEFT, PATH_YS[0], {
      font: 'mono',
      size: PATH_SIZE,
    });
    const valueA = leftText(dec(MARKED), VALUE_X, PATH_YS[0], {
      font: 'mono',
      size: PATH_SIZE,
    });
    const pathB = leftText('▁ + snow', PATH_LEFT, PATH_YS[1], {
      font: 'mono',
      size: PATH_SIZE,
    });
    const product = leftText(`${dec(ALONE)} × ${dec(SNOW_ONLY)}`, VALUE_X, PATH_YS[1], {
      font: 'mono',
      size: PATH_SIZE,
    });
    const askEquals = leftText('= ?', VALUE_X + 520, PATH_YS[1], {
      font: 'mono',
      size: PATH_SIZE,
      color: 'yellow',
    });
    const answerEquals = leftText(`= ${dec(SNOW_PRODUCT)}`, VALUE_X + 520, PATH_YS[1], {
      font: 'mono',
      size: PATH_SIZE,
      color: 'ink',
    });
    const unigramQ = text('Which path wins?', {
      font: 'text-serif',
      size: 80,
      color: 'yellow',
    }).at(0, 290);
    const turnRing = rect(1560, 140, {
      radius: 14,
      stroke: 'green',
      width: 5,
    })
      .at(40, PATH_YS[1])
      .zIndex(2);
    const fewerNote = text(
      "The path with fewer pieces lost:\nonly the complete path's score counts",
      {
        font: 'text-serif',
        size: 66,
        color: 'yellow',
        leading: 1.15,
      },
    ).at(0, 335);
    turn.on('marker', () =>
      handover(
        panelTwo,
        fadeIn([pathA, valueA], {
          shift: [-10, 0],
        }),
      ),
    );
    turn.on('alone', () =>
      stage.play(
        fadeIn([pathB, product, askEquals], {
          shift: [-10, 0],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    turn.on('question-u', () =>
      stage.play(fadeIn(unigramQ), {
        duration: 0.4,
      }),
    );
    turn.on('product-result', () =>
      stage.play(indicate(product, { color: 'yellow', scale: 1.02 }), { duration: 0.4 }),
    );
    turn.after('product', () =>
      stage.play(
        brief(fadeOut([unigramQ, askEquals]), 0.18, 0, LINEAR),
        brief(fadeIn(answerEquals), 0.3, 0.18),
      ),
    );
    turn.after('comparison', () =>
      stage.play(fadeIn(turnRing), recolor(answerEquals, 'green'), {
        duration: 0.4,
      }),
    );
    turn.on('fewer', () =>
      stage.play(
        fadeIn(fewerNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(turn, [pathA, valueA, pathB, product, answerEquals, turnRing, fewerNote]);
  }
}
