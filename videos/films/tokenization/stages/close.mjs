import { arrow, dynamic, fadeIn, indicate, lagged, rect, smoother, text } from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut } from '../defaults.mjs';
import { HISTORY, TABLE, PIECES, SENTENCE } from '../model.mjs';

/** Three ways to cut, all ending in row numbers. */
export function buildClose(stage, narration, { sentenceToIds }, { CHARS }) {
  const closing = narration.scene('close');
  sceneHeading(stage, closing, narration.title('close'));
  {
    // Each method returns as a small picture of what it did. The opening sentence then returns
    // as the IDs of one tokenizer. Different tokenizers can give different IDs, as lookup showed.
    const CARD_TOP = -390,
      CARD_W = 560,
      TALL = 344,
      SHORT = 250,
      CARD_XS = [-590, 0, 590],
      CAPTION_Y = -106;
    const cardHeight = stage.value(TALL);
    const cardBox = (i, color) =>
      dynamic(() =>
        rect(CARD_W, cardHeight.value, {
          radius: 18,
          fill: 'surface',
          stroke: color,
          width: 3,
        }).at(CARD_XS[i], CARD_TOP + cardHeight.value / 2),
      );
    const cardName = (i, name, color) =>
      text(name, {
        font: 'text-serif',
        size: 52,
        color,
      }).at(CARD_XS[i], CARD_TOP + 42);
    const caption = (content, i) =>
      text(content, {
        size: 40,
        leading: 1.1,
      }).at(CARD_XS[i], CAPTION_Y);
    const bpeLines = HISTORY.slice(1).map((step, k) =>
      text(`${step.merged.left} + ${step.merged.right} → ${step.merged.left + step.merged.right}`, {
        font: 'mono',
        size: 36,
        color: 'blue',
      }).at(CARD_XS[0], -290 + k * 44),
    );
    const WORD_Y = -256;
    const wpLetters = [...'rainbow'].map((ch, k) =>
      chip(ch, {
        w: 46,
        h: 72,
        size: 42,
        color: 'blue',
      }).at(CARD_XS[1] + (k - 3) * 66, WORD_Y),
    );
    const wpRange = rect(5 * 66 - 6, 92, {
      radius: 10,
      stroke: 'yellow',
      width: 4,
    })
      .at(CARD_XS[1] + (2 - 3) * 66, WORD_Y)
      .zIndex(2);
    const wpUnk = text('[UNK]', {
      font: 'mono',
      size: 42,
      color: 'red',
    }).at(CARD_XS[1], -178);
    const MINI_X = CARD_XS[2] - 190,
      MINI_STEP = 76,
      MINI_Y = -192;
    const miniTiles = CHARS.map((ch, i) =>
      chip(ch, {
        w: MINI_STEP - 8,
        h: 58,
        size: 36,
        color: 'blue',
      }).at(MINI_X + (i + 0.5) * MINI_STEP, MINI_Y),
    );
    const miniLit = arrow([MINI_X + 6, MINI_Y - 34], [MINI_X + 5 * MINI_STEP - 6, MINI_Y - 34], {
      stroke: 'yellow',
      width: 5,
      tip: 20,
      bend: -130,
    });
    const captions = [
      caption('Counts pairs, merges the\nmost frequent, replays a list', 0),
      caption('Longest match, and a dead\nend can lose a whole word', 1),
      caption('Prunes an oversized list,\npicks the best scoring path', 2),
    ];
    const cards = [
      [cardBox(0, 'blue'), cardName(0, 'BPE', 'blue'), ...bpeLines],
      [
        cardBox(1, 'yellow'),
        cardName(1, 'BERT style WordPiece', 'yellow'),
        ...wpLetters,
        wpRange,
        wpUnk,
      ],
      [cardBox(2, 'green'), cardName(2, 'Unigram', 'green'), ...miniTiles, miniLit],
    ];
    const again = text(SENTENCE, {
      font: 'text-serif',
      size: 170,
    }).at(0, 130);
    const COLUMN_W = 400,
      COLUMN_GAP = 30,
      ID_Y = 30,
      ROW_Y = 165;
    const columnX = (i) => (i - (PIECES.length - 1) / 2) * (COLUMN_W + COLUMN_GAP);
    const idsAgain = PIECES.map(([, id, color], i) =>
      text(String(id), {
        font: 'mono',
        size: 150,
        color,
      }).at(columnX(i), ID_Y),
    );
    const filledRows = PIECES.map(([, id, color], i) =>
      chip(TABLE[id].map((value) => value.toFixed(1)).join('  '), {
        w: COLUMN_W,
        h: 88,
        size: 44,
        color,
      }).at(columnX(i), ROW_Y),
    );
    const oneTokenizer = text("One tokenizer's IDs and values, invented for this example", {
      size: 46,
      color: 'dim',
    }).at(0, 255);
    const nextNote = text('Next: how a table turns integers into geometry', {
      size: 54,
      color: 'dim',
    }).at(0, 350);
    closing.at(0.1, () =>
      stage.play(fadeIn(again), {
        duration: 0.35,
      }),
    );
    closing.on('bpe', () =>
      stage.play(
        fadeIn([...cards[0], captions[0]], {
          shift: [0, 12],
        }),
        {
          duration: 0.6,
        },
      ),
    );
    closing.on('wp', () =>
      stage.play(
        fadeIn([...cards[1], captions[1]], {
          shift: [0, 12],
        }),
        {
          duration: 0.6,
        },
      ),
    );
    closing.on('uni', () =>
      stage.play(
        fadeIn([...cards[2], captions[2]], {
          shift: [0, 12],
        }),
        {
          duration: 0.6,
        },
      ),
    );
    // The captions have done their job once the IDs arrive, and the voice has said them.
    closing.on('rows', () =>
      stage.play(
        brief(fadeOut(captions), 0.25, 0, LINEAR),
        brief(cardHeight.to(SHORT), 0.6, 0.2, smoother),
        ...sentenceToIds(again, idsAgain, 170, 130),
        brief(fadeIn(oneTokenizer), 0.4, 0.5),
        {
          duration: 1.2,
          ease: smoother,
        },
      ),
    );
    closing.on('next', () =>
      stage.play(
        lagged(
          filledRows.map((node) =>
            fadeIn(node, {
              shift: [0, -12],
            }),
          ),
          {
            lag: 0.2,
          },
        ),
        {
          duration: 0.9,
        },
      ),
    );
    closing.on('geometry', () =>
      stage.play(fadeIn(nextNote), {
        duration: 0.5,
      }),
    );
    closing.on('apart', () =>
      stage.play(
        indicate(nextNote, {
          color: 'yellow',
          scale: 1.03,
        }),
        {
          duration: 0.7,
        },
      ),
    );
    stage.at(closing.end - 0.7, () =>
      stage.play(fadeOut([...cards.flat(), ...idsAgain, ...filledRows, oneTokenizer, nextNote]), {
        duration: 0.6,
      }),
    );
  }
}
