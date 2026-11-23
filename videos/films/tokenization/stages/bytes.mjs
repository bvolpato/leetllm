import assert from 'node:assert/strict';
import {
  Node,
  arrow,
  concat,
  draw,
  fade,
  fadeIn,
  lagged,
  line,
  rect,
  rectPath,
  smoother,
  text,
  to,
} from 'vizmatic/stage';
import { chip, sceneHeading } from '../../../stage-lessons/kit.mjs';
import { LINEAR, brief, fadeOut, glyphNode, leftText, tile, tileRow } from '../defaults.mjs';
import { ALPHABET, BYTE_CHARS, BYTES, hex } from '../model.mjs';

/** Bytes give every character somewhere to go. */
export function buildBytes(stage, narration, { clearAtEnd, handover, flash }) {
  const bytes = narration.scene('bytes');
  sceneHeading(stage, bytes, narration.title('bytes'));
  {
    // The corpus alphabet, the letter it lacks, and all 256 byte values as separate cells.
    const ALPHA_Y = -300,
      CELL = 42,
      COLUMNS = 32,
      GRID_Y = 30;
    const alphaTiles = tileRow(ALPHABET, ALPHA_Y, {
      size: 76,
      gap: 14,
      x: -400,
      min: 96,
      color: 'blue',
    });
    const stuckTile = tile('b', {
      size: 76,
      color: 'red',
      min: 96,
    }).at(220, ALPHA_Y);
    const stuckNote = leftText('no row', 300, ALPHA_Y, {
      size: 60,
      color: 'red',
    });
    const cellAt = (value) => [
      ((value % COLUMNS) - (COLUMNS - 1) / 2) * CELL,
      GRID_Y + (Math.floor(value / COLUMNS) - 3.5) * CELL,
    ];
    const byteGrid = new Node(
      concat(
        ...Array.from(
          {
            length: 256,
          },
          (_, value) => {
            const [x, y] = cellAt(value);
            return rectPath(x - CELL / 2 + 3, y - CELL / 2 + 3, CELL - 6, CELL - 6, 4);
          },
        ),
      ),
    )
      .fill('blue', 0.45)
      .stroke('blue', 1);
    const byteOfB = new TextEncoder().encode('b')[0];
    assert.equal(byteOfB, 98);
    const litCell = rect(CELL, CELL, {
      radius: 5,
      fill: 'green',
      stroke: 'ink',
      width: 2,
    })
      .at(...cellAt(byteOfB))
      .zIndex(2);
    const toCell = arrow([220, ALPHA_Y + 74], [cellAt(byteOfB)[0], cellAt(byteOfB)[1] - CELL / 2], {
      stroke: 'green',
      width: 5,
      tip: 22,
      bend: 60,
    }).zIndex(3);
    const gridNote = text('All 256 byte values', {
      size: 60,
      color: 'blue',
    }).at(0, GRID_Y + 215);
    const utfNote = text('UTF-8 writes each Unicode character as bytes', {
      size: 50,
      color: 'dim',
    }).at(0, GRID_Y + 295);
    const noUnknown = text('Valid Unicode text: no unknown token', {
      font: 'text-serif',
      size: 66,
      color: 'green',
    }).at(0, GRID_Y + 385);
    const firstPicture = [
      ...alphaTiles,
      stuckTile,
      stuckNote,
      byteGrid,
      litCell,
      toCell,
      gridNote,
      utfNote,
      noUnknown,
    ];
    // The grid waits until the voice names it.
    byteGrid.opacity(0);
    assert.equal(new TextEncoder().encode('😀').length, 4);
    bytes.at(0.1, () =>
      stage.play(
        lagged(
          alphaTiles.map((node) =>
            fadeIn(node, {
              scale: 0.8,
            }),
          ),
          {
            lag: 0.05,
          },
        ),
        {
          duration: 0.4,
        },
      ),
    );
    bytes.on('six', () =>
      stage.play(
        lagged(
          alphaTiles.map((node) =>
            flash(node, {
              color: 'ink',
              scale: 1.15,
            }),
          ),
          {
            lag: 0.08,
          },
        ),
        {
          duration: 0.9,
        },
      ),
    );
    bytes.on('stuck', () =>
      stage.play(
        fadeIn(stuckTile, {
          shift: [0, -14],
        }),
        fadeIn(stuckNote),
        {
          duration: 0.5,
        },
      ),
    );
    bytes.on('bytes', () =>
      stage.play(fadeIn(gridNote), fade(byteGrid, 1), brief(fadeOut(stuckNote), 0.3), {
        duration: 0.8,
      }),
    );
    bytes.on('utf8', () =>
      stage.play(fadeIn(utfNote), {
        duration: 0.4,
      }),
    );
    bytes.on('no-unknown', () =>
      stage.play(fadeIn(noUnknown), fadeIn(litCell), draw(toCell), {
        duration: 0.8,
      }),
    );

    // Three characters open into their bytes. These same tiles are cut and gathered later.
    const TILE_W = 150,
      TILE_GAP = 12,
      GROUP_GAP = 56,
      GROUP_W = 3 * TILE_W + 2 * TILE_GAP;
    const groupX = (i) => (i - 1) * (GROUP_W + GROUP_GAP);
    const byteX = (group, k) => groupX(group) + (k - 1) * (TILE_W + TILE_GAP);
    const charColors = ['blue', 'teal', 'yellow'];
    const CHAR_Y = -220,
      BYTE_Y = 20,
      BAD_Y = 220;
    const charNodes = BYTE_CHARS.map((entry, i) =>
      glyphNode(entry.ch, 200, charColors[i]).at(groupX(i), CHAR_Y),
    );
    const byteTiles = BYTE_CHARS.flatMap((entry, i) =>
      entry.bytes.map((value, k) =>
        chip(hex(value), {
          w: TILE_W,
          h: 110,
          size: 64,
          color: charColors[i],
        }).at(byteX(i, k), BYTE_Y),
      ),
    );
    const fanLines = BYTE_CHARS.flatMap((entry, i) =>
      entry.bytes.map((_, k) =>
        line([groupX(i), CHAR_Y + 108], [byteX(i, k), BYTE_Y - 60], {
          stroke: charColors[i],
          width: 3,
        }),
      ),
    );
    const charCount = text(`${BYTE_CHARS.length} characters`, {
      font: 'mono',
      size: 76,
      color: 'ink',
    }).at(-500, 170);
    const byteCount = text(`${BYTES.length} bytes`, {
      font: 'mono',
      size: 76,
      color: 'yellow',
    }).at(300, 170);
    const tokenCount = text(`${BYTES.length} tokens, with no merges`, {
      font: 'mono',
      size: 76,
      color: 'yellow',
    }).at(0, 170);
    const sparkle = BYTE_CHARS.at(-1);
    const sparkleBytes = text(`Sparkle in UTF-8     ${sparkle.bytes.map(hex).join(' ')}`, {
      size: 50,
      color: 'dim',
    }).at(0, 265);
    const leastNote = text('The cost falls hardest on the scripts it saw least', {
      size: 50,
      color: 'dim',
    }).at(0, 345);
    bytes.on('three-chars', () =>
      handover(
        firstPicture,
        lagged(
          charNodes.map((node) =>
            fadeIn(node, {
              scale: 0.7,
            }),
          ),
          {
            lag: 0.25,
          },
        ),
      ),
    );
    bytes.after('three-count', () => stage.play(fadeIn(charCount), { duration: 0.3 }));
    bytes.on('nine-bytes', () => {
      stage.play(
        lagged(
          byteTiles.map((node) =>
            fadeIn(node, {
              shift: [0, -12],
            }),
          ),
          {
            lag: 0.06,
          },
        ),
        lagged(
          fanLines.map((node) => draw(node)),
          {
            lag: 0.06,
          },
        ),
        {
          duration: 1.1,
          ease: smoother,
        },
      );
    });
    bytes.after('nine-bytes', () => stage.play(fadeIn(byteCount), { duration: 0.3 }));
    bytes.on('four-byte', () =>
      stage.play(fadeIn(sparkleBytes), flash(byteTiles.slice(-sparkle.bytes.length)), {
        duration: 0.4,
      }),
    );
    bytes.after('costs-more', () =>
      stage.play(
        brief(fadeOut([charCount, byteCount]), 0.18, 0, LINEAR),
        brief(fadeIn(tokenCount), 0.3, 0.18),
        fadeIn(leastNote),
        {
          duration: 0.6,
        },
      ),
    );

    // A boundary cuts a character. Each byte alone fails, under its own tile. Gathered, the bytes
    // rise back into the characters they came from, so they never cross the failed row.
    const splitX = (byteX(0, 0) + byteX(0, 1)) / 2;
    const splitMark = line([splitX, BYTE_Y - 48], [splitX, BYTE_Y + 94], {
      stroke: 'red',
      width: 6,
    }).zIndex(4);
    const splitNote = text('a token boundary', {
      size: 46,
      color: 'red',
    }).at(splitX, BYTE_Y + 118);
    const replacement = BYTES.map((_, i) =>
      text('�', {
        font: 'sans',
        size: 92,
        color: 'red',
      }).at(byteX(Math.floor(i / 3), i % 3), BAD_Y),
    );
    const aloneHead = text('Decoded one byte at a time', {
      size: 54,
      color: 'red',
    }).at(0, BAD_Y + 90);
    const flying = BYTE_CHARS.flatMap((entry, i) =>
      entry.bytes.map((value, k) =>
        chip(hex(value), {
          w: TILE_W,
          h: 110,
          size: 64,
          color: 'green',
        })
          .at(byteX(i, k), BYTE_Y)
          .zIndex(5),
      ),
    );
    const decoded = BYTE_CHARS.map((entry, i) =>
      glyphNode(entry.ch, 200, 'green').at(groupX(i), CHAR_Y).zIndex(6),
    );
    const gatherHead = text('Gathered first, then decoded', {
      size: 60,
      color: 'green',
    }).at(0, BAD_Y - 20);
    const holdNote = text('So a streaming decoder holds back an unfinished character', {
      font: 'text-serif',
      size: 62,
      color: 'yellow',
    }).at(0, BAD_Y + 90);
    bytes.on('mid-char', () =>
      stage.play(
        brief(fadeOut([tokenCount, sparkleBytes, leastNote]), 0.2, 0, LINEAR),
        brief(draw(splitMark), 0.4, 0.1),
        brief(fadeIn(splitNote), 0.4, 0.22),
      ),
    );
    bytes.on('garbage', () =>
      stage.play(
        lagged(
          replacement.map((node) =>
            fadeIn(node, {
              shift: [0, 20],
            }),
          ),
          {
            lag: 0.08,
          },
        ),
        fadeIn(aloneHead),
        ...charNodes.map((node) => fade(node, 0.55)),
        {
          duration: 0.8,
        },
      ),
    );
    bytes.on('gather', () =>
      stage.play(
        brief(fadeOut([...fanLines, splitMark, splitNote]), 0.18, 0, LINEAR),
        ...[...replacement, aloneHead].map((node) => brief(fade(node, 0.55), 0.3)),
        brief(fadeIn(flying), 0.2),
        ...flying.map((node, i) =>
          brief(
            to(node, (item) => item.at(groupX(Math.floor(i / 3)), CHAR_Y).scale(0.5)),
            0.7,
            0.2,
            smoother,
          ),
        ),
        brief(fadeOut(flying), 0.2, 0.85, LINEAR),
        ...decoded.map((node) =>
          brief(
            fadeIn(node, {
              scale: 0.6,
            }),
            0.4,
            0.8,
          ),
        ),
        brief(fadeOut(charNodes), 0.3, 0.8, LINEAR),
        brief(fadeOut([...replacement, aloneHead]), 0.25, 1.3, LINEAR),
        brief(fadeIn(gatherHead), 0.3, 1.5),
      ),
    );
    bytes.on('hold-back', () =>
      stage.play(fadeIn(holdNote), {
        duration: 0.5,
      }),
    );
    clearAtEnd(bytes, [...byteTiles, ...decoded, gatherHead, holdNote]);
  }
}
