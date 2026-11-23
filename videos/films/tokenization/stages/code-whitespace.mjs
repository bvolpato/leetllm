import { fadeIn, lagged, morph, rect, smoother, text, to } from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText } from '../defaults.mjs';
import { CAMEL } from '../model.mjs';

/** Code spends tokens on layout and casing. */
export function buildCodeWhitespace(stage, narration, { clearAtEnd, handover }) {
  const code = narration.scene('code-whitespace');
  sceneHeading(stage, code, narration.title('code-whitespace'));
  {
    const CODE_SIZE = 84,
      LINE_Y = -130,
      SPACE_W = 56,
      CODE_W = 12 * CODE_SIZE * 0.6,
      GAP = 30;
    const total = 16 * SPACE_W + GAP + CODE_W,
      left = -total / 2;
    const spaceAt = (i) => left + SPACE_W / 2 + i * SPACE_W;
    const codeEnd = left + 16 * SPACE_W + GAP + CODE_W / 2;
    const codeText = text('return total', {
      font: 'mono',
      size: 120,
    }).at(0, 30);
    const spaceCells = Array.from(
      {
        length: 16,
      },
      (_, i) =>
        chip('·', {
          w: SPACE_W - 10,
          h: 130,
          size: 56,
          color: 'red',
        }).at(spaceAt(i), LINE_Y),
    );
    const spaceGroups = [0, 1, 2, 3].map((i) =>
      chip('····', {
        w: SPACE_W * 4 - 8,
        h: 130,
        size: 56,
        color: 'green',
      }).at(spaceAt(i * 4 + 1.5), LINE_Y),
    );
    const levelNote = text('4 levels × 4 spaces = 16 leading spaces', {
      size: 54,
      color: 'dim',
    }).at(0, LINE_Y + 170);
    const tokenCounts = [spaceCells.length, spaceGroups.length].map((count, i) =>
      text(String(count), {
        font: 'mono',
        size: 220,
        color: i === 0 ? 'red' : 'green',
      }).at(-470, 180),
    );
    const tokenWord = leftText('tokens for this run', -300, 180, {
      size: 62,
      color: 'dim',
    });
    const saveNote = text(
      `${Math.round((1 - spaceGroups.length / spaceCells.length) * 100)}% less`,
      {
        font: 'text-serif',
        size: 90,
        color: 'green',
      },
    ).at(0, 370);
    const firstPicture = [...spaceGroups, codeText, levelNote, ...tokenCounts, tokenWord, saveNote];
    code.at(0.1, () =>
      stage.play(fadeIn(codeText), {
        duration: 0.35,
      }),
    );
    code.on('indent', () =>
      stage.play(
        brief(
          to(codeText, (node) => node.at(codeEnd, LINE_Y).scale(CODE_SIZE / 120)),
          0.55,
          0,
          smoother,
        ),
        brief(
          lagged(
            spaceCells.map((node) =>
              fadeIn(node, {
                scale: 0.8,
              }),
            ),
            {
              lag: 0.04,
            },
          ),
          0.6,
          0.5,
        ),
        brief(fadeIn(levelNote), 0.4, 0.6),
      ),
    );
    code.after('sixteen', () =>
      stage.play(fadeIn(tokenCounts[0]), fadeIn(tokenWord), {
        duration: 0.5,
      }),
    );
    code.after('four', () => {
      tokenCounts[0].opacity(0);
      stage.play(morph(spaceCells, spaceGroups), fadeIn(tokenCounts[1]), {
        duration: 1,
        ease: smoother,
      });
    });
    code.after('save', () =>
      stage.play(
        fadeIn(saveNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    // Casing: the same letters are cut in place, into the five pieces from the article.
    const CAMEL_Y = 25,
      CAMEL_SIZE = 150,
      CAMEL_CHAR = CAMEL_SIZE * 0.6,
      CAMEL_GAP = 30;
    const CAMEL_TEXT = CAMEL.join('');
    const wholeLeft = (-CAMEL_TEXT.length * CAMEL_CHAR) / 2;
    const camelTotal = CAMEL_TEXT.length * CAMEL_CHAR + (CAMEL.length - 1) * (CAMEL_GAP + 30) + 30;
    let wholeOffset = 0,
      cutCursor = -camelTotal / 2;
    const camelPieces = CAMEL.map((piece) => {
      const width = piece.length * CAMEL_CHAR + 30,
        wholeX = wholeLeft + (wholeOffset + piece.length / 2) * CAMEL_CHAR,
        x = cutCursor + width / 2;
      wholeOffset += piece.length;
      cutCursor += width + CAMEL_GAP;
      return {
        x,
        width,
        caption: text(piece, {
          font: 'mono',
          size: CAMEL_SIZE,
          color: 'yellow',
        })
          .at(wholeX, CAMEL_Y)
          .zIndex(3),
        box: rect(width, 210, {
          radius: 14,
          fill: 'surface',
          stroke: 'blue',
          width: 3,
        }).at(x, CAMEL_Y),
      };
    });
    const camelCount = text(`${CAMEL.length} pieces, from a small tokenizer in the article`, {
      size: 54,
      color: 'dim',
    }).at(0, 175);
    const camelFact = text('It never learned a piece for count with a capital C', {
      font: 'text-serif',
      size: 66,
    }).at(0, 290);
    const measuredCount = text('cl100k_base     tokenCount → 2 tokens', {
      font: 'mono',
      size: 60,
      color: 'green',
    }).at(0, 290);
    code.on('camel', () =>
      handover(
        firstPicture,
        fadeIn(
          camelPieces.map((piece) => piece.caption),
          {
            shift: [0, 10],
          },
        ),
      ),
    );
    code.on('pieces', () =>
      stage.play(
        ...camelPieces.map((piece) =>
          brief(
            to(piece.caption, (node) => node.at(piece.x, CAMEL_Y).color('blue')),
            0.55,
            0,
            smoother,
          ),
        ),
        brief(fadeIn(camelPieces.map((piece) => piece.box)), 0.4, 0.5),
        brief(fadeIn(camelCount), 0.4, 0.5),
      ),
    );
    code.after(
      'pieces',
      () =>
        stage.play(
          fadeIn(camelFact, {
            shift: [0, 8],
          }),
          {
            duration: 0.5,
          },
        ),
      0.9,
    );
    code.after('yours', () =>
      stage.play(brief(fadeOut(camelFact), 0.18, 0, LINEAR), brief(fadeIn(measuredCount), 0.3, 0.18)),
    );
    clearAtEnd(code, [
      ...camelPieces.flatMap((piece) => [piece.box, piece.caption]),
      camelCount,
      measuredCount,
    ]);
  }
}
