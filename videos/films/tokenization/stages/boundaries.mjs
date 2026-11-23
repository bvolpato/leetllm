import assert from 'node:assert/strict';
import { Node, draw, fadeIn, line, morph, rect, smoother, text, to } from 'vizmatic/stage';
import { row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText, part } from '../defaults.mjs';
import { WHOLE, CHUNKS, SPAN_TEXT, SPAN_PATTERN, SPANS, spanClass } from '../model.mjs';

/** Boundaries decide which merges can happen. */
export function buildBoundaries(stage, narration, { clearAtEnd, handover, nudge }) {
  const boundaries = narration.scene('boundaries');
  sceneHeading(stage, boundaries, narration.title('boundaries'));
  {
    // Word and punctuation glue. The letters keep their shapes, and only the boxes merge.
    const GLUE_Y = -10,
      GLUE_SIZE = 96,
      ADVANCE = GLUE_SIZE * 0.6;
    const gluePair = (word, mark, center) => {
      const left = part(word, center - 65, GLUE_Y, {
          size: GLUE_SIZE,
          color: 'blue',
        }),
        right = part(mark, center + 210, GLUE_Y, {
          size: GLUE_SIZE,
          color: 'pink',
          min: 100,
        });
      const width = (word.length + mark.length) * ADVANCE;
      const box = rect(width + 44, GLUE_SIZE * 1.7, {
        radius: 12,
        fill: 'surface',
        stroke: 'red',
        width: 2.5,
      }).at(center, GLUE_Y);
      const glue = [
        morph([left.box, right.box], box),
        to(left.caption, (node) =>
          node.at(center - width / 2 + (word.length * ADVANCE) / 2, GLUE_Y).color('red'),
        ),
        to(right.caption, (node) =>
          node.at(center + width / 2 - (mark.length * ADVANCE) / 2, GLUE_Y).color('red'),
        ),
      ];
      return {
        left,
        right,
        box,
        glue,
      };
    };
    const pairs = [gluePair('failed', '.', -440), gluePair('failed', '!', 440)];
    const entriesNote = text('can become two separate entries', {
      font: 'text-serif',
      size: 80,
      color: 'red',
    }).at(0, 180);
    const authorsNote = text("GPT-2's authors reported this kind of vocabulary waste", {
      size: 50,
      color: 'dim',
    }).at(0, 285);
    const firstPicture = [
      ...pairs.flatMap((pair) => [pair.box, pair.left.caption, pair.right.caption]),
      entriesNote,
      authorsNote,
    ];
    boundaries.at(0.1, () =>
      stage.play(
        fadeIn(
          pairs.flatMap((pair) => [...pair.left.all, ...pair.right.all]),
          {
            shift: [0, 10],
          },
        ),
        {
          duration: 0.35,
        },
      ),
    );
    boundaries.on('glue', () =>
      stage.play(...pairs.flatMap((pair) => pair.glue), {
        duration: 0.9,
        ease: smoother,
      }),
    );
    boundaries.on('entries', () =>
      stage.play(
        fadeIn(entriesNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    boundaries.on('authors', () =>
      stage.play(fadeIn(authorsNote), {
        duration: 0.4,
      }),
    );

    // The pattern, and the same line split in place by it.
    const patternParts = row(
      SPAN_PATTERN.flatMap(([source, color], i) => [
        ...(i
          ? [
              text('|', {
                font: 'mono',
                size: 56,
                color: 'dim',
              }),
            ]
          : []),
        text(source, {
          font: 'mono',
          size: 56,
          color,
        }),
      ]),
      -310,
      26,
    );
    const patternNote = text('A simple pattern, for illustration', {
      size: 44,
      color: 'dim',
    }).at(0, -235);
    const LINE_Y = -40,
      LINE_SIZE = 92,
      LINE_CHAR = LINE_SIZE * 0.6,
      SPAN_GAP = 80;
    const lineLeft = (-SPAN_TEXT.length * LINE_CHAR) / 2;
    const tileWidth = (span) => (span === ' ' ? 84 : span.length * LINE_CHAR + 36);
    const WIDER = 20;
    const spannedTotal = SPANS.reduce(
      (sum, span) => sum + tileWidth(span) + SPAN_GAP,
      -SPAN_GAP + WIDER,
    );
    let offset = 0,
      cursor = -spannedTotal / 2;
    const spanParts = SPANS.map((span, index) => {
      const wholeX = lineLeft + (offset + span.length / 2) * LINE_CHAR,
        width = tileWidth(span),
        x = cursor + width / 2,
        color = spanClass(span);
      offset += span.length;
      cursor += width + SPAN_GAP + (index === SPANS.length - 2 ? WIDER : 0);
      const caption =
        span === ' '
          ? text('·', {
              font: 'mono',
              size: LINE_SIZE,
              color,
            }).at(x, LINE_Y)
          : text(span, {
              font: 'mono',
              size: LINE_SIZE,
              color: 'ink',
            }).at(wholeX, LINE_Y);
      return {
        span,
        x,
        color,
        caption,
        box: rect(width, LINE_SIZE * 1.6, {
          radius: 12,
          fill: 'surface',
          stroke: color,
          width: 2.5,
        }).at(x, LINE_Y),
      };
    });
    spanParts.forEach((part2) => part2.caption.zIndex(3));
    const wordParts = spanParts.filter((part2) => part2.span !== ' '),
      spaceParts = spanParts.filter((part2) => part2.span === ' ');
    const wholeBox = rect(SPAN_TEXT.length * LINE_CHAR + 44, LINE_SIZE * 1.6, {
      radius: 12,
      fill: 'surface',
      stroke: 'dim',
      width: 2.5,
    }).at(0, LINE_Y);
    const legend = [
      ['letters', 0, 'blue', 0],
      ['whitespace', 1, 'dim', -40],
      ['digits', 2, 'yellow', 0],
      ['punctuation', 5, 'pink', 0],
    ].map(([name, i, color, shift]) =>
      text(name, {
        size: 50,
        color,
      }).at(spanParts[i].x + shift, LINE_Y + 120),
    );
    const stopped = spanParts.at(-1),
      lastWord = spanParts.at(-2);
    const edgeX =
      (lastWord.x + tileWidth(lastWord.span) / 2 + stopped.x - tileWidth(stopped.span) / 2) / 2;
    const blockMark = new Node();
    blockMark.add(
      line([edgeX - 15, LINE_Y - 15], [edgeX + 15, LINE_Y + 15], {
        stroke: 'red',
        width: 7,
      }),
      line([edgeX + 15, LINE_Y - 15], [edgeX - 15, LINE_Y + 15], {
        stroke: 'red',
        width: 7,
      }),
    );
    const stayNote = text('Merges stay inside the spans', {
      font: 'text-serif',
      size: 70,
      color: 'red',
    }).at(0, 210);
    const ownNote = text('Each tokenizer has its own pattern, so read yours', {
      size: 52,
      color: 'dim',
    }).at(0, 320);
    const secondPicture = [
      ...patternParts,
      patternNote,
      ...spanParts.flatMap((part2) => [part2.box, part2.caption]),
      ...legend,
      blockMark,
      stayNote,
      ownNote,
    ];
    boundaries.on('regex', () =>
      handover(
        firstPicture,
        fadeIn([...patternParts, patternNote], {
          shift: [0, 10],
        }),
        fadeIn([wholeBox, ...wordParts.map((part2) => part2.caption)]),
      ),
    );
    boundaries.on('separates', () =>
      stage.play(
        brief(fadeOut(wholeBox), 0.3, 0, LINEAR),
        ...wordParts.map((part2) =>
          brief(
            to(part2.caption, (node) => node.at(part2.x, LINE_Y).color(part2.color)),
            0.55,
            0,
            smoother,
          ),
        ),
        brief(fadeIn(spanParts.map((part2) => part2.box)), 0.4, 0.5),
        brief(fadeIn(spaceParts.map((part2) => part2.caption)), 0.4, 0.5),
        brief(fadeIn(legend), 0.4, 0.5),
      ),
    );
    // A merge tries to cross the edge, is stopped, and falls back.
    boundaries.on('spans', () => {
      stage.play(nudge(stopped.box, -16, 0), nudge(stopped.caption, -16, 0), {
        duration: 0.3,
      });
      stage.play(
        fadeIn(blockMark, {
          scale: 1.6,
        }),
        fadeIn(stayNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.3,
        },
      );
      stage.play(nudge(stopped.box, 16, 0), nudge(stopped.caption, 16, 0), {
        duration: 0.3,
      });
    });
    boundaries.on('own-pattern', () =>
      stage.play(fadeIn(ownNote), {
        duration: 0.4,
      }),
    );

    // Cutting a string in two blocks a merge. The second word is physically cut.
    const WHOLE_Y = -30,
      CUT_Y = 190,
      WORD_X = -40,
      WORD_SIZE = 116,
      WORD_CHAR = WORD_SIZE * 0.6,
      WORD_H = 170;
    const wholeHead = leftText('encoded whole', -880, WHOLE_Y, {
      size: 54,
      color: 'dim',
    });
    const wholeTile = part(WHOLE[0], WORD_X, WHOLE_Y, {
      size: WORD_SIZE,
      color: 'yellow',
    });
    const wholeCount = leftText(`${WHOLE.length} token`, 480, WHOLE_Y, {
      font: 'mono',
      size: 76,
      color: 'yellow',
    });
    const cutHead = leftText('cut, then encoded', -880, CUT_Y, {
      size: 54,
      color: 'dim',
    });
    const letterX = (i) => WORD_X + (i - 1.5) * WORD_CHAR;
    const cutLetters = [...WHOLE[0]].map((ch, i) =>
      text(ch, {
        font: 'mono',
        size: WORD_SIZE,
        color: 'red',
      })
        .at(letterX(i), CUT_Y)
        .zIndex(3),
    );
    const pieceBox = (from, to2, shift) =>
      rect((to2 - from + 1) * WORD_CHAR + 30, WORD_H, {
        radius: 12,
        fill: 'surface',
        stroke: 'red',
        width: 2.5,
      }).at((letterX(from) + letterX(to2)) / 2 + shift, CUT_Y);
    const SPLIT = 76,
      RIGHT = 34;
    const oneBox = pieceBox(0, 3, 0),
      halves = [pieceBox(0, 1, -SPLIT), pieceBox(2, 3, SPLIT)],
      thirds = [
        pieceBox(0, 1, -SPLIT),
        pieceBox(2, 2, SPLIT - RIGHT),
        pieceBox(3, 3, SPLIT + RIGHT),
      ];
    assert.deepEqual(CHUNKS.flat(), ['ra', 'i', 'n']);
    const cutMark = line([WORD_X, CUT_Y - WORD_H / 2 - 26], [WORD_X, CUT_Y + WORD_H / 2 + 26], {
      stroke: 'red',
      width: 5,
      dash: [14, 10],
    }).zIndex(4);
    const cutCount = leftText(`${CHUNKS.flat().length} tokens`, 480, CUT_Y, {
      font: 'mono',
      size: 76,
      color: 'red',
    });
    const listNote = text('With our three merges from before', {
      size: 44,
      color: 'dim',
    }).at(0, 340);
    const exactNote = text('Count the exact text you send', {
      font: 'text-serif',
      size: 72,
      color: 'green',
    }).at(0, 410);
    boundaries.on('chunks', () =>
      handover(
        secondPicture,
        fadeIn([wholeHead, ...wholeTile.all, wholeCount], {
          shift: [0, 10],
        }),
        fadeIn(listNote),
      ),
    );
    boundaries.on('blocked', () => {
      stage.play(fadeIn([cutHead, oneBox, ...cutLetters]), {
        duration: 0.3,
      });
      stage.play(draw(cutMark), {
        duration: 0.3,
      });
      stage.play(
        morph(oneBox, halves),
        ...cutLetters.map((node, i) => nudge(node, i < 2 ? -SPLIT : SPLIT, 0)),
        {
          duration: 0.45,
          ease: smoother,
        },
      );
      stage.play(
        morph(halves[1], thirds.slice(1)),
        nudge(cutLetters[2], -RIGHT, 0),
        nudge(cutLetters[3], RIGHT, 0),
        fadeIn(cutCount),
        {
          duration: 0.45,
          ease: smoother,
        },
      );
    });
    boundaries.on('exact', () =>
      stage.play(
        fadeIn(exactNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(boundaries, [
      wholeHead,
      ...wholeTile.all,
      wholeCount,
      cutHead,
      halves[0],
      ...thirds.slice(1),
      ...cutLetters,
      cutMark,
      cutCount,
      listNote,
      exactNote,
    ]);
  }
}
