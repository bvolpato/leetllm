import assert from 'node:assert/strict';
import { Node, concat, fade, fadeIn, lagged, rectPath, smoother, text } from 'vizmatic/stage';
import { chip, gridNode, row, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut } from '../defaults.mjs';
import { PIECES, SENTENCE, MASKED } from '../model.mjs';

/** You have to cut somewhere. */
export function buildCut(stage, narration, { clearAtEnd, flash, nudge }) {
  const cut = narration.scene('cut');
  sceneHeading(stage, cut, narration.title('cut'));
  {
    const MID_Y = -40,
      CHIP_Y = -330,
      GRID_X = -330,
      GRID_Y = 140,
      GRID = 640,
      READ_X = 460;
    const wordChips = row(
      ['rain', 'falls', 'softly'].map((word) =>
        chip(word, {
          w: 480,
          h: 130,
          size: 80,
          font: 'sans',
          color: 'blue',
        }),
      ),
      MID_Y,
      30,
    );
    const typoChip = chip('sofly', {
      w: 480,
      h: 130,
      size: 80,
      font: 'sans',
      color: 'red',
    }).moveTo(wordChips[2].center);
    const unkChip = chip('[UNK]', {
      w: 480,
      h: 130,
      size: 80,
      font: 'mono',
      color: 'red',
    }).moveTo(wordChips[2].center);
    const noteX = wordChips[2].center[0];
    const noRow = text('no row', {
      size: 60,
      color: 'red',
    }).at(noteX, MID_Y + 115);
    const lostNote = text('which word was it?', {
      size: 60,
      color: 'red',
    }).at(noteX, MID_Y + 115);
    const pieceCount = (content) =>
      text(content, {
        font: 'mono',
        size: 76,
        color: 'yellow',
      }).at(0, MID_Y + 240);
    const threePieces = pieceCount(`${wordChips.length} pieces`),
      seventeenPieces = pieceCount(`${SENTENCE.length} pieces, counting spaces`);
    const charChips = row(
      [...SENTENCE].map((ch) =>
        chip(ch === ' ' ? '·' : ch, {
          w: 92,
          h: 120,
          size: 64,
          color: 'teal',
        }),
      ),
      MID_Y,
      10,
    );
    const subChips = row(
      PIECES.map(([piece, , color]) =>
        chip(piece, {
          w: 400,
          h: 120,
          size: 72,
          font: 'sans',
          color,
        }),
      ),
      CHIP_Y,
      30,
    );
    const cells = (count) => count * count;
    // Two nodes, for the cells a causal mask keeps and the later positions it hides. Hiding dims
    // the later cells themselves. A cover would show what it hides while it faded on the way out.
    const gridPart = (keep) => {
      const size = GRID / 17,
        inner = size * 0.86,
        rings = [];
      for (let r = 0; r < 17; r++)
        for (let c = 0; c < 17; c++)
          if (c <= r === keep)
            rings.push(
              rectPath(
                -GRID / 2 + c * size + (size - inner) / 2,
                -GRID / 2 + r * size + (size - inner) / 2,
                inner,
                inner,
                4,
              ),
            );
      assert.equal(rings.length, keep ? MASKED : 289 - MASKED);
      return new Node(concat(...rings)).fill('red', 0.42).stroke('red', 1).at(GRID_X, GRID_Y);
    };
    const gridKept = gridPart(true),
      gridLater = gridPart(false);
    const grid4 = gridNode(4, GRID, 'green').at(GRID_X, GRID_Y);
    const sidesSeventeen = text(`${SENTENCE.length} × ${SENTENCE.length}`, {
      font: 'mono',
      size: 96,
      color: 'dim',
    }).at(READ_X, GRID_Y - 260);
    const sidesFour = text(`${subChips.length} × ${subChips.length}`, {
      font: 'mono',
      size: 96,
      color: 'dim',
    }).at(READ_X, GRID_Y - 260);
    const readouts = [SENTENCE.length, subChips.length].map((count) =>
      text(String(cells(count)), {
        font: 'mono',
        size: 220,
        color: 'ink',
      }).at(READ_X, GRID_Y - 90),
    );
    const readoutLabel = text('comparisons\nin one grid', {
      size: 66,
      color: 'dim',
      leading: 1.15,
    }).at(READ_X, GRID_Y + 80);
    const askCount = text('?', {
      font: 'mono',
      size: 220,
      color: 'yellow',
    }).at(READ_X, GRID_Y - 90);
    const hiddenNote = text(`${MASKED} of ${cells(17)}, with later\npositions hidden`, {
      size: 54,
      color: 'yellow',
      leading: 1.2,
    }).at(READ_X, GRID_Y + 240);
    const uncut = text(SENTENCE, {
      font: 'text-serif',
      size: 250,
    }).at(0, 40);
    cut.at(0.15, () =>
      stage.play(fadeIn(uncut), {
        duration: 0.35,
      }),
    );
    cut.on('whole-words', () =>
      stage.play(
        brief(fadeOut(uncut), 0.19, 0, LINEAR),
        ...wordChips.map((node, i) =>
          brief(
            fadeIn(node, {
              shift: [0, -24],
            }),
            0.18,
            0.15 + i * 0.2,
          ),
        ),
      ),
    );
    cut.after('three-pieces', () => stage.play(fadeIn(threePieces), { duration: 0.3 }));
    cut.on('typo', () =>
      stage.play(
        brief(fadeOut(wordChips[2]), 0.18, 0, LINEAR),
        brief(fadeIn(typoChip), 0.3, 0.18),
        brief(
          fadeIn(noRow, {
            shift: [0, -10],
          }),
          0.4,
          0.14,
        ),
      ),
    );
    cut.on('loses', () =>
      stage.play(
        brief(fadeOut([typoChip, noRow]), 0.18, 0, LINEAR),
        brief(fadeIn(unkChip), 0.3, 0.18),
        brief(
          fadeIn(lostNote, {
            shift: [0, -10],
          }),
          0.3,
          0.18,
        ),
      ),
    );
    cut.on('characters', () =>
      stage.play(
        brief(
          fadeOut([wordChips[0], wordChips[1], unkChip, lostNote, threePieces]),
          0.26,
          0,
          LINEAR,
        ),
        brief(
          lagged(
            charChips.map((node) =>
              fadeIn(node, {
                shift: [0, -18],
              }),
            ),
            {
              lag: 0.1,
            },
          ),
          0.9,
          0.1,
        ),
      ),
    );
    cut.after('seventeen', () =>
      stage.play(
        lagged(
          charChips.map((node) => flash(node)),
          {
            lag: 0.06,
          },
        ),
        brief(
          fadeIn(seventeenPieces, {
            shift: [0, 10],
          }),
          0.4,
        ),
        {
          duration: 1.1,
        },
      ),
    );
    // Only now does the voice ask for a grid, so the chips make room and the grid arrives full size.
    cut.on('every-position', () =>
      stage.play(
        ...charChips.map((node) => brief(nudge(node, 0, CHIP_Y - MID_Y), 0.55, 0, smoother)),
        brief(fadeOut(seventeenPieces), 0.18, 0, LINEAR),
        brief(fadeIn([gridKept, gridLater]), 0.6, 0.5),
        brief(fadeIn([sidesSeventeen, askCount, readoutLabel]), 0.5, 0.6),
      ),
    );
    cut.after('comparisons', () => {
      askCount.opacity(0);
      stage.play(fadeIn(readouts[0]), { duration: 0.3 });
    });
    cut.on('hide-later', () =>
      stage.play(
        fade(gridLater, 0.14),
        fadeIn(hiddenNote, {
          shift: [0, 10],
        }),
        {
          duration: 0.8,
        },
      ),
    );
    // Four chips cannot sit over 17 × 17 and 289. The grid and its sides change now, and the count
    // waits for the voice, so the viewer can work it out first.
    cut.on('middle', () => {
      stage.play(
        brief(
          fadeOut([...charChips, gridKept, gridLater, hiddenNote, sidesSeventeen, readouts[0]]),
          0.2,
          0,
          LINEAR,
        ),
        brief(
          lagged(
            subChips.map((node) =>
              fadeIn(node, {
                shift: [0, -18],
              }),
            ),
            {
              lag: 0.18,
            },
          ),
          0.9,
          0.12,
        ),
        brief(fadeIn(grid4), 0.45, 0.14),
        brief(fadeIn(sidesFour), 0.4, 0.2),
        brief(fade(askCount, 1), 0.4, 0.2),
      );
    });
    cut.after('sixteen', () => {
      askCount.opacity(0);
      stage.play(fadeIn(readouts[1]), { duration: 0.3 });
    });
    assert.equal(cells(subChips.length), 16);
    clearAtEnd(cut, [...subChips, grid4, sidesFour, readouts[1], readoutLabel]);
  }
}
