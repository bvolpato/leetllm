import assert from 'node:assert/strict';
import { fadeIn, indicate, lagged, morph, rect, smoother, text } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut } from '../defaults.mjs';
import { NUMBER, DIGITS, GROUPS, NUMBER_B, LEARNED_CUTS } from '../model.mjs';

/** A number can be cut many ways. */
export function buildNumbers(stage, narration, { clearAtEnd }) {
  const numbers = narration.scene('numbers');
  sceneHeading(stage, numbers, narration.title('numbers'));
  {
    // Two numbers in aligned digit columns. The digits never move. Only the cuts change.
    const CELL = 176,
      ROW_YS = [-130, 60],
      DIGIT_SIZE = 120,
      BOX_H = 164;
    const columnX = (i) => (i - (NUMBER.length - 1) / 2) * CELL;
    const VALUES = [NUMBER, NUMBER_B];
    assert.equal(NUMBER.length, NUMBER_B.length);
    const digits = VALUES.map((value, r) =>
      [...value].map((ch, i) =>
        text(ch, {
          font: 'mono',
          size: DIGIT_SIZE,
          color: ch === NUMBER[i] ? 'ink' : 'yellow',
        })
          .at(columnX(i), ROW_YS[r])
          .zIndex(3),
      ),
    );
    const columns = [...NUMBER].map((_, i) =>
      rect(CELL - 14, ROW_YS[1] - ROW_YS[0] + BOX_H + 30, {
        radius: 16,
        fill: 'surface',
        stroke: null,
      }).at(columnX(i), (ROW_YS[0] + ROW_YS[1]) / 2),
    );
    const boxesFor = (r, pieces, color) => {
      let start = 0;
      return pieces.map((piece) => {
        const first = start,
          last = start + piece.length - 1;
        start += piece.length;
        return rect((last - first + 1) * CELL - 22, BOX_H, {
          radius: 14,
          fill: 'surface',
          stroke: color,
          width: 4,
        })
          .at((columnX(first) + columnX(last)) / 2, ROW_YS[r])
          .zIndex(1);
      });
    };
    const title = (content, color) =>
      text(content, {
        font: 'text-serif',
        size: 72,
        color,
      }).at(0, -330);
    const learnedTitle = title('Learned merges (made up here)', 'blue'),
      singleTitle = title('Split into single digits', 'teal'),
      groupTitle = title('Group up to three at a time', 'teal');
    const learnedBoxes = [
      boxesFor(0, LEARNED_CUTS[0], 'blue'),
      boxesFor(1, LEARNED_CUTS[1], 'red'),
    ];
    const singleBoxes = [boxesFor(0, DIGITS, 'teal'), boxesFor(1, [...NUMBER_B], 'teal')];
    const groupBoxes = [
      boxesFor(0, GROUPS, 'teal'),
      boxesFor(1, NUMBER_B.match(/\d{1,3}/g), 'teal'),
    ];
    const similarNote = text('Similar numbers can get different cuts', {
      font: 'text-serif',
      size: 72,
      color: 'red',
    }).at(0, 240);
    const columnsNote = text('Every column stays visible', {
      font: 'text-serif',
      size: 72,
      color: 'teal',
    }).at(0, 240);
    const chunkNote = text('At most three digits land in one chunk', {
      font: 'text-serif',
      size: 72,
      color: 'teal',
    }).at(0, 240);
    const readNote = text('Read the actual pattern, and look at the actual cuts', {
      size: 56,
      color: 'green',
    }).at(0, 345);
    numbers.at(0.1, () =>
      stage.play(fadeIn([...columns, ...digits.flat()]), {
        duration: 0.35,
      }),
    );
    const sweepColumns = (color) =>
      lagged(
        digits[0].map((node, i) =>
          indicate([node, digits[1][i]], {
            color,
            scale: 1.14,
          }),
        ),
        {
          lag: 0.12,
        },
      );
    numbers.on('visible', () =>
      stage.play(sweepColumns('yellow'), {
        duration: 1.2,
      }),
    );
    numbers.on('learned', () =>
      stage.play(
        fadeIn(learnedTitle, {
          shift: [0, 10],
        }),
        lagged(
          learnedBoxes[0].map((node) =>
            fadeIn(node, {
              scale: 0.92,
            }),
          ),
          {
            lag: 0.2,
          },
        ),
        {
          duration: 0.7,
        },
      ),
    );
    numbers.on('differ', () =>
      stage.play(
        lagged(
          learnedBoxes[1].map((node) =>
            fadeIn(node, {
              scale: 0.92,
            }),
          ),
          {
            lag: 0.2,
          },
        ),
        fadeIn(similarNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.7,
        },
      ),
    );
    numbers.on('single', () =>
      stage.play(
        brief(fadeOut([learnedTitle, similarNote]), 0.18, 0, LINEAR),
        brief(fadeIn(singleTitle), 0.3, 0.18),
        morph(learnedBoxes[0], singleBoxes[0]),
        morph(learnedBoxes[1], singleBoxes[1]),
        {
          duration: 0.8,
          ease: smoother,
        },
      ),
    );
    numbers.on('columns', () =>
      stage.play(
        fadeIn(columnsNote, {
          shift: [0, 8],
        }),
        sweepColumns('teal'),
        {
          duration: 1.1,
        },
      ),
    );
    numbers.on('groups', () =>
      stage.play(
        brief(fadeOut([singleTitle, columnsNote]), 0.18, 0, LINEAR),
        brief(fadeIn(groupTitle), 0.3, 0.18),
        brief(
          fadeIn(chunkNote, {
            shift: [0, 8],
          }),
          0.4,
          0.3,
        ),
        morph(singleBoxes[0], groupBoxes[0]),
        morph(singleBoxes[1], groupBoxes[1]),
        {
          duration: 0.8,
          ease: smoother,
        },
      ),
    );
    numbers.on('neither', () =>
      stage.play(indicate(digits.map((row) => row.at(-1)), { color: 'yellow', scale: 1.1 }),
        { duration: 0.85 }),
    );
    numbers.on('read', () =>
      stage.play(
        fadeIn(readNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(numbers, [
      ...columns,
      ...digits.flat(),
      ...groupBoxes.flat(),
      groupTitle,
      chunkNote,
      readNote,
    ]);
  }
}
