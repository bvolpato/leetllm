import assert from 'node:assert/strict';
import {
  Node,
  arrow,
  draw,
  fadeIn,
  lagged,
  morph,
  morphMatching,
  rect,
  text,
  tex,
  to,
  write,
} from 'vizmatic/stage';
import { gridPath, sceneHeading } from '../../../stage-lessons/kit.mjs';
import {
  LINEAR,
  brief,
  fadeOut,
  fade,
  arrive,
  WORDS,
  f2,
  bmatrix,
  LEFT,
  prose,
  midProse,
  lineProse,
  midMono,
  math,
  maskCells,
  maskFrame,
  waiting,
  dimIn,
  lit,
} from '../defaults.mjs';
import { SCALED, WEIGHTS } from '../model.mjs';

/** No reading the future. */
export function buildMask(stage, narration, { show, leave, dropCovered, handOver }) {
  const mask = narration.scene('mask');
  sceneHeading(stage, mask, narration.title('mask'));
  // First the reason: a word must not read what it should predict.
  const SENT_Y = -110,
    SENT_SIZE = 92;
  const sentence = WORDS.map((word) =>
    text(word, {
      font: 'text-serif',
      size: SENT_SIZE,
    }),
  );
  const sentWidths = sentence.map((node) => node.width),
    sentGap = 26;
  const sentTotal = sentWidths.reduce((a, b) => a + b, 0) + sentGap * (WORDS.length - 1);
  const sentX = [];
  {
    let at = -sentTotal / 2;
    sentWidths.forEach((width, i) => {
      sentX.push(at + width / 2);
      sentence[i].at(at + width / 2, SENT_Y);
      at += width + sentGap;
    });
  }
  const future = [5, 6, 7];
  const futureBoxes = future.map((i) =>
    rect(sentWidths[i] + 10, 116, {
      radius: 10,
      stroke: 'faint',
      width: 2.5,
      dash: [8, 8],
    }).at(sentX[i], SENT_Y + 11),
  );
  const relevantTag = prose('Scores: what is relevant', LEFT, 330, 66, 'yellow');
  const allowedTag = prose('A mask: what is allowed', 60, 330, 66, 'red');
  const readBack = arrow([sentX[4], SENT_Y + 66], [sentX[0], SENT_Y + 66], {
    stroke: 'blue',
    width: 5,
    tip: 24,
    bend: -130,
  });
  const readAhead = arrow([sentX[4], SENT_Y + 66], [sentX[5], SENT_Y + 66], {
    stroke: 'red',
    width: 6,
    tip: 26,
    bend: 90,
  });
  const answerTag = midProse('The answer it should predict', sentX[5], 110, 60, 'red');
  const lossTag = lineProse('Training loss looks good', -440, 355, 72, 'green');
  const failTag = lineProse('Then generation fails', 460, 355, 72, 'red');
  waiting([relevantTag, allowedTag]);
  mask.at(0.15, () =>
    stage.play(fadeIn(sentence), ...dimIn([relevantTag, allowedTag]), {
      duration: 0.45,
    }),
  );
  mask.on('relevant', () =>
    stage.play(...lit([relevantTag]), {
      duration: 0.4,
    }),
  );
  mask.on('allowed', () =>
    stage.play(...lit([allowedTag]), {
      duration: 0.4,
    }),
  );
  mask.on('not-yet', () =>
    stage.play(
      ...future.map((i) => fade(sentence[i], 0)),
      fadeIn(futureBoxes),
      to(sentence[4], (node) => node.color('teal')),
      draw(readBack, {
        lag: 1,
      }),
      {
        duration: 0.6,
      },
    ),
  );
  mask.on('in-training', () =>
    stage.play(...future.map((i) => fade(sentence[i], 1)), fadeOut(futureBoxes), {
      duration: 0.5,
    }),
  );
  mask.on('answer', () =>
    stage.play(
      draw(readAhead, {
        lag: 1,
      }),
      fadeIn(answerTag),
      {
        duration: 0.7,
      },
    ),
  );
  mask.on('loss', () =>
    stage.play(
      fadeOut([relevantTag, allowedTag], {
        duration: 0.25,
      }),
      fadeIn(lossTag),
      {
        duration: 0.5,
      },
    ),
  );
  show(mask, 'fails', failTag);
  const reasonParts = [
    ...sentence,
    relevantTag,
    allowedTag,
    readBack,
    readAhead,
    answerTag,
    lossTag,
    failTag,
  ];
  // Then the mechanism, on the two-word grid of scaled scores.
  const ROWS = ['Birds', 'sing'];
  const tableX = [-60, 440],
    tableY = [-60, 110];
  const rowName = ROWS.map((name, i) =>
    lineProse(name, -520, tableY[i] + 36, 100, i ? 'teal' : 'blue'),
  );
  const colName = ROWS.map((name, i) =>
    text(name, {
      font: 'text-serif',
      size: 76,
      color: i ? 'teal' : 'blue',
    }).at(tableX[i], -165),
  );
  const CELL_SIZE = 118;
  const cell = (value, i, j, color = 'ink') =>
    text(value, {
      font: 'mono',
      size: CELL_SIZE,
      color,
    }).at(tableX[j], tableY[i] + 40);
  const cells = [
    [cell(f2(SCALED[0][0]), 0, 0), cell(f2(SCALED[0][1]), 0, 1)],
    [cell(f2(SCALED[1][0]), 1, 0), cell(f2(SCALED[1][1]), 1, 1)],
  ];
  const blocked = tex('-\\infty', {
    size: 128,
    color: 'red',
  }).at(tableX[1], tableY[0] + 40);
  const zero = text('0.00', {
    font: 'mono',
    size: CELL_SIZE,
    color: 'dim',
  }).at(tableX[1], tableY[0] + 40);
  const one = text('1.00', {
    font: 'mono',
    size: CELL_SIZE,
    color: 'blue',
  }).at(tableX[0], tableY[0] + 40);
  const w10 = text(f2(WEIGHTS[1][0]), {
    font: 'mono',
    size: CELL_SIZE,
    color: 'yellow',
  }).at(tableX[0], tableY[1] + 40);
  const w11 = text(f2(WEIGHTS[1][1]), {
    font: 'mono',
    size: CELL_SIZE,
    color: 'yellow',
  }).at(tableX[1], tableY[1] + 40);
  const maskEqA = tex('\\text{softmax}\\left(\\frac{QK^{\\top}}{\\sqrt{d}}\\right) V', {
    size: 66,
  }).at(-110, -318);
  const maskEqB = tex('\\text{softmax}\\left(\\frac{QK^{\\top}}{\\sqrt{d}} + M\\right) V', {
    size: 66,
  }).at(-110, -318);
  const maskM = tex(
    `M = ${bmatrix([
      ['0', '-\\infty'],
      ['0', '0'],
    ])}`,
    {
      size: 58,
      color: 'red',
    },
  ).moveTo([630, -318]);
  const maskDef = prose(
    'M adds 0 where a read is allowed, and −∞ where it is blocked.',
    LEFT,
    250,
    52,
    'red',
  );
  const tableScores = prose('scaled scores', LEFT, -165, 46, 'dim'),
    tableShares = prose('shares', LEFT, -165, 46, 'yellow');
  const maskIntro = [...rowName, ...colName, ...cells.flat(), tableScores];
  handOver(mask, 'after-scaling', reasonParts, () =>
    stage.play(...maskIntro.map((node) => fadeIn(node)), fadeIn(maskEqA), {
      duration: 0.24,
    }),
  );
  mask.on('negative-infinity', () =>
    stage.play(
      morph(cells[0][1], blocked),
      morphMatching(maskEqA, maskEqB),
      fadeIn([maskM, maskDef]),
      {
        duration: 0.8,
      },
    ),
  );
  mask.on('exactly-zero', () =>
    stage.play(
      morph(blocked, zero),
      fadeOut(cells[0][0]),
      morph(cells[1][0], w10),
      morph(cells[1][1], w11),
      brief(fadeOut(tableScores), 0.16, 0, LINEAR),
      arrive(fadeIn(tableShares), 0.14),
      {
        duration: 0.9,
      },
    ),
  );
  const budgetLine = prose(
    'Mask first: the Birds row is [1.00, 0.00], and it adds to 1.',
    LEFT,
    340,
    54,
    'green',
  );
  const zeroLine = prose(
    `Zero after softmax: [${f2(WEIGHTS[0][0])}, 0.00], and it adds to ${f2(WEIGHTS[0][0])}.`,
    LEFT,
    425,
    54,
    'red',
  );
  assert.notEqual(f2(WEIGHTS[0][0]), '1.00');
  mask.after('budget', () => stage.play(fadeIn([one, budgetLine]), { duration: 0.3 }));
  mask.after('zero-after', () => stage.play(fadeIn(zeroLine), { duration: 0.3 }));
  const keeps = tex('o_{\\text{birds}} = [2,\\ 1]', {
    size: 96,
    color: 'blue',
  }).moveTo([0, 390]);
  mask.on('birds-alone', () =>
    stage.play(
      fadeOut([budgetLine, zeroLine], {
        duration: 0.16,
      }),
      brief(write(keeps), 0.65, 0.12, LINEAR),
      {
        duration: 0.8,
      },
    ),
  );
  const TRI = 8,
    TRI_SIZE = 800,
    TRI_X = 480,
    TRI_Y = 60,
    cellSize = TRI_SIZE / TRI;
  const triFrom = (lower) =>
    gridPath(TRI, TRI_SIZE).filter((_, index) =>
      lower ? index % TRI <= Math.floor(index / TRI) : index % TRI > Math.floor(index / TRI),
    );
  const triangle = new Node(triFrom(true)).fill('yellow', 0.72).at(TRI_X, TRI_Y).glow(4);
  const futureCells = new Node(triFrom(false)).stroke('faint', 1.2).at(TRI_X, TRI_Y);
  const rowLabels = WORDS.map((word, i) =>
    text(word, {
      font: 'text-serif',
      size: 60,
      color: i === 4 ? 'teal' : 'ink',
    })
      .moveTo([0, TRI_Y - TRI_SIZE / 2 + (i + 0.5) * cellSize])
      .alignTo([TRI_X - TRI_SIZE / 2 - 190, 0], 'left'),
  );
  const readsPast = prose(
    'Each word reads itself\nand everything before it.',
    LEFT,
    -130,
    60,
    'yellow',
    {
      leading: 1.14,
    },
  );
  const nothingAfter = prose('Nothing after.', LEFT, 200, 92, 'dim');
  // Text that the new grid would cross leaves first. The left side lingers, so the frame is never empty.
  const leftOfGrid = [...rowName, one, w10, tableShares];
  handOver(
    mask,
    'triangle',
    [...colName, zero, w11, keeps, maskEqB, maskM, maskDef],
    () =>
      stage.play(
        fadeIn(futureCells),
        draw(triangle, {
          lag: 0.02,
        }),
        lagged(
          rowLabels.map((node) => fadeIn(node)),
          {
            lag: 0.1,
          },
        ),
        lagged([fadeIn(readsPast), fadeIn(nothingAfter)], {
          lag: 0.6,
        }),
        {
          duration: 1.1,
        },
      ),
    0.2,
    0.14,
  );
  mask.on('triangle', () =>
    stage.play(
      fadeOut(leftOfGrid, {
        duration: 0.5,
      }),
    ),
  );
  // Padding. A left-padded row can end up with no key to read.
  const PAD_TOKENS = ['PAD', 'Birds', 'sing'],
    PAD_CELL = 150,
    PAD_X = 560,
    PAD_Y = 30;
  const padValid = PAD_TOKENS.map((token) => token !== 'PAD');
  const causalAllowed = (r, c) => c <= r,
    padAllowed = (r, c) => c <= r && padValid[c];
  assert.deepEqual(
    [0, 1, 2].map((r) => [0, 1, 2].filter((c) => padAllowed(r, c)).length),
    [0, 1, 2],
  );
  const padFrame = maskFrame(3, 3, PAD_X, PAD_Y, PAD_CELL);
  const padTriangle = maskCells(3, 3, PAD_X, PAD_Y, PAD_CELL, causalAllowed);
  const padHoles = [0, 1, 2].map((r) =>
    rect(PAD_CELL - 8, PAD_CELL - 8, {
      radius: 6,
      fill: 'surface',
      stroke: 'gridStrong',
      width: 1.5,
    }).at(PAD_X - PAD_CELL, PAD_Y + (r - 1) * PAD_CELL),
  );
  assert(![0, 1, 2].some((r) => padAllowed(r, 0)));
  const padColumn = rect(PAD_CELL - 4, PAD_CELL * 3 - 4, {
    radius: 8,
    stroke: 'red',
    width: 4,
  }).at(PAD_X - PAD_CELL, PAD_Y);
  const padRow = rect(PAD_CELL * 3 - 4, PAD_CELL - 4, {
    radius: 8,
    stroke: 'red',
    width: 4,
  }).at(PAD_X, PAD_Y - PAD_CELL);
  const padRows = PAD_TOKENS.map((token, i) =>
    midMono(token, PAD_X - PAD_CELL * 2 - 50, PAD_Y + (i - 1) * PAD_CELL, 44, i ? 'ink' : 'red'),
  );
  const padCols = PAD_TOKENS.map((token, i) =>
    midMono(token, PAD_X + (i - 1) * PAD_CELL, PAD_Y - PAD_CELL * 2 + 22, 44, i ? 'ink' : 'red'),
  );
  const fakeTag = prose('Short sentences get fake tokens.', LEFT, -270, 60);
  const padKeyTag = prose(
    'A padding mask stops\nevery query reading them.',
    LEFT,
    -130,
    60,
    'red',
    {
      leading: 1.14,
    },
  );
  const padQueryTag = prose('But a fake token can\nalso be a query.', LEFT, 40, 60, 'orange', {
    leading: 1.14,
  });
  const noKeyTag = prose(
    'Left padding, plus the triangle:\nno key left to read.',
    LEFT,
    230,
    60,
    'red',
    {
      leading: 1.14,
    },
  );
  mask.on('padding', () =>
    stage.play(
      fadeOut([triangle, futureCells, ...rowLabels, readsPast, nothingAfter], {
        duration: 0.16,
      }),
      arrive(fadeIn([padFrame, ...padRows, ...padCols])),
      {
        duration: 0.42,
      },
    ),
  );
  show(mask, 'fake', fakeTag);
  mask.on('pad-mask', () =>
    stage.play(draw(padColumn), fadeIn(padKeyTag), {
      duration: 0.6,
    }),
  );
  mask.on('as-query', () =>
    stage.play(draw(padRow), fadeIn(padQueryTag), {
      duration: 0.6,
    }),
  );
  mask.on('left-pad', () =>
    stage.play(fadeIn(padTriangle), {
      duration: 0.6,
    }),
  );
  mask.on('both-masks', () =>
    stage.play(fadeIn(padHoles), {
      duration: 0.6,
    }),
  );
  mask.on('no-key', () =>
    stage.play(fadeIn(noKeyTag), {
      duration: 0.6,
    }),
  );
  // What softmax does with that empty row, and what to do instead.
  const emptyTitle = math(
    '\\text{softmax}([-\\infty,\\ -\\infty,\\ -\\infty])',
    LEFT,
    -280,
    68,
    'red',
  );
  const nanLine = prose('Textbook formula: not a number.', LEFT, -150, 60);
  const kernelLine = prose('Some kernels: quietly zeros.', LEFT, -50, 60);
  const fillTitle = prose('Overwrite with a large negative:', LEFT, -150, 60, 'orange');
  const fillLine = math(
    '[-10^4,\\ -10^4,\\ -10^4] \\to [\\tfrac{1}{3},\\ \\tfrac{1}{3},\\ \\tfrac{1}{3}]',
    LEFT,
    -50,
    52,
    'orange',
  );
  const fillNote = prose('An even split over blocked keys.', LEFT, 50, 56, 'orange');
  const realLine = prose('Every real query: at least one key.', LEFT, -150, 60, 'green');
  const zeroPad = prose('Padded queries: zero, on purpose.', LEFT, -50, 60, 'green');
  mask.on('no-answer', () =>
    stage.play(
      fadeOut([fakeTag, padKeyTag, padQueryTag, noKeyTag], {
        duration: 0.16,
      }),
      arrive(fadeIn(emptyTitle)),
      {
        duration: 0.42,
      },
    ),
  );
  mask.after('nan', () => stage.play(fadeIn(nanLine), { duration: 0.3 }));
  show(mask, 'kernels', kernelLine);
  mask.on('overwrite', () => {
    stage.play(fadeOut([nanLine, kernelLine]), {
      duration: 0.2,
    });
    stage.play(fadeIn(fillTitle), {
      duration: 0.3,
    });
  });
  mask.after('even-split', () => stage.play(fadeIn([fillLine, fillNote]), { duration: 0.3 }));
  mask.on('real-query', () => {
    stage.play(fadeOut([fillTitle, fillLine, fillNote]), {
      duration: 0.2,
    });
    stage.play(fadeIn(realLine), {
      duration: 0.3,
    });
  });
  show(mask, 'zero-out', zeroPad);
  dropCovered(
    mask,
    [0, 1, 3].map((i) => padTriangle.children[i]),
  );
  leave(mask, [
    padFrame,
    padTriangle,
    ...padHoles,
    padColumn,
    padRow,
    ...padRows,
    ...padCols,
    emptyTitle,
    realLine,
    zeroPad,
  ]);
}
