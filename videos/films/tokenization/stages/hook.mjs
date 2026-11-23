import {
  Node,
  arrow,
  draw,
  fade,
  fadeIn,
  lagged,
  rect,
  smoother,
  text,
  to,
  typewriter,
} from 'vizmatic/stage';
import { row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, tile, tileRow } from '../defaults.mjs';
import { TABLE, PIECES, SENTENCE } from '../model.mjs';

/** The model never reads your sentence. */
export function buildHook(stage, narration, { clearAtEnd, sentenceToIds }) {
  const hook = narration.scene('hook');
  sceneHeading(stage, hook, narration.title('hook'));
  {
    const sentence = text(SENTENCE, {
      font: 'text-serif',
      size: 250,
    }).at(0, -10);
    const ids = PIECES.map(([, id, color]) =>
      text(String(id), {
        font: 'mono',
        size: 230,
        color,
      }),
    );
    const IDS_TOP = -280,
      IDS_MID = -30;
    row(ids, IDS_MID, 170);
    const home = ids.map((node) => [node.get('x'), node.get('y') + IDS_TOP - IDS_MID]);
    const threeWords = text('Three words, to you', {
      font: 'text-serif',
      size: 96,
      color: 'dim',
    }).at(0, 280);
    const fourNumbers = text('Four numbers, in this small example', {
      font: 'text-serif',
      size: 96,
      color: 'dim',
    }).at(0, 280);
    // The table the voice names. An arrow runs from each number to the row it picks.
    const TABLE_X = 170,
      TOP = -255,
      STEP = 76,
      COLUMN_X = -700,
      COLUMN_YS = [-250, -85, 80, 245],
      SMALLER = 0.62;
    const rowY = (i) => TOP + i * STEP;
    const tableRows = TABLE.map((values, i) => {
      const node = new Node();
      node.add(
        text(String(i), {
          font: 'mono',
          size: 44,
          color: 'dim',
        }).at(TABLE_X - 430, rowY(i)),
        rect(780, STEP - 10, {
          radius: 8,
          fill: 'surface',
          stroke: 'grid',
          width: 1.5,
        }).at(TABLE_X, rowY(i)),
        ...values.map((value, c) =>
          text(value.toFixed(1), {
            font: 'mono',
            size: 42,
          }).at(TABLE_X - 250 + c * 250, rowY(i)),
        ),
      );
      return node;
    });
    const litRows = PIECES.map(([, id, color]) =>
      rect(780, STEP - 10, {
        radius: 8,
        stroke: color,
        width: 4,
      })
        .at(TABLE_X, rowY(id))
        .zIndex(2),
    );
    const rowArrows = PIECES.map(([, id, color], i) =>
      arrow([COLUMN_X + 70, COLUMN_YS[i]], [TABLE_X - 470, rowY(id)], {
        stroke: color,
        width: 5,
        tip: 22,
      }),
    );
    const madeUpIds = text('IDs and values invented for this example', {
      size: 50,
      color: 'dim',
    }).at(0, 395);
    const stakes = row(
      ['what it can see', 'what it costs', 'how it breaks'].map((name) =>
        tile(name, {
          font: 'sans',
          size: 58,
          color: 'ink',
          h: 120,
        }),
      ),
      60,
      36,
    );
    const wayChips = tileRow(['byte pair encoding', 'WordPiece', 'Unigram'], 270, {
      font: 'sans',
      size: 58,
      gap: 36,
      h: 110,
      color: (_, i) => ['blue', 'yellow', 'green'][i],
    });
    hook.on('type-it', () =>
      stage.play(typewriter(sentence), {
        duration: 1.5,
      }),
    );
    hook.on('never-reads', () =>
      stage.play(
        fade(sentence, 0.55, {
          duration: 0.6,
        }),
      ),
    );
    hook.on('three-words', () =>
      stage.play(
        fade(sentence, 1),
        fadeIn(threeWords, {
          shift: [0, 14],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    hook.on('four-numbers', () =>
      stage.play(
        brief(fadeOut(threeWords), 0.2),
        brief(fadeIn(fourNumbers), 0.4, 0.8),
        ...sentenceToIds(sentence, ids, 250, -10),
      ),
    );
    hook.on('picks-row', () =>
      stage.play(
        brief(fadeOut(fourNumbers), 0.2),
        ...ids.map((node, i) =>
          brief(
            to(node, (item) => item.at(COLUMN_X, COLUMN_YS[i]).scale(SMALLER)),
            0.7,
            0,
            smoother,
          ),
        ),
        brief(
          fadeIn(tableRows, {
            shift: [14, 0],
          }),
          0.5,
          0.45,
        ),
        brief(
          lagged(
            rowArrows.map((node) => draw(node)),
            {
              lag: 0.3,
            },
          ),
          1,
          0.6,
        ),
        brief(
          lagged(
            litRows.map((node) => fadeIn(node)),
            {
              lag: 0.3,
            },
          ),
          1,
          0.7,
        ),
      ),
    );
    hook.on('made-up', () =>
      stage.play(
        fadeIn(madeUpIds, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    hook.on('decides', () =>
      stage.play(
        brief(fadeOut([...tableRows, ...litRows, ...rowArrows, madeUpIds]), 0.2, 0, LINEAR),
        ...ids.map((node, i) =>
          brief(
            to(node, (item) => item.at(home[i][0], home[i][1]).scale(1 / SMALLER)),
            0.6,
            0.14,
            smoother,
          ),
        ),
        brief(
          lagged(
            stakes.map((node) =>
              fadeIn(node, {
                shift: [0, 14],
              }),
            ),
            {
              lag: 0.3,
            },
          ),
          0.8,
          0.5,
        ),
      ),
    );
    hook.on('way-bpe', () =>
      stage.play(
        fadeIn(wayChips[0], {
          shift: [0, 14],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    hook.on('way-wp', () =>
      stage.play(
        fadeIn(wayChips[1], {
          shift: [0, 14],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    hook.on('way-uni', () =>
      stage.play(
        fadeIn(wayChips[2], {
          shift: [0, 14],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    clearAtEnd(hook, [...ids, ...stakes, ...wayChips]);
  }
}
