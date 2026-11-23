import assert from 'node:assert/strict';
import {
  arrow,
  draw,
  fade,
  fadeIn,
  indicate,
  lagged,
  line,
  morph,
  rect,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, glyphNode, leftText, tile } from '../defaults.mjs';

/** SentencePiece: raw sentences, visible spaces. */
export function buildSentencepiece(
  stage,
  narration,
  { clearAtEnd, HOME, openOn, handover, nudge },
) {
  const space = narration.scene('sentencepiece');
  sceneHeading(stage, space, narration.title('sentencepiece'));
  openOn(space, HOME);
  {
    // A short opening: what the name covers.
    const kitName = text('SentencePiece', {
      font: 'text-serif',
      size: 170,
    }).at(0, 10);
    const kitNote = text('a toolkit, not a single algorithm', {
      size: 62,
      color: 'dim',
    }).at(0, 140);
    const kitChips = row(
      ['BPE', 'Unigram', 'decoding', 'normalization'].map((name, i) =>
        tile(name, {
          font: 'sans',
          size: 66,
          color: i < 2 ? 'yellow' : 'teal',
          h: 120,
        }),
      ),
      270,
      30,
    );
    const kitParts = [kitName, kitNote, ...kitChips];
    space.at(0.1, () =>
      stage.play(fadeIn(kitName), {
        duration: 0.35,
      }),
    );
    space.on('toolkit', () =>
      stage.play(fadeIn(kitNote), {
        duration: 0.5,
      }),
    );
    space.on('train', () =>
      stage.play(
        lagged(
          kitChips.slice(0, 2).map((node) =>
            fadeIn(node, {
              scale: 0.9,
            }),
          ),
          {
            lag: 0.2,
          },
        ),
        {
          duration: 0.5,
        },
      ),
    );
    space.on('packages', () =>
      stage.play(
        lagged(
          kitChips.slice(2).map((node) =>
            fadeIn(node, {
              scale: 0.9,
            }),
          ),
          {
            lag: 0.2,
          },
        ),
        {
          duration: 0.5,
        },
      ),
    );

    // A whitespace split works on one text and finds nothing to cut in the other.
    const SPLIT_Y = -40,
      LEFT_X = -470,
      RIGHT_X = 470;
    const spacedWords = ['rain', 'falls'].map((word, i) =>
      text(word, {
        font: 'mono',
        size: 110,
        color: 'blue',
      }).at(LEFT_X + (i ? 180 : -200), SPLIT_Y),
    );
    const spacedCut = line([LEFT_X - 28, SPLIT_Y - 90], [LEFT_X - 28, SPLIT_Y + 90], {
      stroke: 'yellow',
      width: 6,
    });
    const spacedNote = text('Whitespace splits this', {
      size: 52,
      color: 'dim',
    }).at(LEFT_X, SPLIT_Y + 130);
    const JP = '日本語の世界';
    const jpGlyphs = [...JP].map((ch, i) =>
      glyphNode(ch, 110).at(RIGHT_X + (i - (JP.length - 1) / 2) * 124, SPLIT_Y),
    );
    const SCAN_L = RIGHT_X - 3 * 124,
      SCAN_R = RIGHT_X + 3 * 124;
    const scan = line([SCAN_L, SPLIT_Y - 90], [SCAN_L, SPLIT_Y + 90], {
      stroke: 'red',
      width: 6,
    });
    const jpNote = text('No spaces to split on', {
      size: 52,
      color: 'red',
    }).at(RIGHT_X, SPLIT_Y + 130);
    const segmenter = tile('a language specific segmenter', {
      font: 'sans',
      size: 58,
      color: 'yellow',
      h: 120,
    }).at(0, 230);
    const segmenterNote = text('one more tool to run, per language', {
      size: 50,
      color: 'dim',
    }).at(0, 335);
    const splitParts = [
      ...spacedWords,
      spacedCut,
      spacedNote,
      ...jpGlyphs,
      scan,
      jpNote,
      segmenter,
      segmenterNote,
    ];
    space.on('split-first', () =>
      handover(
        kitParts,
        fadeIn(spacedWords),
        draw(spacedCut),
        fadeIn(spacedNote),
        fadeIn(jpGlyphs),
      ),
    );
    space.on('no-spaces', () => {
      stage.play(fadeIn(jpNote), fadeIn(scan), {
        duration: 0.5,
      });
      stage.play(
        to(scan, (node) => node.at(node.get('x') + (SCAN_R - SCAN_L), node.get('y'))),
        {
          duration: 1.6,
          ease: smoother,
        },
      );
    });
    space.on('segmenter', () =>
      stage.play(
        fadeIn(segmenter, {
          shift: [0, 12],
        }),
        fadeIn(segmenterNote),
        {
          duration: 0.5,
        },
      ),
    );

    // Raw sentences, with the boundaries its default trainer still keeps.
    const rawNote = text('Trains from raw sentences', {
      font: 'text-serif',
      size: 96,
      color: 'green',
    }).at(0, -220);
    // One raw string first. Only at the default rule does it split at the boundaries it keeps.
    const SAMPLE_Y = 30;
    const RAW_PARTS = [
      ['rain', -240, -535, 340, 'blue'],
      ['関数', 60, -75, 280, 'teal'],
      ['x', 210, 275, 110, 'blue'],
      ['42', 300, 605, 200, 'yellow'],
    ];
    const sample = RAW_PARTS.map(([content, rawX, x, width, color]) => ({
      shift: x - rawX,
      box: rect(width, 170, {
        radius: 14,
        fill: 'surface',
        stroke: color,
        width: 2.5,
      }).at(x, SAMPLE_Y),
      glyphs:
        content === '関数'
          ? [...content].map((ch, i) =>
              glyphNode(ch, 100, color)
                .at(rawX + (i ? 60 : -60), SAMPLE_Y)
                .zIndex(3),
            )
          : [
              text(content, {
                font: 'mono',
                size: 100,
                color,
              })
                .at(rawX, SAMPLE_Y)
                .zIndex(3),
            ],
    }));
    const rawBox = rect(790, 170, {
      radius: 14,
      fill: 'surface',
      stroke: 'dim',
      width: 2.5,
    }).at(0, SAMPLE_Y);
    const edges = [
      ['whitespace', -300],
      ['script', 130],
      ['number', 435],
    ].map(([name, x]) => [
      line([x, SAMPLE_Y - 115], [x, SAMPLE_Y + 115], {
        stroke: 'red',
        width: 5,
      }),
      text(name, {
        size: 48,
        color: 'red',
      }).at(x, SAMPLE_Y + 160),
    ]);
    const defaultNote = text('By default, pieces stay inside these boundaries', {
      size: 56,
      color: 'dim',
    }).at(0, 320);
    const sampleGlyphs = sample.flatMap((entry) => entry.glyphs);
    const rawParts = [
      rawNote,
      ...sample.map((entry) => entry.box),
      ...sampleGlyphs,
      ...edges.flat(),
      defaultNote,
    ];
    space.on('raw', () =>
      handover(
        splitParts,
        fadeIn(rawNote, {
          shift: [0, 12],
        }),
        fadeIn([rawBox, ...sampleGlyphs]),
      ),
    );
    space.on('default', () =>
      stage.play(
        morph(
          rawBox,
          sample.map((entry) => entry.box),
        ),
        ...sample.flatMap((entry) => entry.glyphs.map((node) => nudge(node, entry.shift, 0))),
        brief(
          lagged(
            edges.map((entry) => fadeIn(entry)),
            {
              lag: 0.4,
            },
          ),
          0.6,
          0.5,
        ),
        brief(fadeIn(defaultNote), 0.4, 0.5),
        {
          duration: 0.8,
          ease: smoother,
        },
      ),
    );

    // One line of text. The space becomes a marker, the marker travels with the next piece, and
    // decoding runs back over the same objects.
    const LINE_Y = -90,
      SIZE = 150,
      CHAR_W = SIZE * 0.6,
      GAP = 70,
      MARKER = '▁',
      RAW_TEXT = 'rain falls';
    const markedPieces = RAW_TEXT.split(' ').map((word) => MARKER + word),
      joined = markedPieces.join('');
    const dropped = joined.slice(MARKER.length),
      spacedBack = dropped.replaceAll(MARKER, ' ');
    assert.equal(spacedBack, RAW_TEXT);
    const widthOf = (chars) => chars * CHAR_W;
    // Each layout lists where rain, falls, the first marker, and the second marker sit.
    const LAYOUT = {
      plain: {
        left: -widthOf(10) / 2,
        rain: 0,
        falls: 5,
      },
      marked: {
        left: -widthOf(11) / 2,
        first: 0,
        rain: 1,
        second: 5,
        falls: 6,
      },
    };
    const atChars = (layout, start, chars) => LAYOUT[layout].left + (start + chars / 2) * CHAR_W;
    const plainRainX = atChars('plain', 0, 4),
      plainFallsX = atChars('plain', 5, 5),
      plainGapX = atChars('plain', 4, 1);
    const rainWord = text('rain', {
      font: 'mono',
      size: SIZE,
    })
      .at(plainRainX, LINE_Y)
      .zIndex(3);
    const fallsWord = text('falls', {
      font: 'mono',
      size: SIZE,
    })
      .at(plainFallsX, LINE_Y)
      .zIndex(3);
    const gapMark = rect(CHAR_W - 14, 170, {
      radius: 14,
      fill: 'yellow',
      stroke: null,
    })
      .opacity(0.28)
      .at(plainGapX, LINE_Y);
    const firstMark = text(MARKER, {
      font: 'mono',
      size: SIZE,
      color: 'yellow',
    })
      .at(atChars('marked', 0, 1), LINE_Y)
      .zIndex(3);
    const secondMark = text(MARKER, {
      font: 'mono',
      size: SIZE,
      color: 'yellow',
    })
      .at(plainGapX, LINE_Y)
      .zIndex(3);
    const pieceSpan = (start, chars, shift) =>
      rect(widthOf(chars) + 34, 220, {
        radius: 16,
        fill: 'surface',
        stroke: 'yellow',
        width: 4,
      }).at(atChars('marked', start, chars) + shift, LINE_Y);
    const boxes = [pieceSpan(0, 5, -GAP / 2), pieceSpan(5, 6, GAP / 2)];
    const joinedBox = rect(widthOf(11) + 34, 220, {
      radius: 16,
      fill: 'surface',
      stroke: 'yellow',
      width: 4,
    }).at(0, LINE_Y);
    const stepNote = (content, color = 'dim') =>
      text(content, {
        size: 62,
        color,
      }).at(0, 170);
    const markerNote = stepNote('Each space becomes a marker');
    const oneMoreNote = stepNote('By default, one more at the start');
    const pieceNote = stepNote('The marker travels with the next piece', 'yellow');
    const stepChips = row(
      ['join', 'drop the first', 'markers to spaces'].map((name) =>
        tile(name, {
          font: 'sans',
          size: 60,
          color: 'teal',
          h: 110,
        }),
      ),
      170,
      30,
    );
    const CHIP_DIM = 0.55;
    stepChips.forEach((node) => node.opacity(0));
    space.on('visible', () => handover(rawParts, fadeIn([rainWord, fallsWord]), fadeIn(gapMark)));
    space.on('to-marker', () =>
      stage.play(
        brief(fadeOut(gapMark), 0.3),
        brief(
          fadeIn(secondMark, {
            shift: [0, -40],
          }),
          0.5,
          0.1,
        ),
        fadeIn(markerNote),
        {
          duration: 0.6,
        },
      ),
    );
    space.on('one-more', () =>
      stage.play(
        to(rainWord, (node) => node.at(atChars('marked', 1, 4), LINE_Y)),
        to(secondMark, (node) => node.at(atChars('marked', 5, 1), LINE_Y)),
        to(fallsWord, (node) => node.at(atChars('marked', 6, 5), LINE_Y)),
        brief(
          fadeIn(firstMark, {
            shift: [0, -50],
          }),
          0.5,
          0.5,
        ),
        brief(fadeOut(markerNote), 0.18, 0, LINEAR),
        brief(fadeIn(oneMoreNote), 0.3, 0.18),
        {
          duration: 0.8,
          ease: smoother,
        },
      ),
    );
    const shiftMarks = [
      [firstMark, rainWord, -GAP / 2],
      [secondMark, fallsWord, GAP / 2],
    ];
    space.on('example', () =>
      stage.play(
        ...shiftMarks.flatMap(([mark, word, shift]) => [
          nudge(mark, shift, 0),
          nudge(word, shift, 0),
        ]),
        fadeIn(boxes),
        brief(fadeOut(oneMoreNote), 0.18, 0, LINEAR),
        brief(fadeIn(pieceNote), 0.3, 0.18),
        {
          duration: 0.7,
          ease: smoother,
        },
      ),
    );
    space.on('decode-1', () =>
      stage.play(
        ...shiftMarks.flatMap(([mark, word, shift]) => [
          nudge(mark, -shift, 0),
          nudge(word, -shift, 0),
        ]),
        morph(boxes, joinedBox),
        brief(fadeOut(pieceNote), 0.18, 0, LINEAR),
        brief(fade(stepChips[0], 1), 0.3, 0.18),
        ...stepChips.slice(1).map((node) => brief(fade(node, CHIP_DIM), 0.3, 0.18)),
        {
          duration: 0.6,
          ease: smoother,
        },
      ),
    );
    const plainBox = rect(widthOf(10) + 34, 220, {
      radius: 16,
      fill: 'surface',
      stroke: 'yellow',
      width: 4,
    }).at(0, LINE_Y);
    space.on('decode-2', () =>
      stage.play(
        brief(
          fadeOut(firstMark, {
            shift: [0, -70],
          }),
          0.4,
        ),
        to(rainWord, (node) => node.at(plainRainX, LINE_Y)),
        to(secondMark, (node) => node.at(plainGapX, LINE_Y)),
        to(fallsWord, (node) => node.at(plainFallsX, LINE_Y)),
        morph(joinedBox, plainBox),
        fade(stepChips[1], 1),
        {
          duration: 0.7,
          ease: smoother,
        },
      ),
    );
    const greenBox = rect(widthOf(10) + 34, 220, {
      radius: 16,
      fill: 'surface',
      stroke: 'green',
      width: 4,
    }).at(0, LINE_Y);
    space.on('decode-3', () =>
      stage.play(
        fadeOut(secondMark, {
          scale: 0.2,
        }),
        to(rainWord, (node) => node.color('green')),
        to(fallsWord, (node) => node.color('green')),
        morph(plainBox, greenBox),
        fade(stepChips[2], 1),
        {
          duration: 0.6,
        },
      ),
    );

    // The marker cannot restore what normalization already removed.
    const exactHead = text('Do you get your exact text back?', {
      font: 'text-serif',
      size: 72,
      color: 'yellow',
    }).at(0, -210);
    const ROW_SIZE = 96,
      ROW_CHAR = ROW_SIZE * 0.6,
      IN_Y = -50,
      OUT_Y = 80,
      ROW_LEFT = -7.5 * ROW_CHAR;
    const inputChars = '··rain··falls··';
    const inX = (start, chars) => ROW_LEFT + (start + chars / 2) * ROW_CHAR;
    const inputParts = [
      ['··', 0, 'red'],
      ['rain', 2, 'ink'],
      ['·', 6, 'ink'],
      ['·', 7, 'red'],
      ['falls', 8, 'ink'],
      ['··', 13, 'red'],
    ].map(([content, start, color]) => ({
      content,
      color,
      start,
      node: text(content, {
        font: 'mono',
        size: ROW_SIZE,
      }).at(inX(start, content.length), IN_Y),
    }));
    assert.equal(inputParts.map((entry) => entry.content).join(''), inputChars);
    const lostDots = inputParts.filter((entry) => entry.color === 'red');
    const inLabel = leftText('in', -880, IN_Y, {
        size: 56,
        color: 'dim',
      }),
      outLabel = leftText('out', -880, OUT_Y, {
        size: 56,
        color: 'dim',
      });
    const outLeft = -widthOf(0) - 5 * ROW_CHAR;
    const outParts = [
      ['rain', 0, 2],
      ['falls', 5, 8],
    ].map(([content, start, from]) => {
      const x = outLeft + (start + content.length / 2) * ROW_CHAR;
      return {
        node: text(content, {
          font: 'mono',
          size: ROW_SIZE,
          color: 'green',
        }).at(x, OUT_Y),
        shift: [inX(from, content.length) - x, IN_Y - OUT_Y],
      };
    });
    const spacesNote = text('By default, leading, trailing, and repeated spaces are gone', {
      size: 54,
      color: 'red',
    }).at(0, 180);
    const UNSEEN_Y = 300;
    const fallbackLabel = leftText('No byte fallback', -880, UNSEEN_Y, {
      size: 50,
      color: 'dim',
    });
    const spark = glyphNode('✨', 120, 'yellow').at(-270, UNSEEN_Y);
    const sparkArrow = arrow([-180, UNSEEN_Y], [-30, UNSEEN_Y], {
      stroke: 'red',
      width: 5,
      tip: 22,
    });
    const unknownId = tile('unknown ID', {
      font: 'sans',
      size: 62,
      color: 'red',
      h: 120,
    }).at(190, UNSEEN_Y);
    const goneArrow = arrow([410, UNSEEN_Y], [530, UNSEEN_Y], {
      stroke: 'red',
      width: 5,
      tip: 22,
    });
    const goneMark = text('⁇', {
      font: 'sans',
      size: 120,
      color: 'red',
    }).at(620, UNSEEN_Y);
    const goneNote = text('Its identity is gone', {
      font: 'text-serif',
      size: 66,
      color: 'red',
    }).at(0, 425);
    space.on('exact-q', () =>
      handover(
        [rainWord, fallsWord, greenBox, ...stepChips],
        fadeIn(exactHead),
        fadeIn([inLabel, outLabel, ...inputParts.map((entry) => entry.node)], {
          shift: [0, 10],
        }),
      ),
    );
    space.on('spaces-lost', () =>
      stage.play(
        ...lostDots.map((entry) => to(entry.node, (node) => node.color('red'))),
        ...outParts.map((entry) =>
          fadeIn(entry.node, {
            shift: entry.shift,
          }),
        ),
        brief(fadeIn(spacesNote), 0.4, 0.4),
        {
          duration: 0.9,
          ease: smoother,
        },
      ),
    );
    space.on('unseen', () =>
      stage.play(
        fadeIn([fallbackLabel, spark, sparkArrow, unknownId]),
        indicate(spark, {
          color: 'red',
          scale: 1.2,
        }),
        {
          duration: 0.7,
        },
      ),
    );
    space.on('gone', () =>
      stage.play(
        draw(goneArrow),
        fadeIn(goneMark, {
          scale: 0.7,
        }),
        fadeIn(goneNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(space, [
      exactHead,
      inLabel,
      ...inputParts.map((entry) => entry.node),
      outLabel,
      ...outParts.map((entry) => entry.node),
      spacesNote,
      fallbackLabel,
      spark,
      sparkArrow,
      unknownId,
      goneArrow,
      goneMark,
      goneNote,
    ]);
  }
}
