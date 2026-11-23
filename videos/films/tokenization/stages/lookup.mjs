import assert from 'node:assert/strict';
import {
  Node,
  arrow,
  draw,
  dot,
  fade,
  fadeIn,
  indicate,
  lagged,
  morph,
  rect,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { chip, row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText, tile, tileRow } from '../defaults.mjs';
import { TABLE, PIECES, IDS_A, IDS_B, FINAL_VECTOR, ROW_SCORES } from '../model.mjs';

/** Each number picks a row. */
export function buildLookup(stage, narration, { clearAtEnd, flash }) {
  const handover = (from, carry, ...into) =>
    stage.play(
      brief(fadeOut(from.filter((node) => !carry.includes(node))), 0.18, 0, LINEAR),
      ...into.map((animation) => brief(animation, 0.4, 0.2)),
      brief(fadeOut(carry), 0.18, 0.6, LINEAR),
    );
  const lookup = narration.scene('lookup');
  sceneHeading(stage, lookup, narration.title('lookup'));
  {
    const TX = -130,
      OX = 400,
      ROW_H = 80,
      TOP = -300,
      TABLE_W = 400,
      rightX = 470;
    const rowY = (i) => TOP + i * ROW_H;
    const rowFrame = (i, x) => {
      const node = new Node();
      node.add(
        text(String(i), {
          font: 'mono',
          size: 46,
          color: 'dim',
        }).moveTo([x - TABLE_W / 2 - 34, rowY(i)]),
        rect(TABLE_W, ROW_H - 10, {
          radius: 8,
          fill: 'surface',
          stroke: 'grid',
          width: 1.5,
        }).at(x, rowY(i)),
      );
      return node;
    };
    const rowValues = (values, i, x) => {
      const node = new Node();
      node.add(
        ...values.map((value, c) =>
          text(value.toFixed(1), {
            font: 'mono',
            size: 40,
          }).moveTo([x - 130 + c * 130, rowY(i)]),
        ),
      );
      return node;
    };
    const inputFrames = TABLE.map((_, i) => rowFrame(i, TX)),
      inputValues = TABLE.map((values, i) => rowValues(values, i, TX));
    // While the tables are tied, the output table shows the same values. They part at "separate".
    const outputFrames = TABLE.map((_, i) => rowFrame(i, OX)),
      outputValues = TABLE.map((values, i) => rowValues(values, i, OX));
    const SEPARATE_TABLE = TABLE.map((values) => [values[2], values[0], values[1]]);
    const separateValues = SEPARATE_TABLE.map((values, i) => rowValues(values, i, OX));
    const inputTitle = text('Input table', {
      size: 44,
      color: 'dim',
    }).at(TX, TOP - 82);
    const outputTitle = text('Output table', {
      size: 44,
      color: 'dim',
    }).at(OX, TOP - 82);
    const lookupChips = PIECES.map(([piece, id, color], i) => {
      const y = -210 + i * 150;
      const node = chip(piece, {
        w: 230,
        h: 104,
        size: 54,
        font: 'sans',
        color,
      }).at(-770, y);
      const number = text(String(id), {
        font: 'mono',
        size: 84,
        color,
      }).at(-595, y);
      return {
        node,
        number,
        y,
        id,
        color,
        piece,
      };
    });
    const pointer = (entry, target, color = entry.color) =>
      arrow([-545, entry.y], [TX - TABLE_W / 2 - 70, rowY(target)], {
        stroke: color,
        width: 4,
        tip: 20,
        bend: (target - 3) * 6,
      });
    const arrows = lookupChips.map((entry) => pointer(entry, entry.id));
    const lit = (i, color, x = TX) =>
      rect(TABLE_W, ROW_H - 10, {
        radius: 8,
        stroke: color,
        width: 5,
      })
        .at(x, rowY(i))
        .glow(8)
        .zIndex(2);
    const litRows = lookupChips.map((entry) => lit(entry.id, entry.color));
    const bigIds = PIECES.map(([, id, color]) =>
      text(String(id), {
        font: 'mono',
        size: 300,
        color,
      }),
    );
    row(bigIds, 40, 170);
    const vectorsNote = text('4 vectors, one per piece', {
      font: 'text-serif',
      size: 54,
      color: 'yellow',
    }).at(rightX, 130);
    const inventedNote = text('Values invented for this example', {
      size: 46,
      color: 'dim',
    }).at(-500, 360);
    const finalVector = tile(
      `final vector  ${FINAL_VECTOR.map((value) => value.toFixed(1)).join('  ')}`,
      {
        size: 42,
        color: 'yellow',
        h: 92,
      },
    ).at(OX + 80, 360);
    // The final vector scores every row. Each bar is a real dot product of the numbers on screen.
    const SCORE_X = OX + TABLE_W / 2 + 34,
      SCORE_W = 220,
      topScore = Math.max(...ROW_SCORES);
    const scoreHead = leftText('score', SCORE_X, TOP - 68, {
      size: 44,
      color: 'yellow',
    });
    const scoreBars = ROW_SCORES.map((value, i) =>
      rect((value / topScore) * SCORE_W, ROW_H - 26, {
        radius: 5,
        fill: value === topScore ? 'yellow' : 'dim',
        stroke: null,
      })
        .moveTo([0, rowY(i)])
        .alignTo([SCORE_X, 0], 'left'),
    );
    const outputLit = lit(5, 'teal', OX);
    const tiedNote = text('Tied: both ends share one set of rows', {
      size: 50,
      color: 'teal',
    }).at(0, 448);
    const separateNote = text('Separate: each row number must mean the same piece in both', {
      size: 50,
      color: 'yellow',
    }).at(0, 448);
    const tableNote = text('A table of\nlearned vectors', {
      font: 'text-serif',
      size: 76,
      color: 'teal',
      leading: 1.15,
    }).at(rightX, -60);
    const meaningNote = text('The number means nothing\nby itself.\nThe row holds the meaning.', {
      font: 'text-serif',
      size: 54,
      color: 'teal',
      leading: 1.2,
    }).at(rightX, -90);
    lookup.at(0.15, () =>
      stage.play(
        lagged(
          bigIds.map((node) =>
            fadeIn(node, {
              shift: [0, 16],
            }),
          ),
          {
            lag: 0.15,
          },
        ),
        {
          duration: 0.35,
        },
      ),
    );
    lookup.on('table', () => {
      stage.play(
        lagged(
          lookupChips.map((entry) =>
            fadeIn(entry.node, {
              shift: [-16, 0],
            }),
          ),
          {
            lag: 0.2,
          },
        ),
        ...lookupChips.map((entry, i) => morph(bigIds[i], entry.number)),
        {
          duration: 0.8,
        },
      );
      stage.play(
        fadeIn(inputTitle),
        fadeIn(tableNote),
        fadeIn(inventedNote),
        lagged(
          inputFrames.map((node, i) =>
            fadeIn([node, inputValues[i]], {
              shift: [16, 0],
            }),
          ),
          {
            lag: 0.12,
          },
        ),
        {
          duration: 0.8,
        },
      );
    });
    lookup.on('pick-two', () =>
      stage.play(draw(arrows[0]), fadeIn(litRows[0]), {
        duration: 0.6,
      }),
    );
    lookup.on('pick-five', () =>
      stage.play(draw(arrows[1]), fadeIn(litRows[1]), {
        duration: 0.6,
      }),
    );
    lookup.on('lives-in-row', () =>
      stage.play(
        brief(fadeOut(tableNote), 0.18, 0, LINEAR),
        brief(fadeIn(meaningNote), 0.3, 0.18),
        draw(arrows[2]),
        fadeIn(litRows[2]),
        draw(arrows[3]),
        fadeIn(litRows[3]),
        {
          duration: 0.9,
        },
      ),
    );
    lookup.on('four-vectors', () =>
      stage.play(
        fadeIn(vectorsNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    lookup.on('second', () =>
      stage.play(
        brief(fadeOut([vectorsNote, meaningNote]), 0.18, 0, LINEAR),
        fadeIn(outputTitle),
        lagged(
          outputFrames.map((node, i) =>
            fadeIn([node, outputValues[i]], {
              shift: [16, 0],
            }),
          ),
          {
            lag: 0.08,
          },
        ),
        {
          duration: 0.8,
        },
      ),
    );
    lookup.on('scores', () =>
      stage.play(
        fadeIn(finalVector, {
          shift: [0, 10],
        }),
        fadeIn(scoreHead),
        lagged(
          scoreBars.map((node) =>
            fadeIn(node, {
              shift: [-20, 0],
            }),
          ),
          {
            lag: 0.12,
          },
        ),
        {
          duration: 1.2,
        },
      ),
    );
    lookup.on('tied', () =>
      stage.play(
        brief(fadeOut([scoreHead, ...scoreBars]), 0.3),
        fadeIn(tiedNote, {
          shift: [0, 10],
        }),
        lagged(
          outputFrames.map((node, i) =>
            indicate([inputValues[i], outputValues[i]], {
              color: 'teal',
              scale: 1.03,
            }),
          ),
          {
            lag: 0.08,
          },
        ),
        {
          duration: 1,
        },
      ),
    );
    lookup.on('separate', () =>
      stage.play(
        brief(fadeOut(tiedNote), 0.18, 0, LINEAR),
        brief(fadeIn(separateNote), 0.3, 0.18),
        brief(fadeOut(outputValues), 0.2, 0, LINEAR),
        brief(
          lagged(
            separateValues.map((node) => fadeIn(node)),
            {
              lag: 0.15,
            },
          ),
          0.6,
          0.22,
        ),
        brief(fadeIn(outputLit), 0.4, 0.5),
      ),
    );

    // A replacement tokenizer swaps two IDs: ·soft gets 5, and ·falls gets 1.
    const falls = lookupChips[1],
      soft = lookupChips[2];
    assert.equal(IDS_B[falls.piece], 1);
    assert.equal(IDS_B[soft.piece], 5);
    const softFive = text(String(IDS_B[soft.piece]), {
      font: 'mono',
      size: 84,
      color: 'red',
    }).at(soft.number.center);
    const fallsOne = text(String(IDS_B[falls.piece]), {
      font: 'mono',
      size: 84,
      color: 'red',
    }).at(falls.number.center);
    const fallsArrow = pointer(falls, IDS_B[falls.piece]).opacity(0.3),
      fallsRow = lit(IDS_B[falls.piece], falls.color).opacity(0.3);
    const wrongArrow = pointer(soft, IDS_B[soft.piece], 'red');
    const wrongRow = lit(IDS_B[soft.piece], 'red');
    const learnedFor = text('learned\nfor ·falls', {
      size: 44,
      color: 'red',
      leading: 1.12,
    })
      .at(200, rowY(5))
      .zIndex(4);
    const swapNote = text('New tokenizer:\n·soft = 5,  ·falls = 1', {
      font: 'mono',
      size: 56,
      color: 'red',
      leading: 1.25,
    }).at(rightX + 60, -60);
    const wrongNote = text('No error. Just the wrong row.', {
      font: 'text-serif',
      size: 66,
      color: 'red',
    }).at(0, 432);
    lookup.on('swap', () => {
      stage.play(
        brief(
          fadeOut([
            separateNote,
            finalVector,
            outputLit,
            ...outputFrames,
            ...separateValues,
            outputTitle,
          ]),
          0.35,
        ),
        fade(arrows[0], 0.25),
        fade(arrows[3], 0.25),
        fade(litRows[0], 0.25),
        fade(litRows[3], 0.25),
        {
          duration: 0.4,
        },
      );
      stage.play(
        morph(soft.number, softFive),
        morph(falls.number, fallsOne),
        brief(fadeOut([arrows[1], arrows[2], litRows[2]]), 0.4),
        fadeIn(fallsArrow),
        fadeIn(fallsRow),
        fadeIn(swapNote),
        {
          duration: 0.6,
        },
      );
    });
    lookup.on('wrong-row', () =>
      stage.play(draw(wrongArrow), morph(litRows[1], wrongRow), fadeIn(learnedFor), {
        duration: 0.9,
      }),
    );
    lookup.on('nothing-crashes', () =>
      stage.play(
        fadeIn(wrongNote, {
          shift: [0, 10],
        }),
        indicate(wrongRow, {
          color: 'red',
          scale: 1.02,
        }),
        {
          duration: 0.8,
        },
      ),
    );
    const allLookup = [
      ...lookupChips.map((entry) => entry.node),
      lookupChips[0].number,
      lookupChips[3].number,
      softFive,
      fallsOne,
      swapNote,
      inventedNote,
      ...inputFrames,
      ...inputValues,
      inputTitle,
      arrows[0],
      arrows[3],
      fallsArrow,
      fallsRow,
      wrongArrow,
      litRows[0],
      litRows[3],
      wrongRow,
      learnedFor,
      wrongNote,
    ];

    // Both tokenizers read the same text against the model's unchanged learned rows.
    const COMPARE_X = 480;
    const compareTable = [...inputFrames, ...inputValues, inputTitle];
    const compareContext = allLookup.filter((node) => !compareTable.includes(node));
    const learnedPieces = new Map(PIECES.map(([piece, id]) => [id, piece]));
    learnedPieces.set(7, '<end>');
    const rowNames = [...learnedPieces].map(([id, piece]) =>
      leftText(piece, COMPARE_X + TABLE_W / 2 + 26, rowY(id), {
        font: 'mono',
        size: 34,
        color: 'dim',
      }),
    );
    const tableOwner = text('Model trained with A', {
      size: 44,
      color: 'teal',
    }).at(COMPARE_X, TOP - 68);
    const sizeNote = text(`Vocabulary size: ${TABLE.length} in both`, {
      size: 50,
      color: 'yellow',
    }).at(-510, -350);
    const madeUpTokenizers = text('Illustrative tokenizers and invented vectors', {
      size: 36,
      color: 'dim',
    }).at(0, 460);
    const sameTextNote = text('Same text: ·softly', {
      font: 'text-serif',
      size: 64,
      color: 'yellow',
    }).at(-510, -245);
    const encoder = (name, id, y, color, resultColor = color) => ({
      name: text(name, { size: 44, color }).at(-760, y - 84),
      piece: tile('·soft', { size: 58, color, h: 100, min: 300 }).at(-690, y),
      id: text(String(id), { font: 'mono', size: 98, color: resultColor }).at(-370, y),
      intoId: arrow([-515, y], [-440, y], { stroke: resultColor, width: 4, tip: 18 }),
      route: arrow([-290, y], [COMPARE_X - TABLE_W / 2 - 70, rowY(id)], {
        stroke: resultColor,
        width: 5,
        tip: 22,
      }),
      row: lit(id, resultColor, COMPARE_X),
    });
    const encoderA = encoder('Tokenizer A', IDS_A['·soft'], -90, 'blue');
    const encoderB = encoder('Tokenizer B', IDS_B['·soft'], 115, 'yellow', 'red');
    const encodingMarker = dot(9, 'yellow').at(-515, 115);
    const encoders = [encoderA, encoderB];
    const suffixNote = text('ly → 6 in both', {
      font: 'mono',
      size: 42,
      color: 'dim',
    }).at(-620, 270);
    const mismatch = text('·soft reads the row learned for ·falls', {
      font: 'text-serif',
      size: 54,
      color: 'red',
    }).at(0, 395);
    const otherIds = ['rain', '·falls'].map((piece) => ({
      piece,
      a: IDS_A[piece],
      b: IDS_B[piece],
    }));
    assert.deepEqual(
      otherIds.map(({ a, b }) => a === b),
      [true, false],
    );
    assert.equal(IDS_A['·soft'], 1);
    assert.equal(learnedPieces.get(IDS_B['·soft']), '·falls');
    const fixedString = text(
      `rain falls:  A [${otherIds.map(({ a }) => a).join(' ')}]   B [${otherIds.map(({ b }) => b).join(' ')}]`,
      { font: 'mono', size: 38, color: 'ink' },
    ).at(-470, 315);
    const specialToken = text('<end> → 7 in both', {
      font: 'mono',
      size: 44,
      color: 'green',
    }).at(-535, 235);
    const specialArrow = arrow([-220, 235], [COMPARE_X - TABLE_W / 2 - 70, rowY(7)], {
      stroke: 'green',
      width: 4,
      tip: 20,
    });
    const specialRow = lit(7, 'green', COMPARE_X);
    const testNote = text('Compare IDs, including special tokens', {
      font: 'text-serif',
      size: 54,
      color: 'green',
    }).at(0, 395);
    lookup.on('size', () => {
      stage.play(
        brief(fadeOut([...compareContext, inputTitle]), 0.2, 0, LINEAR),
        ...[...inputFrames, ...inputValues].map((node) =>
          brief(
            to(node, (item) => item.shift(COMPARE_X - TX, 0)),
            0.7,
            0.2,
            smoother,
          ),
        ),
        brief(fadeIn([sizeNote, madeUpTokenizers, tableOwner, ...rowNames]), 0.4, 0.75),
      );
    });
    lookup.on('same-text', () =>
      stage.play(
        fadeIn([
          sameTextNote,
          suffixNote,
          ...encoders.flatMap((entry) => [entry.name, entry.piece]),
          encoderA.id,
          encoderA.intoId,
          encoderA.route,
          encoderA.row,
        ]),
        { duration: 0.5 },
      ),
    );
    lookup.on('different-ids', () =>
      stage.play(
        fadeIn(encodingMarker),
        to(encodingMarker, (node) => node.at(-400, 115)),
        {
          duration: lookup.span('different-ids'),
          ease: smoother,
        },
      ),
    );
    lookup.after('different-ids', () => {
      stage.play(
        brief(fadeOut(encodingMarker), 0.12, 0, LINEAR),
        brief(fadeIn([encoderB.id, encoderB.intoId]), 0.3, 0.12),
        brief(draw(encoderB.route), 0.65, 0.12),
      );
      stage.play(fadeIn([encoderB.row, mismatch]), { duration: 0.3 });
    });
    lookup.on('special', () =>
      stage.play(
        brief(fadeOut([suffixNote, mismatch]), 0.18, 0, LINEAR),
        brief(fadeIn([specialToken, fixedString]), 0.4, 0.2),
        brief(draw(specialArrow), 0.65, 0.2),
        brief(fadeIn(specialRow), 0.3, 0.85),
      ),
    );
    lookup.on('compare', () => stage.play(fadeIn(testNote), { duration: 0.4 }));
    const compareParts = [
      ...inputFrames,
      ...inputValues,
      ...rowNames,
      tableOwner,
      sizeNote,
      madeUpTokenizers,
      sameTextNote,
      specialToken,
      fixedString,
      specialArrow,
      specialRow,
      testNote,
      encodingMarker,
      ...encoders.flatMap((entry) => Object.values(entry)),
    ];

    // Renumbering: both ends have to move. The vectors keep the piece they were trained for.
    const MIG_YS = {
      one: -60,
      five: 80,
    };
    const migPanel = (x, title) => {
      const head = text(title, {
        font: 'text-serif',
        size: 62,
      }).at(x, -184);
      const ones = leftText('row 1', x - 380, MIG_YS.one, {
          font: 'mono',
          size: 50,
          color: 'dim',
        }),
        fives = leftText('row 5', x - 380, MIG_YS.five, {
          font: 'mono',
          size: 50,
          color: 'dim',
        });
      const softVector = chip('learned for ·soft', {
        w: 490,
        h: 110,
        size: 44,
        font: 'sans',
        color: 'purple',
      }).at(x + 90, MIG_YS.one);
      const fallsVector = chip('learned for ·falls', {
        w: 490,
        h: 110,
        size: 44,
        font: 'sans',
        color: 'teal',
      }).at(x + 90, MIG_YS.five);
      const softMoved = chip('learned for ·soft', {
        w: 490,
        h: 110,
        size: 44,
        font: 'sans',
        color: 'purple',
      }).at(x + 90, MIG_YS.five);
      return {
        head,
        labels: [ones, fives],
        softVector,
        fallsVector,
        softMoved,
        x,
      };
    };
    const inputMig = migPanel(-460, 'Input table'),
      outputMig = migPanel(460, 'Output table');
    const renumberNote = text('New IDs:  ·falls = 1,  ·soft = 5', {
      font: 'mono',
      size: 58,
      color: 'yellow',
    }).at(0, -290);
    // One chip steps out, the other takes its row, and the first steps back in. They never cross.
    const swapRows = (panel) => [
      brief(fadeOut(panel.softVector), 0.18, 0, LINEAR),
      brief(
        to(panel.fallsVector, (node) => node.at(panel.x + 90, MIG_YS.one)),
        0.45,
        0.18,
        smoother,
      ),
      brief(fadeIn(panel.softMoved), 0.25, 0.55),
    ];
    const inputOk = text('reads correctly', {
      size: 54,
      color: 'green',
    }).at(inputMig.x, 185);
    const outputStale = text('still in the old order', {
      size: 54,
      color: 'red',
    }).at(outputMig.x, 185);
    const outputFixed = text('moved too', {
      size: 54,
      color: 'green',
    }).at(outputMig.x, 185);
    const decodeWrong = text("The model's choices decode as the wrong pieces", {
      font: 'text-serif',
      size: 66,
      color: 'red',
    }).at(0, 310);
    const togetherNote = text('Move everything together', {
      font: 'text-serif',
      size: 66,
      color: 'green',
    }).at(0, 310);
    const migParts = [inputMig, outputMig].flatMap((panel) => [
      panel.head,
      ...panel.labels,
      panel.softVector,
      panel.fallsVector,
    ]);
    const migEnd = [inputMig, outputMig].flatMap((panel) => [
      panel.head,
      ...panel.labels,
      panel.softMoved,
      panel.fallsVector,
    ]);
    const compareCarry = [
      specialToken,
      specialArrow,
      specialRow,
      inputFrames[7],
      inputValues[7],
      rowNames.at(-1),
    ];
    lookup.onBeat(5, () => handover(compareParts, compareCarry, fadeIn(migParts)));
    lookup.on('renumber', () =>
      stage.play(
        fadeIn(renumberNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    lookup.on('input-ok', () =>
      stage.play(...swapRows(inputMig), brief(fadeIn(inputOk), 0.4, 0.4), {
        duration: 0.8,
        ease: smoother,
      }),
    );
    lookup.on('output-stale', () =>
      stage.play(
        fadeIn(outputStale),
        flash(outputMig.fallsVector, {
          color: 'red',
          scale: 1.08,
        }),
        {
          duration: 0.6,
        },
      ),
    );
    lookup.on('decode-wrong', () =>
      stage.play(
        fadeIn(decodeWrong, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    // The failure sentence leaves as the fix lands.
    lookup.on('together', () =>
      stage.play(
        brief(fadeOut(decodeWrong), 0.18, 0, LINEAR),
        brief(fadeIn(togetherNote), 0.3, 0.18),
        ...swapRows(outputMig),
        brief(fadeOut(outputStale), 0.18, 0, LINEAR),
        brief(fadeIn(outputFixed), 0.4, 0.4),
        {
          duration: 0.8,
          ease: smoother,
        },
      ),
    );

    // New cuts mean inputs the model never trained on. These two cuts are made up.
    const differentNote = text('New cuts: inputs the model never trained on', {
      font: 'text-serif',
      size: 72,
      color: 'red',
    }).at(0, -240);
    const cutRows = [
      ['old cuts', ['·soft', 'ly'], 'blue', -100],
      ['new cuts, made up', ['·so', 'ft', 'ly'], 'red', 30],
    ].map(([name, pieces, color, y]) => [
      leftText(name, -700, y, {
        size: 54,
        color: 'dim',
      }),
      ...tileRow(pieces, y, {
        size: 72,
        color,
        x: 340,
        gap: 14,
        h: 110,
      }),
    ]);
    const bundle = new Node();
    bundle.add(
      rect(1400, 230, {
        radius: 26,
        stroke: 'green',
        width: 5,
        fill: 'surface',
      }),
      chip('model', {
        w: 600,
        h: 150,
        size: 96,
        font: 'sans',
        color: 'blue',
      }).at(-340, 0),
      chip('tokenizer', {
        w: 600,
        h: 150,
        size: 96,
        font: 'sans',
        color: 'yellow',
      }).at(340, 0),
    );
    bundle.at(0, 230).zIndex(6);
    const hashNote2 = text('Pinned together by hash', {
      font: 'mono',
      size: 68,
      color: 'green',
    }).at(0, 410);
    lookup.on('differently', () => {
      handover(
        [...migEnd, renumberNote, inputOk, outputFixed, togetherNote],
        [inputMig.labels[1], inputMig.softMoved],
        fadeIn(differentNote, {
          shift: [0, 10],
        }),
        fadeIn(cutRows[0], {
          shift: [0, 10],
        }),
      );
      stage.play(fadeIn(cutRows[1], { shift: [0, 10] }), { duration: 0.4 });
    });
    lookup.on('ship', () =>
      stage.play(
        fadeIn(bundle, {
          scale: 0.92,
        }),
        {
          duration: 0.5,
        },
      ),
    );
    lookup.on('hash', () =>
      stage.play(
        fadeIn(hashNote2, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(lookup, [differentNote, ...cutRows.flat(), bundle, hashNote2]);
  }
}
