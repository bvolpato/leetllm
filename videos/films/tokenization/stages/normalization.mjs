import assert from 'node:assert/strict';
import { Node, arrow, draw, fadeIn, line, rect, smoother, text, to } from 'vizmatic/stage';
import { sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, leftText } from '../defaults.mjs';
import { COMPOSED, DECOMPOSED, LIGATURE, codePoint, SECOND_IDENTIFIER } from '../model.mjs';

/** Normalization often runs before any cut. */
export function buildNormalization(stage, narration, { clearAtEnd, handover, nudge }) {
  const norm = narration.scene('normalization');
  sceneHeading(stage, norm, narration.title('normalization'));
  {
    const TILE_W = 176,
      TILE_H = 140,
      ROW_X = -400;
    const cpTile = (ch, x, y, color) => {
      const node = new Node();
      node.add(
        rect(TILE_W - 12, TILE_H, {
          radius: 12,
          fill: 'surface',
          stroke: color,
          width: 2.5,
        }),
        text(ch, {
          font: 'text-serif',
          size: 76,
          color,
        }).at(0, -22),
        text(codePoint(ch), {
          font: 'mono',
          size: 30,
          color: 'dim',
        }).at(0, 44),
      );
      return node.at(x, y);
    };
    const cpRow = (string, y, color, x0 = ROW_X) =>
      [...string].map((ch, i) => cpTile(ch, x0 + i * TILE_W, y, color));
    const rowLabel = (content, y, color = 'dim') =>
      leftText(content, -880, y, {
        size: 52,
        color,
      });

    // One picture, twice. Then each opens into its code points.
    const lookLeft = text(COMPOSED, {
      font: 'text-serif',
      size: 300,
      color: 'yellow',
    }).at(0, -40);
    const lookRight = text(COMPOSED, {
      font: 'text-serif',
      size: 240,
      color: 'yellow',
    }).at(440, -40);
    const lookNote = text('Same picture, different text', {
      size: 66,
      color: 'dim',
    }).at(0, 170);
    norm.at(0.1, () =>
      stage.play(
        fadeIn(lookLeft, {
          scale: 0.92,
        }),
        {
          duration: 0.35,
        },
      ),
    );
    norm.on('identical', () =>
      stage.play(
        to(lookLeft, (node) => node.at(-440, -40).scale(0.8)),
        brief(fadeIn(lookRight), 0.5, 0.3),
        brief(fadeIn(lookNote), 0.4, 0.4),
        {
          duration: 0.9,
          ease: smoother,
        },
      ),
    );
    const FORM_YS = [-130, 40];
    const composedRow = cpRow(COMPOSED, FORM_YS[0], 'blue'),
      decomposedRow = cpRow(DECOMPOSED, FORM_YS[1], 'teal');
    const composedLabel = rowLabel('composed', FORM_YS[0]),
      decomposedLabel = rowLabel('decomposed', FORM_YS[1]);
    const COUNT_X = 480;
    const count4 = leftText(`${[...COMPOSED].length} code points`, COUNT_X, FORM_YS[0], {
      font: 'mono',
      size: 46,
    });
    const count5 = leftText(`${[...DECOMPOSED].length} code points`, COUNT_X, FORM_YS[1], {
      font: 'mono',
      size: 46,
    });
    const fused = cpTile([...COMPOSED][3], ROW_X + 3 * TILE_W, FORM_YS[1], 'green');
    const countAfter = leftText(
      `${[...DECOMPOSED.normalize('NFC')].length} code points`,
      COUNT_X,
      FORM_YS[1],
      {
        font: 'mono',
        size: 46,
        color: 'green',
      },
    );
    const idsNote = text('IDs can differ', {
      font: 'text-serif',
      size: 72,
      color: 'red',
    }).at(-400, 200);
    const cacheNote = text('A prompt cache can miss', {
      font: 'text-serif',
      size: 72,
      color: 'red',
    }).at(300, 200);
    const afterLabel = rowLabel('after NFC', FORM_YS[1], 'green');
    const nfcNote = text('NFC: both forms become one', {
      font: 'text-serif',
      size: 72,
      color: 'green',
    }).at(0, 230);
    const nfcRing = rect(TILE_W * 5 + 40, 350, {
      radius: 20,
      stroke: 'green',
      width: 4,
    }).at(ROW_X + 2 * TILE_W, (FORM_YS[0] + FORM_YS[1]) / 2);
    norm.on('forms', () =>
      handover(
        [lookLeft, lookRight, lookNote],
        fadeIn([composedLabel, ...composedRow, decomposedLabel, ...decomposedRow], {
          shift: [0, 8],
        }),
      ),
    );
    norm.after('codepoints-four', () => stage.play(fadeIn(count4), { duration: 0.3 }));
    norm.after('codepoints-five', () => stage.play(fadeIn(count5), { duration: 0.3 }));
    norm.on('ids', () =>
      stage.play(
        fadeIn(idsNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    norm.on('cache', () =>
      stage.play(
        fadeIn(cacheNote, {
          shift: [0, 8],
        }),
        {
          duration: 0.4,
        },
      ),
    );
    // NFC merges the letter and its combining mark into one tile, in place.
    norm.on('nfc', () => {
      const mark = decomposedRow[4],
        letter = decomposedRow[3];
      stage.play(
        brief(fadeOut([idsNote, cacheNote, count5, decomposedLabel]), 0.18, 0, LINEAR),
        brief(fadeIn(afterLabel), 0.3, 0.18),
        nudge(mark, -TILE_W, 0),
        brief(fadeOut([letter, mark]), 0.25, 0.55, LINEAR),
        brief(fadeIn(fused), 0.3, 0.6),
        brief(fadeIn(countAfter), 0.4, 0.5),
        brief(fadeIn(nfcNote), 0.4, 0.5),
        brief(draw(nfcRing), 0.5, 0.5),
        {
          duration: 0.9,
          ease: smoother,
        },
      );
    });
    // The ligature: one tile under NFC, two under NFKC, and a second identifier lands on the same row.
    const FOLD_Y = -220,
      OTHER_Y = -30,
      LIG_X = -300;
    const ligName = leftText('identifier 1', -880, FOLD_Y, {
      size: 52,
      color: 'yellow',
    });
    assert.equal([...LIGATURE].length, 3);
    assert.equal([...SECOND_IDENTIFIER].length, 4);
    const ligRow = cpRow(LIGATURE, FOLD_Y, 'yellow', LIG_X);
    const keepNote = text('NFC leaves this single ﬁ ligature alone', {
      font: 'text-serif',
      size: 66,
      color: 'yellow',
    }).at(0, 130);
    const folded = [...LIGATURE.normalize('NFKC')];
    const foldRow = folded.map((ch, i) => cpTile(ch, LIG_X + i * TILE_W, FOLD_Y, 'orange'));
    const foldNote = text('NFKC folds it into a plain f and i', {
      font: 'text-serif',
      size: 66,
      color: 'orange',
    }).at(0, 130);
    const otherName = leftText('identifier 2', -880, OTHER_Y, {
      size: 52,
      color: 'blue',
    });
    const otherRow = cpRow(SECOND_IDENTIFIER, OTHER_Y, 'blue', LIG_X);
    const MERGED_Y = -40;
    const mergedName = leftText('one result', -880, MERGED_Y, {
      size: 52,
      color: 'red',
    });
    const collapseNote = text('Two different identifiers can collapse into one', {
      font: 'text-serif',
      size: 66,
      color: 'red',
    }).at(0, 130);
    norm.on('lig', () =>
      handover(
        [
          composedLabel,
          ...composedRow,
          count4,
          afterLabel,
          ...decomposedRow.slice(0, 3),
          fused,
          countAfter,
          nfcNote,
          nfcRing,
        ],
        fadeIn([ligName, ...ligRow, otherName, ...otherRow], {
          shift: [0, 10],
        }),
        fadeIn(keepNote, {
          shift: [0, 10],
        }),
      ),
    );
    // l and e slide over to make room, and the one ligature tile opens into two.
    norm.on('nfkc', () =>
      stage.play(
        brief(fadeOut(keepNote), 0.18, 0, LINEAR),
        brief(fadeIn(foldNote), 0.3, 0.18),
        ...ligRow.slice(1).map((node) => brief(nudge(node, TILE_W, 0), 0.5, 0, smoother)),
        brief(fadeOut(ligRow[0]), 0.2, 0.2, LINEAR),
        brief(fadeIn(foldRow[0]), 0.3, 0.3),
        brief(
          fadeIn(foldRow[1], {
            shift: [-TILE_W / 2, 0],
          }),
          0.4,
          0.3,
          smoother,
        ),
        brief(fadeOut(ligRow.slice(1)), 0.18, 0.55, LINEAR),
        brief(fadeIn(foldRow.slice(2)), 0.18, 0.55),
      ),
    );
    norm.on('collapse', () =>
      stage.play(
        ...foldRow.map((node) => nudge(node, 0, MERGED_Y - FOLD_Y)),
        ...otherRow.map((node) => nudge(node, 0, MERGED_Y - OTHER_Y)),
        brief(fadeOut(foldNote), 0.18, 0, LINEAR),
        brief(fadeIn(collapseNote), 0.3, 0.18),
        brief(fadeOut([ligName, otherName]), 0.18, 0, LINEAR),
        brief(fadeIn(mergedName), 0.3, 0.22),
        brief(fadeOut(otherRow), 0.1, 0.6, LINEAR),
        {
          duration: 0.7,
          ease: smoother,
        },
      ),
    );
    // The way back does not exist.
    const ghostLigature = cpTile([...LIGATURE][0], LIG_X + TILE_W / 2, -310, 'dim');
    const returnFrom = [LIG_X + TILE_W / 2, MERGED_Y - TILE_H / 2 - 6],
      returnTo = [LIG_X + TILE_W / 2, -310 + TILE_H / 2 + 6];
    const returnArrow = arrow(returnFrom, returnTo, {
      stroke: 'red',
      width: 5,
      tip: 22,
    });
    const midY = (returnFrom[1] + returnTo[1]) / 2,
      crossX = LIG_X + TILE_W / 2;
    const crossOut = new Node();
    crossOut.add(
      line([crossX - 26, midY - 20], [crossX + 26, midY + 20], {
        stroke: 'red',
        width: 7,
      }),
      line([crossX + 26, midY - 20], [crossX - 26, midY + 20], {
        stroke: 'red',
        width: 7,
      }),
    );
    const noBackNote = leftText("Decoding can't bring it back", LIG_X + TILE_W + 40, -310, {
      font: 'text-serif',
      size: 62,
      color: 'red',
    });
    const variantNote = text('SentencePiece default, as of late 2026: a variant of NFKC', {
      size: 54,
      color: 'dim',
    }).at(0, 130);
    const bundledNote = text('Use the bundled normalizer, consistently', {
      font: 'text-serif',
      size: 72,
      color: 'green',
    }).at(0, 250);
    norm.on('one-way', () =>
      stage.play(
        fadeIn(ghostLigature),
        draw(returnArrow),
        brief(
          fadeIn(crossOut, {
            scale: 1.6,
          }),
          0.3,
          0.4,
        ),
        brief(fadeIn(noBackNote), 0.4, 0.4),
        {
          duration: 0.8,
        },
      ),
    );
    norm.on('variant', () =>
      stage.play(
        brief(fadeOut(collapseNote), 0.18, 0, LINEAR),
        brief(fadeIn(variantNote), 0.3, 0.18),
      ),
    );
    norm.on('bundled', () =>
      stage.play(
        fadeIn(bundledNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.5,
        },
      ),
    );
    clearAtEnd(norm, [
      ...foldRow,
      mergedName,
      ghostLigature,
      returnArrow,
      crossOut,
      noBackNote,
      variantNote,
      bundledNote,
    ]);
  }
}
